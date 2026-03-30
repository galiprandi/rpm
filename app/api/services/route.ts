import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/services - List all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filtros opcionales
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (isActive !== null) where.isActive = isActive === "true";
    
    // Search by name
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services - Create service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, baseCost, timeMinutes, vehicleFactor } = body;

    if (!name || baseCost === undefined) {
      return NextResponse.json(
        { error: "Nombre y costo base son requeridos" },
        { status: 400 }
      );
    }

    if (baseCost < 0) {
      return NextResponse.json(
        { error: "El costo no puede ser negativo" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.service.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un servicio con ese nombre" },
        { status: 409 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        baseCost,
        timeMinutes: timeMinutes || 60,
        vehicleFactor: vehicleFactor || 1.0,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
