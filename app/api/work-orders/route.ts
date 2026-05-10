import { NextRequest, NextResponse } from "next/server";
import * as workOrderService from "@/lib/services/workOrderService";

// GET /api/work-orders - List work orders with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filters = {
      status: searchParams.get("status") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      vehicleId: searchParams.get("vehicleId") || undefined,
      technicianId: searchParams.get("technicianId") || undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const { workOrders, total } = await workOrderService.getWorkOrders(filters);

    return NextResponse.json({
      workOrders,
      total,
      limit: filters.limit,
      offset: filters.offset
    });
  } catch (error) {
    console.error("Error fetching work orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch work orders" },
      { status: 500 }
    );
  }
}

// POST /api/work-orders - Create work order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.customerId || (!body.vehicleId && !body.vehicleData)) {
      return NextResponse.json(
        { error: "Missing required fields: customerId, vehicleId or vehicleData" },
        { status: 400 }
      );
    }

    const workOrder = await workOrderService.createWorkOrder(body);
    return NextResponse.json(workOrder, { status: 201 });
  } catch (error: any) {
    console.error("Error creating work order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create work order" },
      { status: error.message === 'Failed to resolve vehicle' ? 400 : 500 }
    );
  }
}
