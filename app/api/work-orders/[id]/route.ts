import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/work-orders/[id] - Get work order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: {
          include: {
            make: true,
            model: true,
          },
        },
        items: {
          include: {
            product: true,
            service: true,
          },
        },
        photos: true,
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Error fetching work order:", error);
    return NextResponse.json(
      { error: "Failed to fetch work order" },
      { status: 500 }
    );
  }
}

// PUT /api/work-orders/[id] - Update work order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      technicianId,
      status,
      entryChecklist,
      exitChecklist,
      notes,
      paymentMethod,
      paymentNotes,
      scheduledDate,
      startedAt,
      completedAt,
      deliveredAt,
    } = body;

    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        technicianId,
        status,
        entryChecklist,
        exitChecklist,
        notes,
        paymentMethod,
        paymentNotes,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        startedAt: startedAt ? new Date(startedAt) : undefined,
        completedAt: completedAt ? new Date(completedAt) : undefined,
        deliveredAt: deliveredAt ? new Date(deliveredAt) : undefined,
      },
      include: {
        customer: true,
        vehicle: {
          include: {
            make: true,
            model: true,
          },
        },
        items: {
          include: {
            product: true,
            service: true,
          },
        },
        photos: true,
      },
    });

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Error updating work order:", error);
    return NextResponse.json(
      { error: "Failed to update work order" },
      { status: 500 }
    );
  }
}

// DELETE /api/work-orders/[id] - Delete work order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.workOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting work order:", error);
    return NextResponse.json(
      { error: "Failed to delete work order" },
      { status: 500 }
    );
  }
}
