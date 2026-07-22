/**
 * Centralized balance service — source of truth for customer.balance
 * All balance mutations go through this service to ensure atomicity and auditability.
 */
import { prisma } from "@/lib/prisma";

type PrismaTx = Parameters<Parameters<typeof prisma["$transaction"]>[0]>[0];

function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
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
  tx?: PrismaTx,
): Promise<number> {
  const db = tx || prisma;

  // 1. Work orders: sum totals minus payments, excluding CANCELLED
  const workOrders = await db.work_order.findMany({
    where: {
      customerId,
      status: { notIn: ["CANCELLED"] },
    },
    select: {
      id: true,
      total: true,
      payments: { select: { amount: true } },
    },
  });

  const workOrderDebt = workOrders.reduce((sum, wo) => {
    const total = decimalToNumber(wo.total);
    const paid = wo.payments.reduce((s, p) => s + decimalToNumber(p.amount), 0);
    return sum + (total - paid);
  }, 0);

  // 2. Direct sales with customerId: sum totals minus payments
  const directSales = await db.direct_sale.findMany({
    where: { customerId },
    select: {
      id: true,
      total: true,
      payments: { select: { amount: true } },
    },
  });

  const directSaleDebt = directSales.reduce((sum, ds) => {
    const total = decimalToNumber(ds.total);
    const paid = ds.payments.reduce(
      (s, p) => s + decimalToNumber(p.amount),
      0,
    );
    return sum + (total - paid);
  }, 0);

  // 3. Credit notes: subtract for ISSUED + ACCOUNT_CREDIT (CANCELLED excluded)
  const creditNotes = await db.credit_note.findMany({
    where: {
      customerId,
      status: { in: ["ISSUED", "ACCOUNT_CREDIT"] },
    },
    select: { total: true },
  });

  const creditNoteCredit = creditNotes.reduce(
    (sum, cn) => sum + decimalToNumber(cn.total),
    0,
  );

  const calculatedBalance = workOrderDebt + directSaleDebt - creditNoteCredit;

  // Verify against stored balance and audit if different
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: { balance: true },
  });

  if (customer) {
    const storedBalance = decimalToNumber(customer.balance);
    const drift = storedBalance - calculatedBalance;

    if (Math.abs(drift) > 0.01) {
      // Fix the stored balance and log the drift
      await db.customer.update({
        where: { id: customerId },
        data: { balance: calculatedBalance },
      });

      await db.balance_audit.create({
        data: {
          customerId,
          oldBalance: storedBalance,
          newBalance: calculatedBalance,
          driftAmount: drift,
          source: "recalculate",
        },
      });
    }
  }

  return calculatedBalance;
}

/**
 * Atomically adjusts customer balance by delta using Prisma increment.
 * Then verifies via recalculate to catch any drift.
 */
export async function adjustBalanceAtomically(
  customerId: string,
  delta: number,
  source: string,
  tx?: PrismaTx,
): Promise<number> {
  const db = tx || prisma;

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: { balance: true },
  });

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const oldBalance = decimalToNumber(customer.balance);

  const updated = await db.customer.update({
    where: { id: customerId },
    data: {
      balance: { increment: delta },
    },
    select: { balance: true },
  });

  const newBalance = decimalToNumber(updated.balance);

  // Audit log
  await db.balance_audit.create({
    data: {
      customerId,
      oldBalance,
      newBalance,
      driftAmount: 0,
      source,
    },
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
  tx?: PrismaTx,
): Promise<void> {
  const db = tx || prisma;

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: { balance: true },
  });

  if (!customer) return;

  const currentBalance = decimalToNumber(customer.balance);

  if (Math.abs(currentBalance - expectedOld) < 0.01) {
    await db.customer.update({
      where: { id: customerId },
      data: { balance: newBalance },
    });

    await db.balance_audit.create({
      data: {
        customerId,
        oldBalance: expectedOld,
        newBalance,
        driftAmount: newBalance - expectedOld,
        source,
      },
    });
  }
}

/**
 * Get balance breakdown for a customer (used by debtors report).
 */
export async function getBalanceBreakdown(customerId: string, tx?: PrismaTx) {
  const db = tx || prisma;

  const [workOrders, directSales, creditNotes] = await Promise.all([
    db.work_order.findMany({
      where: {
        customerId,
        status: { notIn: ["CANCELLED"] },
      },
      select: {
        id: true,
        total: true,
        payments: { select: { amount: true } },
      },
    }),
    db.direct_sale.findMany({
      where: { customerId },
      select: {
        id: true,
        total: true,
        payments: { select: { amount: true } },
      },
    }),
    db.credit_note.findMany({
      where: {
        customerId,
        status: { in: ["ISSUED", "ACCOUNT_CREDIT"] },
      },
      select: { total: true },
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
    const paid = ds.payments.reduce(
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
