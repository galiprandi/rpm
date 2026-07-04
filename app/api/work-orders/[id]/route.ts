import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logWorkOrderChange } from "@/lib/services/auditService";
import { generateInvoiceFromWorkOrder } from "@/lib/services/workOrderService";

// GET /api/work-orders/[id] - Get work order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Get current work order to compare changes
    const currentWorkOrder = await prisma.work_order.findUnique({
      where: { id },
      select: {
        status: true,
        notes: true,
        scheduledDate: true,
        paymentMethod: true,
        paymentNotes: true,
      },
    });

    // Get user from session (simplified - should use proper auth)
    const changedBy = request.headers.get("x-user-email") || "system";
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    // Log changes for tracked fields
    if (currentWorkOrder) {
      const trackedFields = [
        { name: "status", current: currentWorkOrder.status, new: status },
        { name: "notes", current: currentWorkOrder.notes, new: notes },
        { name: "scheduledDate", current: currentWorkOrder.scheduledDate?.toISOString(), new: scheduledDate },
        { name: "paymentMethod", current: currentWorkOrder.paymentMethod, new: paymentMethod },
        { name: "paymentNotes", current: currentWorkOrder.paymentNotes, new: paymentNotes },
      ];

      for (const field of trackedFields) {
        if (field.new !== undefined && String(field.current) !== String(field.new)) {
          await logWorkOrderChange({
            workOrderId: id,
            fieldName: field.name,
            oldValue: field.current,
            newValue: field.new,
            changedBy,
            ipAddress,
            userAgent,
          });
        }
      }
    }

    const workOrder = await prisma.work_order.update({
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

    // Auto-generate invoice when marked as DELIVERED
    if (status === 'DELIVERED' && currentWorkOrder?.status !== 'DELIVERED') {
      try {
        await generateInvoiceFromWorkOrder(id, changedBy);
      } catch (invoiceError) {
        console.error("Error auto-generating invoice for work order:", invoiceError);
        // We don't fail the update if invoice generation fails, but it should be logged
      }
    }

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
    await prisma.work_order.delete({
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
