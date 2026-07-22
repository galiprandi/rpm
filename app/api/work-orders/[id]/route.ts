import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workOrder } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateWorkOrder } from "@/lib/services/workOrderService";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { adjustBalanceAtomically } from "@/lib/services/balanceService";
import { toISODate } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

// GET /api/work-orders/[id] - Get work order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const workOrderRecord = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, id),
      with: {
        customer: true,
        vehicle: {
          with: {
            vehicleMake: true,
            vehicleModel: true,
          },
        },
        workOrderItems: {
          with: {
            product: true,
            service: true,
          },
        },
        technician: {
          columns: {
            id: true,
            name: true,
          },
        },
        photos: true,
      },
    });

    if (!workOrderRecord) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...workOrderRecord,
      // Normalize nullable arrays to empty arrays (Prisma returned [] by default)
      entryPhotos: workOrderRecord.entryPhotos || [],
      exitPhotos: workOrderRecord.exitPhotos || [],
      // Convert timestamps from PG raw format to ISO 8601
      createdAt: toISODate(workOrderRecord.createdAt),
      updatedAt: toISODate(workOrderRecord.updatedAt),
      scheduledDate: toISODate(workOrderRecord.scheduledDate),
      startedAt: toISODate(workOrderRecord.startedAt),
      completedAt: toISODate(workOrderRecord.completedAt),
      deliveredAt: toISODate(workOrderRecord.deliveredAt),
    });
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

    const workOrderResult = await updateWorkOrder(id, body, {
      userId: session?.user.id || "system",
      userEmail: session?.user.email || "system",
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      ...workOrderResult,
      createdAt: toISODate((workOrderResult as any).createdAt),
      updatedAt: toISODate((workOrderResult as any).updatedAt),
      scheduledDate: toISODate((workOrderResult as any).scheduledDate),
      startedAt: toISODate((workOrderResult as any).startedAt),
      completedAt: toISODate((workOrderResult as any).completedAt),
      deliveredAt: toISODate((workOrderResult as any).deliveredAt),
    });
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
    const workOrderRecord = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, id),
      columns: {
        customerId: true,
        total: true,
        status: true,
      },
      with: {
        payments: {
          columns: { amount: true },
        },
      },
    });

    if (!workOrderRecord) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    // Only reverse balance for non-CANCELLED work orders
    if (workOrderRecord.status !== "CANCELLED") {
      const total = Number(workOrderRecord.total);
      const paymentsMade = workOrderRecord.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const reversal = total - paymentsMade;

      if (Math.abs(reversal) > 0.01) {
        await adjustBalanceAtomically(
          workOrderRecord.customerId,
          -reversal,
          "work_order_delete",
        );
      }
    }

    await db.delete(workOrder).where(eq(workOrder.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting work order:", error);
    return NextResponse.json(
      { error: "Failed to delete work order" },
      { status: 500 },
    );
  }
}
