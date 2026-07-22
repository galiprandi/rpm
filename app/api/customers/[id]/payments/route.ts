import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import { invalidateCashStatus } from "@/lib/cache";
import { adjustBalanceAtomically } from "@/lib/services/balanceService";

// Helper para convertir Decimal a number
function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === "number") return decimal;
  if (
    typeof decimal === "object" &&
    "toNumber" in decimal &&
    typeof (decimal as { toNumber: () => number }).toNumber === "function"
  ) {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  return 0;
}

// POST /api/customers/[id]/payments - Register a payment against customer's balance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSessionWithAuth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has required role (STAFF or ADMIN)
    const userRole =
      ((session.user as { role?: string }).role as UserRole) || UserRole.USER;
    const roleHierarchy = {
      [UserRole.USER]: 0,
      [UserRole.STAFF]: 1,
      [UserRole.ADMIN]: 2,
    };

    if (roleHierarchy[userRole] < roleHierarchy[UserRole.STAFF]) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { amount, method, notes } = body;

    // Validate required fields
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number" },
        { status: 400 },
      );
    }

    if (!method || typeof method !== "string") {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 },
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { id: true, name: true, balance: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Start transaction: adjust balance atomically and mark individual OTs/direct sales as PAID
    const result = await prisma.$transaction(async (tx) => {
      // Adjust customer balance atomically
      const newBalance = await adjustBalanceAtomically(
        id,
        -amount,
        "payment",
        tx,
      );

      // Create a cash movement record for this payment
      const paymentMovement = await tx.cash_movement.create({
        data: {
          type: "INCOME",
          amount,
          method,
          referenceType: "customer_payment",
          referenceId: id,
          reason: "Pago de cuenta corriente",
          notes: notes || undefined,
          createdBy: session.user.id,
        },
      });

      // Mark individual work orders as PAID if their total - payments <= 0
      const customerWorkOrders = await tx.work_order.findMany({
        where: {
          customerId: id,
          status: { notIn: ["CANCELLED", "PAID"] },
        },
        select: {
          id: true,
          total: true,
          payments: { select: { amount: true } },
        },
      });

      for (const wo of customerWorkOrders) {
        const woTotal = decimalToNumber(wo.total);
        const woPaid = wo.payments.reduce(
          (s, p) => s + decimalToNumber(p.amount),
          0,
        );
        if (woTotal - woPaid <= 0.01) {
          await tx.work_order.update({
            where: { id: wo.id },
            data: { status: "PAID" },
          });
        }
      }

      // Mark individual direct sales as fully paid if applicable
      const customerDirectSales = await tx.direct_sale.findMany({
        where: { customerId: id },
        select: {
          id: true,
          total: true,
          payments: { select: { amount: true } },
        },
      });

      for (const ds of customerDirectSales) {
        const dsTotal = decimalToNumber(ds.total);
        const dsPaid = ds.payments.reduce(
          (s, p) => s + decimalToNumber(p.amount),
          0,
        );
        if (dsTotal - dsPaid <= 0.01) {
          // Direct sales don't have a status field, but we can track via payments
          // No status update needed — balance is the source of truth
        }
      }

      return { newBalance, paymentMovement };
    });

    // Revalidate relevant paths
    revalidatePath(`/adm/customers/${id}`);
    revalidatePath("/adm/customers");
    revalidatePath("/adm/work-orders");
    invalidateCashStatus();

    const finalNewBalance = result.newBalance;
    const previousBalance = finalNewBalance + amount;

    return NextResponse.json(
      {
        success: true,
        payment: {
          id: result.paymentMovement.id,
          amount: result.paymentMovement.amount,
          method: result.paymentMovement.method,
          notes: result.paymentMovement.notes,
          createdAt: result.paymentMovement.createdAt,
        },
        customer: {
          id: id,
          name: customer.name,
          previousBalance: previousBalance,
          newBalance: finalNewBalance,
          hasCredit: finalNewBalance < 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error registering payment:", error);
    return NextResponse.json(
      { error: "Failed to register payment" },
      { status: 500 },
    );
  }
}
