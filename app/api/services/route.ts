import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-middleware";
import { db } from "@/lib/db";
import { service } from "@/db/schema";
import { eq, ilike, and, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

// GET /api/services - List all services (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAdmin(async (request: NextRequest, _session) => {
  try {
    const { searchParams } = request.nextUrl;
    
    // Filtros opcionales
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const conditions = [];
    if (isActive !== null) conditions.push(eq(service.isActive, isActive === "true"));
    
    // Search by name
    if (search) {
      conditions.push(ilike(service.name, `%${search}%`));
    }

    const services = await db.query.service.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: asc(service.name),
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
});

// POST /api/services - Create service (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const POST = withAdmin(async (request: NextRequest, _session) => {
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
    const existing = await db.query.service.findFirst({
      where: eq(service.name, name),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un servicio con ese nombre" },
        { status: 409 }
      );
    }

    const [created] = await db.insert(service).values({
      id: randomUUID(),
      name,
      description,
      baseCost: String(baseCost),
      timeMinutes: timeMinutes || 60,
      vehicleFactor: String(vehicleFactor || 1.0),
      updatedAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json({ service: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
});
