import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hasRole, UserRole } from "@/lib/auth/roles";

// GET /api/work-orders/[id]/payments - List payments with totals
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workOrderId } = await params;

    // Verify work order exists
    const workOrder = await prisma.work_order.findUnique({
      where: { id: workOrderId },
      select: { total: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    // Fetch payments with payment method details
    const payments = await prisma.payment.findMany({
      where: { workOrderId },
      include: {
        paymentMethod: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totalPaid = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    const workOrderTotal = Number(workOrder.total);
    const pendingAmount = Math.max(0, workOrderTotal - totalPaid);
    const isFullyPaid = totalPaid >= workOrderTotal;

    return NextResponse.json({
      payments,
      totalPaid,
      pendingAmount,
      isFullyPaid,
      workOrderTotal,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/work-orders/[id]/payments - Register new payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is SELLER or ADMIN (only these roles can register payments)
    const isAdmin = await hasRole(session.user.id, UserRole.ADMIN);
    const isStaff = await hasRole(session.user.id, UserRole.STAFF);
    
    if (!isAdmin && !isStaff) {
      return NextResponse.json(
        { error: "Only staff can register payments" },
        { status: 403 }
      );
    }

    const { id: workOrderId } = await params;
    const body = await request.json();
    const { paymentMethodId, amount, notes } = body;

    // Validation
    if (!paymentMethodId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Payment method and positive amount are required" },
        { status: 400 }
      );
    }

    // Verify work order exists
    const workOrder = await prisma.work_order.findUnique({
      where: { id: workOrderId },
      select: { total: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    // Verify payment method exists and is active
    const paymentMethod = await prisma.payment_method.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    if (!paymentMethod.isActive) {
      return NextResponse.json(
        { error: "Payment method is not active" },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        workOrderId,
        paymentMethodId,
        amount,
        notes,
        createdBy: session.user.id,
      },
      include: {
        paymentMethod: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Calculate updated totals
    const allPayments = await prisma.payment.findMany({
      where: { workOrderId },
      select: { amount: true },
    });

    const totalPaid = allPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const workOrderTotal = Number(workOrder.total);
    const pendingAmount = Math.max(0, workOrderTotal - totalPaid);
    const isFullyPaid = totalPaid >= workOrderTotal;

    return NextResponse.json({
      payment,
      totalPaid,
      pendingAmount,
      isFullyPaid,
      workOrderTotal,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
