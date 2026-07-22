import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateWorkOrder } from "@/lib/services/workOrderService";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { adjustBalanceAtomically } from "@/lib/services/balanceService";

export const dynamic = "force-dynamic";

// GET /api/work-orders/[id] - Get work order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const workOrder = await prisma.work_order.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: {
          include: {
            vehicle_make: true,
            vehicle_model: true,
          },
        },
        work_order_item: {
          include: {
            product: true,
            service: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
          },
        },
        photo: true,
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Error fetching work order:", error);
    return NextResponse.json(
      { error: "Failed to fetch work order" },
      { status: 500 },
    );
  }
}

// PUT /api/work-orders/[id] - Update work order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionWithAuth();
    const { id } = await params;
    const body = await request.json();
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    const workOrder = await updateWorkOrder(id, body, {
      userId: session?.user.id || "system",
      userEmail: session?.user.email || "system",
      ipAddress,
      userAgent,
    });

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Error updating work order:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update work order",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/work-orders/[id] - Delete work order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Fetch WO to calculate balance reversal (total - payments already made)
    const workOrder = await prisma.work_order.findUnique({
      where: { id },
      select: {
        customerId: true,
        total: true,
        status: true,
        payments: { select: { amount: true } },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    // Only reverse balance for non-CANCELLED work orders
    if (workOrder.status !== "CANCELLED") {
      const total = Number(workOrder.total);
      const paymentsMade = workOrder.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const reversal = total - paymentsMade;

      if (Math.abs(reversal) > 0.01) {
        await adjustBalanceAtomically(
          workOrder.customerId,
          -reversal,
          "work_order_delete",
        );
      }
    }

    await prisma.work_order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting work order:", error);
    return NextResponse.json(
      { error: "Failed to delete work order" },
      { status: 500 },
    );
  }
}
