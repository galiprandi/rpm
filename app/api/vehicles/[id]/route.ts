import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vehicle, workOrder } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { capitalizeText } from "@/lib/utils/format";
import { resolveMakeModel } from "@/lib/utils/vehicle-helpers";
import { toISODate } from "@/lib/utils/date";

// GET /api/vehicles/[id] - Get vehicle by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const vehicleRecord = await db.query.vehicle.findFirst({
      where: eq(vehicle.id, id),
      with: {
        customer: true,
        vehicleMake: true,
        vehicleModel: true,
        workOrders: {
          orderBy: desc(workOrder.createdAt),
          limit: 50,
          with: {
            photos: true,
          },
        },
      },
    });

    if (!vehicleRecord) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Drizzle returns camelCase relation names (vehicleMake, vehicleModel)
    const transformedVehicle = {
      ...vehicleRecord,
      createdAt: toISODate(vehicleRecord.createdAt),
      updatedAt: toISODate(vehicleRecord.updatedAt),
      workOrders: vehicleRecord.workOrders || [],
    };

    return NextResponse.json(transformedVehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle" },
      { status: 500 },
    );
  }
}

// PUT /api/vehicles/[id] - Update vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      identifier,
      category,
      makeName,
      modelName,
      makeId: rawMakeId,
      modelId: rawModelId,
      year,
      color,
      equipmentName,
      equipmentType,
      description,
      notes,
    } = body;

    // Resolve make/model from names (upsert) or use raw IDs if provided
    const { makeId, modelId } = makeName
      ? await resolveMakeModel(makeName, modelName)
      : { makeId: rawMakeId, modelId: rawModelId };

    await db.update(vehicle).set({
      identifier: identifier?.toUpperCase(),
      category,
      makeId,
      modelId,
      year,
      color: color ? capitalizeText(color) : null,
      equipmentName,
      equipmentType,
      description,
      notes,
    }).where(eq(vehicle.id, id));

    // Fetch with relations
    const vehicleWithRelations = await db.query.vehicle.findFirst({
      where: eq(vehicle.id, id),
      with: {
        customer: true,
        vehicleMake: true,
        vehicleModel: true,
      },
    });

    return NextResponse.json(
      vehicleWithRelations
        ? {
            ...vehicleWithRelations,
            createdAt: toISODate(vehicleWithRelations.createdAt),
            updatedAt: toISODate(vehicleWithRelations.updatedAt),
          }
        : vehicleWithRelations,
    );
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json(
      { error: "Failed to update vehicle" },
      { status: 500 },
    );
  }
}

// DELETE /api/vehicles/[id] - Delete vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.delete(vehicle).where(eq(vehicle.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json(
      { error: "Failed to delete vehicle" },
      { status: 500 },
    );
  }
}
