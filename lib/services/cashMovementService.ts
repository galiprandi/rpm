import { db, type Database } from "@/lib/db";
import { cashMovement } from "@/db/schema";
import { eq, and, gte, lte, desc, inArray, type SQL } from "drizzle-orm";
import { getArgentinaStartOfDay, getArgentinaEndOfDay } from "@/lib/utils/date";
import { invalidateCashStatus } from "@/lib/cache";

type DbOrTx = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

export interface CashMovementInput {
  type: "INCOME" | "EXPENSE" | "OPENING" | "CLOSING" | "COUNT";
  amount: number;
  method: string;
  referenceId?: string;
  referenceType?:
    | "work_order_payment"
    | "direct_sale_payment"
    | "customer_payment"
    | "credit_note_refund"
    | "credit_note_cancelled"
    | "manual";
  reason?: string;
  notes?: string;
  createdBy: string;
}

export async function createCashMovement(
  data: CashMovementInput,
  tx?: DbOrTx,
) {
  const client = tx ?? db;
  const [result] = await client
    .insert(cashMovement)
    .values({
      id: crypto.randomUUID(),
      type: data.type,
      amount: data.amount.toString(),
      method: data.method,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      reason: data.reason,
      notes: data.notes,
      createdBy: data.createdBy,
    })
    .returning();

  // Invalidate cash status cache so the UI always reflects fresh data
  if (!tx) {
    invalidateCashStatus();
  }

  return result;
}

export async function getCashMovements(filters: {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  method?: string;
}) {
  const conditions: SQL[] = [];

  if (filters.startDate || filters.endDate) {
    if (filters.startDate) conditions.push(gte(cashMovement.createdAt, filters.startDate.toISOString()));
    if (filters.endDate) conditions.push(lte(cashMovement.createdAt, filters.endDate.toISOString()));
  }

  if (filters.type) conditions.push(eq(cashMovement.type, filters.type));
  if (filters.method) conditions.push(eq(cashMovement.method, filters.method));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db.query.cashMovement.findMany({
    where,
    orderBy: desc(cashMovement.createdAt),
  });
}

export async function getCashMovementSummary(date: Date) {
  const startOfDay = getArgentinaStartOfDay(date);
  const endOfDay = getArgentinaEndOfDay(date);

  const movements = await db.query.cashMovement.findMany({
    where: and(
      gte(cashMovement.createdAt, startOfDay.toISOString()),
      lte(cashMovement.createdAt, endOfDay.toISOString()),
    ),
  });

  const summary = {
    opening: 0,
    income: 0,
    expense: 0,
    closing: 0,
    total: 0,
  };

  for (const movement of movements) {
    const amount = Number(movement.amount);
    switch (movement.type) {
      case "OPENING":
        summary.opening += amount;
        break;
      case "INCOME":
        summary.income += amount;
        break;
      case "EXPENSE":
      case "PURCHASE_VOUCHER":
        summary.expense += amount;
        break;
      case "CLOSING":
        summary.closing += amount;
        break;
    }
  }

  summary.total = summary.opening + summary.income - summary.expense;

  return summary;
}

/**
 * Checks if there is an open cash register.
 * A register is open if the latest OPENING/CLOSING movement is an OPENING.
 */
export async function isCashRegisterOpen(): Promise<boolean> {
  // Find the absolute latest OPENING or CLOSING movement
  const lastMovement = await db.query.cashMovement.findFirst({
    where: inArray(cashMovement.type, ["OPENING", "CLOSING"]),
    orderBy: desc(cashMovement.createdAt),
  });

  // If no opening/closing ever happened, it's closed
  if (!lastMovement) return false;

  // If the last movement was an opening, it's still open
  return lastMovement.type === "OPENING";
}
