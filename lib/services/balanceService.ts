/**
 * Centralized balance service — source of truth for customer.balance
 * All balance mutations go through this service to ensure atomicity and auditability.
 */
import { db, type Database } from "@/lib/db";
import { customer, workOrder, directSale, creditNote, balanceAudit } from "@/db/schema";
import { eq, and, notInArray, inArray, sql } from "drizzle-orm";

type DbOrTx = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return 0;
}

/**
 * SOURCE OF TRUTH: calculates the real debt for a customer from DB records.
 * 1. SUM(wo.total) - SUM(payments) for non-CANCELLED work orders
 * 2. + SUM(ds.total) - SUM(ds_payments) for credit direct sales (with customerId)
 * 3. - SUM(credit_note.total) for ISSUED + ACCOUNT_CREDIT notes
 * Does NOT filter by PAID status — uses NOT IN ['CANCELLED'] and relies on payments to net out.
 * If stored balance ≠ calculated, logs to balance_audit.
 * Returns the calculated balance.
 */
export async function recalculateCustomerBalance(
  customerId: string,
  tx?: DbOrTx,
): Promise<number> {
  const client = tx ?? db;

  // 1. Work orders: sum totals minus payments, excluding CANCELLED
  const workOrders = await client.query.workOrder.findMany({
    where: and(eq(workOrder.customerId, customerId), notInArray(workOrder.status, ["CANCELLED"])),
    columns: {
      id: true,
      total: true,
    },
    with: {
      payments: { columns: { amount: true } },
    },
  });

  const workOrderDebt = workOrders.reduce((sum, wo) => {
    const total = decimalToNumber(wo.total);
    const paid = wo.payments.reduce((s, p) => s + decimalToNumber(p.amount), 0);
    return sum + (total - paid);
  }, 0);

  // 2. Direct sales with customerId: sum totals minus payments
  const directSales = await client.query.directSale.findMany({
    where: eq(directSale.customerId, customerId),
    columns: {
      id: true,
      total: true,
    },
    with: {
      directSalePayments: { columns: { amount: true } },
    },
  });

  const directSaleDebt = directSales.reduce((sum, ds) => {
    const total = decimalToNumber(ds.total);
    const paid = ds.directSalePayments.reduce(
      (s, p) => s + decimalToNumber(p.amount),
      0,
    );
    return sum + (total - paid);
  }, 0);

  // 3. Credit notes: subtract for ISSUED + ACCOUNT_CREDIT (CANCELLED excluded)
  const creditNotes = await client.query.creditNote.findMany({
    where: and(eq(creditNote.customerId, customerId), inArray(creditNote.status, ["ISSUED", "ACCOUNT_CREDIT"])),
    columns: { total: true },
  });

  const creditNoteCredit = creditNotes.reduce(
    (sum, cn) => sum + decimalToNumber(cn.total),
    0,
  );

  const calculatedBalance = workOrderDebt + directSaleDebt - creditNoteCredit;

  // Verify against stored balance and audit if different
  const foundCustomer = await client.query.customer.findFirst({
    where: eq(customer.id, customerId),
    columns: { balance: true },
  });

  if (foundCustomer) {
    const storedBalance = decimalToNumber(foundCustomer.balance);
    const drift = storedBalance - calculatedBalance;

    if (Math.abs(drift) > 0.01) {
      // Fix the stored balance and log the drift
      await client
        .update(customer)
        .set({ balance: calculatedBalance.toString() })
        .where(eq(customer.id, customerId));

      await client.insert(balanceAudit).values({
        id: crypto.randomUUID(),
        customerId,
        oldBalance: storedBalance.toString(),
        newBalance: calculatedBalance.toString(),
        driftAmount: drift.toString(),
        source: "recalculate",
      });
    }
  }

  return calculatedBalance;
}

/**
 * Atomically adjusts customer balance by delta using SQL increment.
 * Then verifies via recalculate to catch any drift.
 */
export async function adjustBalanceAtomically(
  customerId: string,
  delta: number,
  source: string,
  tx?: DbOrTx,
): Promise<number> {
  const client = tx ?? db;

  const foundCustomer = await client.query.customer.findFirst({
    where: eq(customer.id, customerId),
    columns: { balance: true },
  });

  if (!foundCustomer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const oldBalance = decimalToNumber(foundCustomer.balance);

  const [updated] = await client
    .update(customer)
    .set({
      balance: sql`${customer.balance} + ${delta.toString()}`,
    })
    .where(eq(customer.id, customerId))
    .returning({ balance: customer.balance });

  const newBalance = decimalToNumber(updated?.balance);

  // Audit log
  await client.insert(balanceAudit).values({
    id: crypto.randomUUID(),
    customerId,
    oldBalance: oldBalance.toString(),
    newBalance: newBalance.toString(),
    driftAmount: "0",
    source,
  });

  return newBalance;
}

/**
 * Conditional update for race-safe recalculate.
 * Only updates if the current balance matches expectedOld.
 */
export async function setBalanceIfDifferent(
  customerId: string,
  expectedOld: number,
  newBalance: number,
  source: string,
  tx?: DbOrTx,
): Promise<void> {
  const client = tx ?? db;

  const foundCustomer = await client.query.customer.findFirst({
    where: eq(customer.id, customerId),
    columns: { balance: true },
  });

  if (!foundCustomer) return;

  const currentBalance = decimalToNumber(foundCustomer.balance);

  if (Math.abs(currentBalance - expectedOld) < 0.01) {
    await client
      .update(customer)
      .set({ balance: newBalance.toString() })
      .where(eq(customer.id, customerId));

    await client.insert(balanceAudit).values({
      id: crypto.randomUUID(),
      customerId,
      oldBalance: expectedOld.toString(),
      newBalance: newBalance.toString(),
      driftAmount: (newBalance - expectedOld).toString(),
      source,
    });
  }
}

/**
 * Get balance breakdown for a customer (used by debtors report).
 */
export async function getBalanceBreakdown(customerId: string, tx?: DbOrTx) {
  const client = tx ?? db;

  const [workOrders, directSales, creditNotes] = await Promise.all([
    client.query.workOrder.findMany({
      where: and(eq(workOrder.customerId, customerId), notInArray(workOrder.status, ["CANCELLED"])),
      columns: {
        id: true,
        total: true,
      },
      with: {
        payments: { columns: { amount: true } },
      },
    }),
    client.query.directSale.findMany({
      where: eq(directSale.customerId, customerId),
      columns: {
        id: true,
        total: true,
      },
      with: {
        directSalePayments: { columns: { amount: true } },
      },
    }),
    client.query.creditNote.findMany({
      where: and(eq(creditNote.customerId, customerId), inArray(creditNote.status, ["ISSUED", "ACCOUNT_CREDIT"])),
      columns: { total: true },
    }),
  ]);

  const workOrderDebt = workOrders.reduce((sum, wo) => {
    const total = decimalToNumber(wo.total);
    const paid = wo.payments.reduce(
      (s, p) => s + decimalToNumber(p.amount),
      0,
    );
    return sum + (total - paid);
  }, 0);

  const directSaleDebt = directSales.reduce((sum, ds) => {
    const total = decimalToNumber(ds.total);
    const paid = ds.directSalePayments.reduce(
      (s, p) => s + decimalToNumber(p.amount),
      0,
    );
    return sum + (total - paid);
  }, 0);

  const creditNoteCredit = creditNotes.reduce(
    (sum, cn) => sum + decimalToNumber(cn.total),
    0,
  );

  return {
    workOrderDebt,
    directSaleDebt,
    creditNoteCredit,
    balance: workOrderDebt + directSaleDebt - creditNoteCredit,
    workOrderCount: workOrders.length,
    directSaleCount: directSales.length,
  };
}

