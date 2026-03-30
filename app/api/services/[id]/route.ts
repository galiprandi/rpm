import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/services/[id] - Get service by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ service });
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
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingService.name) {
      const duplicate = await prisma.service.findUnique({
        where: { name },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Ya existe un servicio con ese nombre" },
          { status: 409 }
        );
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        baseCost,
        timeMinutes,
        vehicleFactor,
        isActive,
      },
    });

    return NextResponse.json({ service });
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
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Soft delete - set isActive to false
    const service = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
