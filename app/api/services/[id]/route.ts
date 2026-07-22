import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { service } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toISODate } from "@/lib/utils/date";

// Helper to transform service record for API response
function transformService(item: typeof service.$inferSelect) {
  return {
    ...item,
    baseCost: Number(item.baseCost),
    vehicleFactor: Number(item.vehicleFactor),
    createdAt: toISODate(item.createdAt),
    updatedAt: toISODate(item.updatedAt),
  };
}

// GET /api/services/[id] - Get service by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const serviceRecord = await db.query.service.findFirst({
      where: eq(service.id, id),
    });

    if (!serviceRecord) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ service: transformService(serviceRecord) });
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

// PUT /api/services/[id] - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, baseCost, timeMinutes, vehicleFactor, isActive } = body;

    // Check if service exists
    const existingService = await db.query.service.findFirst({
      where: eq(service.id, id),
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingService.name) {
      const duplicate = await db.query.service.findFirst({
        where: eq(service.name, name),
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Ya existe un servicio con ese nombre" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (baseCost !== undefined) updateData.baseCost = String(baseCost);
    if (timeMinutes !== undefined) updateData.timeMinutes = timeMinutes;
    if (vehicleFactor !== undefined) updateData.vehicleFactor = String(vehicleFactor);
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db.update(service).set(updateData).where(eq(service.id, id)).returning();

    return NextResponse.json({ service: transformService(updated) });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] - Soft delete (deactivate) service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if service exists
    const existingService = await db.query.service.findFirst({
      where: eq(service.id, id),
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Soft delete - set isActive to false
    const [updated] = await db.update(service).set({ isActive: false }).where(eq(service.id, id)).returning();

    return NextResponse.json({ service: transformService(updated) });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
