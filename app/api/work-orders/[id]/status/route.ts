import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Valid work order statuses
const VALID_STATUSES = [
  "CONFIRMED",
  "WAITING",
  "IN_PROGRESS",
  "QC_CHECK",
  "READY",
  "PAID",
  "DELIVERED",
];

// PUT /api/work-orders/[id]/status - Update work order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Build update data with timestamps based on status
    const updateData: Record<string, unknown> = { status };

    if (status === "IN_PROGRESS") {
      updateData.startedAt = new Date();
    } else if (status === "READY") {
      updateData.completedAt = new Date();
    } else if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    const workOrder = await prisma.work_order.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            identifier: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Error updating work order status:", error);
    return NextResponse.json(
      { error: "Failed to update work order status" },
      { status: 500 }
    );
  }
}
