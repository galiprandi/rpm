import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { vehicle } from "@/db/schema";
import { eq, ilike, and, desc, count } from "drizzle-orm";
import { capitalizeText } from "@/lib/utils/format";
import { resolveMakeModel } from "@/lib/utils/vehicle-helpers";
import { toISODate } from "@/lib/utils/date";

interface CreateVehicleInput {
  identifier: string;
  category: string;
  customerId: string;
  makeName?: string;
  modelName?: string;
  makeId?: string;
  modelId?: string;
  year?: number;
  color?: string;
  equipmentName?: string;
  equipmentType?: string;
  description?: string;
  notes?: string;
}

// GET /api/vehicles - List vehicles with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const customerId = searchParams.get("customerId");
    const identifier = searchParams.get("identifier");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const conditions = [];
    if (customerId) conditions.push(eq(vehicle.customerId, customerId));
    if (identifier)
      conditions.push(ilike(vehicle.identifier, `%${identifier}%`));
    if (category) conditions.push(eq(vehicle.category, category));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const vehicles = await db.query.vehicle.findMany({
      where,
      with: {
        customer: {
          columns: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicleMake: true,
        vehicleModel: true,
        workOrders: true,
      },
      orderBy: desc(vehicle.createdAt),
      limit,
      offset,
    });

    // Count total
    const [{ count: total }] = await db
      .select({ count: count() })
      .from(vehicle)
      .where(where ?? undefined);

    // Transform to include _count equivalent
    const vehiclesWithCount = vehicles.map((v) => ({
      ...v,
      createdAt: toISODate(v.createdAt),
      updatedAt: toISODate(v.updatedAt),
      _count: {
        workOrders: v.workOrders.length,
      },
    }));

    return NextResponse.json({ vehicles: vehiclesWithCount, total, limit, offset });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 },
    );
  }
}

// POST /api/vehicles - Create vehicle/asset
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateVehicleInput = await request.json();
    const {
      identifier,
      category,
      customerId,
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

    // Validate required fields
    if (!identifier || !category || !customerId) {
      return NextResponse.json(
        { error: "Missing required fields: identifier, category, customerId" },
        { status: 400 },
      );
    }

    // Validate category
    const validCategories = [
      "CAR",
      "TRUCK",
      "SUV",
      "PICKUP",
      "MOTORCYCLE",
      "TRAILER",
      "AUDIO_EQUIPMENT",
      "ELECTRIC_SCOOTER",
      "OTHER",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Resolve make/model from names (upsert) or use raw IDs if provided
    const { makeId, modelId } = makeName
      ? await resolveMakeModel(makeName, modelName)
      : { makeId: rawMakeId, modelId: rawModelId };

    const [created] = await db.insert(vehicle).values({
      id: crypto.randomUUID(),
      identifier: identifier.toUpperCase(),
      category,
      customerId,
      makeId,
      modelId,
      year,
      color: color ? capitalizeText(color) : null,
      equipmentName,
      equipmentType,
      description,
      notes,
      updatedAt: new Date().toISOString(),
    }).returning();

    // Fetch with relations
    const vehicleWithRelations = await db.query.vehicle.findFirst({
      where: eq(vehicle.id, created.id),
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
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle" },
      { status: 500 },
    );
  }
}
