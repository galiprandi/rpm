import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { db } from "@/lib/db";
import { workOrder, payment, paymentMethod } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { hasRole, UserRole } from "@/lib/auth/roles";
import {
  isCashRegisterOpen,
  createCashMovement,
} from "@/lib/services/cashMovementService";
import { invalidateCashStatus } from "@/lib/cache";
import { adjustBalanceAtomically } from "@/lib/services/balanceService";
import { toISODate } from "@/lib/utils/date";

// GET /api/work-orders/[id]/payments - List payments with totals
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workOrderId } = await params;

    // Verify work order exists
    const workOrderRecord = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, workOrderId),
      columns: { total: true },
    });

    if (!workOrderRecord) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    // Fetch payments with payment method details
    const payments = await db.query.payment.findMany({
      where: eq(payment.workOrderId, workOrderId),
      with: {
        paymentMethod: {
          columns: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: desc(payment.createdAt),
    });

    // Calculate totals
    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const workOrderTotal = Number(workOrderRecord.total);
    const pendingAmount = Math.max(0, workOrderTotal - totalPaid);
    const isFullyPaid = totalPaid >= workOrderTotal;

    return NextResponse.json({
      payments: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        createdAt: toISODate(p.createdAt),
      })),
      totalPaid,
      pendingAmount,
      isFullyPaid,
      workOrderTotal,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

// POST /api/work-orders/[id]/payments - Register new payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is SELLER or ADMIN (only these roles can register payments)
    const isAdmin = await hasRole(session.user.id, UserRole.ADMIN);
    const isStaff = await hasRole(session.user.id, UserRole.STAFF);

    if (!isAdmin && !isStaff) {
      return NextResponse.json(
        { error: "Only staff can register payments" },
        { status: 403 },
      );
    }

    // Check if cash register is open
    const isOpen = await isCashRegisterOpen();
    if (!isOpen) {
      return NextResponse.json(
        {
          error:
            "La caja está cerrada. Debe abrir la caja para registrar pagos.",
        },
        { status: 400 },
      );
    }

    const { id: workOrderId } = await params;
    const body = await request.json();
    const { paymentMethodId, amount, notes } = body;

    // Validation
    if (!paymentMethodId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Payment method and positive amount are required" },
        { status: 400 },
      );
    }

    // Verify work order exists
    const workOrderRecord = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, workOrderId),
      columns: { total: true, customerId: true },
    });

    if (!workOrderRecord) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    // Verify payment method exists and is active
    const paymentMethodRecord = await db.query.paymentMethod.findFirst({
      where: eq(paymentMethod.id, paymentMethodId),
    });

    if (!paymentMethodRecord) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 },
      );
    }

    if (!paymentMethodRecord.isActive) {
      return NextResponse.json(
        { error: "Payment method is not active" },
        { status: 400 },
      );
    }

    // Create payment and cash movement in a transaction
    const newPaymentId = crypto.randomUUID();
    const newPayment = await db.transaction(async (tx) => {
      const [created] = await tx.insert(payment).values({
        id: newPaymentId,
        workOrderId,
        paymentMethodId,
        amount: String(amount),
        notes,
        createdBy: session.user.id,
      }).returning();

      // Create cash movement
      await createCashMovement(
        {
          type: "INCOME",
          amount,
          method: paymentMethodRecord.code,
          referenceId: created.id,
          referenceType: "work_order_payment",
          reason: `Pago OT #${workOrderId.substring(0, 8)}`,
          createdBy: session.user.id,
        },
        tx,
      );

      // Update customer balance atomically
      if (workOrderRecord.customerId) {
        await adjustBalanceAtomically(
          workOrderRecord.customerId,
          -amount,
          "payment",
          tx,
        );
      }

      return created;
    });

    // Fetch the payment with payment method details
    const paymentWithRelations = await db.query.payment.findFirst({
      where: eq(payment.id, newPaymentId),
      with: {
        paymentMethod: {
          columns: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Calculate updated totals
    const allPayments = await db.query.payment.findMany({
      where: eq(payment.workOrderId, workOrderId),
      columns: { amount: true },
    });

    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const workOrderTotal = Number(workOrderRecord.total);
    const pendingAmount = Math.max(0, workOrderTotal - totalPaid);
    const isFullyPaid = totalPaid >= workOrderTotal;

    // Update work order status to PAID if fully paid
    if (isFullyPaid) {
      await db.update(workOrder)
        .set({ status: "PAID" })
        .where(eq(workOrder.id, workOrderId));
    }

    invalidateCashStatus();

    return NextResponse.json(
      {
        payment: paymentWithRelations
          ? {
              ...paymentWithRelations,
              amount: Number(paymentWithRelations.amount),
              createdAt: toISODate(paymentWithRelations.createdAt),
            }
          : null,
        totalPaid,
        pendingAmount,
        isFullyPaid,
        workOrderTotal,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}
