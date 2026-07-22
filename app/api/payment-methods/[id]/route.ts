import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { db } from "@/lib/db";
import { paymentMethod, payment } from "@/db/schema";
import { eq, count } from "drizzle-orm";
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

    const pm = await db.query.paymentMethod.findFirst({
      where: eq(paymentMethod.id, id),
    });

    if (!pm) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 },
      );
    }

    // Count associated payments
    const paymentsCountResult = await db
      .select({ value: count() })
      .from(payment)
      .where(eq(payment.paymentMethodId, id));
    const paymentsCount = paymentsCountResult[0]?.value || 0;

    return NextResponse.json({ paymentMethod: { ...pm, _count: { payments: paymentsCount } } });
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
    const existing = await db.query.paymentMethod.findFirst({
      where: eq(paymentMethod.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 },
      );
    }

    const [updated] = await db
      .update(paymentMethod)
      .set({
        name,
        description,
        isActive,
        sortOrder,
      })
      .where(eq(paymentMethod.id, id))
      .returning();

    return NextResponse.json({ paymentMethod: updated });
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
    const existing = await db.query.paymentMethod.findFirst({
      where: eq(paymentMethod.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 },
      );
    }

    // Check if payment method has associated payments
    const paymentsCountResult = await db
      .select({ value: count() })
      .from(payment)
      .where(eq(payment.paymentMethodId, id));
    const paymentsCount = paymentsCountResult[0]?.value || 0;

    if (paymentsCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete payment method with associated payments",
          paymentsCount,
        },
        { status: 409 },
      );
    }

    await db.delete(paymentMethod).where(eq(paymentMethod.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 },
    );
  }
}
