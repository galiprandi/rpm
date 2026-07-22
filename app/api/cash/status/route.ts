import { NextResponse } from "next/server";
import { withStaff } from "@/lib/api-middleware";
import { db } from "@/lib/db";
import { cashMovement, paymentMethod } from "@/db/schema";
import { eq, desc, gte, inArray, and } from "drizzle-orm";

// Helper para convertir Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === "number") return decimal;
  if (typeof decimal === "string") return Number(decimal);
  return 0;
}

interface PaymentMethod {
  code: string;
  name: string;
}

interface CashMovement {
  type: string;
  method: string;
  amount: string;
  createdAt: string;
}

// Direct DB query - no cache to avoid stale data issues after cash movements
async function getCashStatus() {
  // Find the absolute latest OPENING or CLOSING movement
  const lastMovement = await db.query.cashMovement.findFirst({
    where: inArray(cashMovement.type, ["OPENING", "CLOSING"]),
    orderBy: desc(cashMovement.createdAt),
  });

  const isOpen = lastMovement?.type === "OPENING";
  const lastOpening = isOpen
    ? lastMovement
    : await db.query.cashMovement.findFirst({
        where: eq(cashMovement.type, "OPENING"),
        orderBy: desc(cashMovement.createdAt),
      });

  const lastClosingAtOpening = lastOpening
    ? await db.query.cashMovement.findFirst({
        where: and(
          eq(cashMovement.type, "CLOSING"),
          gte(cashMovement.createdAt, lastOpening.createdAt),
        ),
        orderBy: desc(cashMovement.createdAt),
      })
    : null;

  // Get all payment methods for the summary
  const paymentMethods = await db
    .select({ code: paymentMethod.code, name: paymentMethod.name })
    .from(paymentMethod)
    .where(eq(paymentMethod.isActive, true));

  // Build summary by method
  const summary: Record<
    string,
    {
      opening: number;
      income: number;
      expense: number;
      expected: number;
    }
  > = {};

  // Initialize with all payment methods (including CASH)
  const allMethods = [
    "CASH",
    ...paymentMethods.map((pm: PaymentMethod) => pm.code),
  ];
  allMethods.forEach((method) => {
    summary[method] = { opening: 0, income: 0, expense: 0, expected: 0 };
  });

  if (isOpen && lastOpening) {
    // Get all movements since opening
    const movements = await db.query.cashMovement.findMany({
      where: gte(cashMovement.createdAt, lastOpening.createdAt),
    });

    movements.forEach((movement: CashMovement) => {
      const method = movement.method;
      const amount = decimalToNumber(movement.amount);

      if (!summary[method]) {
        summary[method] = { opening: 0, income: 0, expense: 0, expected: 0 };
      }

      switch (movement.type) {
        case "OPENING":
          summary[method].opening += amount;
          break;
        case "INCOME":
          summary[method].income += amount;
          break;
        case "EXPENSE":
        case "PURCHASE_VOUCHER":
          summary[method].expense += amount;
          break;
      }
    });

    // Calculate expected for each method
    Object.keys(summary).forEach((method) => {
      summary[method].expected =
        summary[method].opening +
        summary[method].income -
        summary[method].expense;
    });
  }

  // Get last closing amount for suggestion
  const lastClosing = await db.query.cashMovement.findFirst({
    where: and(
      eq(cashMovement.type, "CLOSING"),
      eq(cashMovement.method, "CASH"),
    ),
    orderBy: desc(cashMovement.createdAt),
  });

  return {
    status: isOpen ? "OPEN" : "CLOSED",
    openedAt: lastOpening?.createdAt ? new Date(lastOpening.createdAt).toISOString() : null,
    openedBy: lastOpening?.createdBy || null,
    closedAt: lastClosingAtOpening?.createdAt ? new Date(lastClosingAtOpening.createdAt).toISOString() : null,
    summary,
    suggestedOpeningAmount: lastClosing
      ? decimalToNumber(lastClosing.amount)
      : 0,
  };
}

// GET /api/cash/status - Get current cash register status
export const GET = withStaff(async () => {
  try {
    const data = await getCashStatus();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching cash status:", error);
    return NextResponse.json(
      { error: "Failed to fetch cash status" },
      { status: 500 },
    );
  }
});
