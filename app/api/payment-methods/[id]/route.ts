import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { prisma } from "@/lib/prisma";
import { hasRole, UserRole } from "@/lib/auth/roles";

// GET /api/payment-methods/[id] - Get single payment method
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const paymentMethod = await prisma.payment_method.findUnique({
      where: { id },
      include: {
        _count: {
          select: { payments: true },
        },
      },
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ paymentMethod });
  } catch (error) {
    console.error("Error fetching payment method:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment method" },
      { status: 500 },
    );
  }
}

// PUT /api/payment-methods/[id] - Update payment method (ADMIN only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ADMIN
    if (!(await hasRole(session.user.id, UserRole.ADMIN))) {
      return NextResponse.json(
        { error: "Only ADMIN can update payment methods" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, isActive, sortOrder } = body;

    // Check if payment method exists
    const existing = await prisma.payment_method.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 },
      );
    }

    const paymentMethod = await prisma.payment_method.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
        sortOrder,
      },
    });

    return NextResponse.json({ paymentMethod });
  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      { error: "Failed to update payment method" },
      { status: 500 },
    );
  }
}

// DELETE /api/payment-methods/[id] - Delete payment method (ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ADMIN
    if (!(await hasRole(session.user.id, UserRole.ADMIN))) {
      return NextResponse.json(
        { error: "Only ADMIN can delete payment methods" },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Check if payment method exists
    const existing = await prisma.payment_method.findUnique({
      where: { id },
      include: {
        _count: {
          select: { payments: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 },
      );
    }

    // Check if payment method has associated payments
    if (existing._count.payments > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete payment method with associated payments",
          paymentsCount: existing._count.payments,
        },
        { status: 409 },
      );
    }

    await prisma.payment_method.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 },
    );
  }
}
