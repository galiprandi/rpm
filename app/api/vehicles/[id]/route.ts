import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vehicles/[id] - Get vehicle by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle_make: true,
        vehicle_model: true,
        work_order: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Transform Prisma field names to match frontend interface
    const transformedVehicle = {
      ...vehicle,
      workOrders: vehicle.work_order || [],
      work_order: undefined,
      vehicle_make: undefined,
      vehicle_model: undefined,
      make: vehicle.vehicle_make,
      model: vehicle.vehicle_model,
    };

    return NextResponse.json(transformedVehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle" },
      { status: 500 }
    );
  }
}

// PUT /api/vehicles/[id] - Update vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      identifier,
      category,
      makeId,
      modelId,
      year,
      color,
      equipmentName,
      equipmentType,
      description,
      notes,
    } = body;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        identifier: identifier?.toUpperCase(),
        category,
        makeId,
        modelId,
        year,
        color,
        equipmentName,
        equipmentType,
        description,
        notes,
      },
      include: {
        customer: true,
        vehicle_make: true,
        vehicle_model: true,
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json(
      { error: "Failed to update vehicle" },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicles/[id] - Delete vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.vehicle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json(
      { error: "Failed to delete vehicle" },
      { status: 500 }
    );
  }
}
