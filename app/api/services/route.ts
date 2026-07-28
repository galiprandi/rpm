import { NextRequest, NextResponse } from "next/server";
import { withAuth, withPermission } from "@/lib/api-middleware";
import { db } from "@/lib/db";
import { service } from "@/db/schema";
import { eq, ilike, and, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { toISODate } from "@/lib/utils/date";
import { hasPermission } from "@/lib/permissions/check";

// GET /api/services - List all services (cualquier usuario autenticado)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAuth(async (request: NextRequest, _session) => {
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

    const transformedServices = services.map((item) => ({
      ...item,
      baseCost: Number(item.baseCost),
      vehicleFactor: Number(item.vehicleFactor),
      createdAt: toISODate(item.createdAt),
      updatedAt: toISODate(item.updatedAt),
    }));

    return NextResponse.json({ services: transformedServices });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
});

// POST /api/services - Create service (requiere can_manage_services)
export const POST = withPermission('can_manage_services', async (request: NextRequest, session) => {
  try {
    const body = await request.json();
    const { name, description, timeMinutes, vehicleFactor } = body;

    // Field-level permission check:
    // Strip baseCost if the user lacks can_edit_costs.
    // For POST, stripped baseCost defaults to 0 (no existing service to fall back to).
    const canEditCosts = hasPermission(session, 'can_edit_costs');
    const baseCost = canEditCosts ? body.baseCost : 0;

    if (!name) {
      return NextResponse.json(
        { error: "Nombre es requerido" },
        { status: 400 }
      );
    }

    if (canEditCosts && baseCost === undefined) {
      return NextResponse.json(
        { error: "Costo base es requerido" },
        { status: 400 }
      );
    }

    if (baseCost !== undefined && baseCost < 0) {
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
      baseCost: String(baseCost ?? 0),
      timeMinutes: timeMinutes || 60,
      vehicleFactor: String(vehicleFactor || 1.0),
      updatedAt: new Date().toISOString(),
    }).returning();

    const transformedCreated = {
      ...created,
      baseCost: Number(created.baseCost),
      vehicleFactor: Number(created.vehicleFactor),
      createdAt: toISODate(created.createdAt),
      updatedAt: toISODate(created.updatedAt),
    };

    return NextResponse.json({ service: transformedCreated }, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
});
