import { NextRequest, NextResponse } from "next/server";
import * as workOrderService from "@/lib/services/workOrderService";

// GET /api/work-orders/[id] - Get work order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workOrder = await workOrderService.getWorkOrderById(id);

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

    // Extract audit info from headers
    const changedBy = request.headers.get("x-user-email") || "system";
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    const workOrder = await workOrderService.updateWorkOrder(id, {
      ...body,
      changedBy,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(workOrder);
  } catch (error: any) {
    console.error("Error updating work order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update work order" },
      { status: error.message === 'Work order not found' ? 404 : 500 }
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
    await workOrderService.deleteWorkOrder(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting work order:", error);
    return NextResponse.json(
      { error: "Failed to delete work order" },
      { status: 500 }
    );
  }
}
