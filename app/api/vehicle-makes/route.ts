import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { vehicleMake } from "@/db/schema";
import { eq, ilike, and, asc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { capitalizeText, normalizeText } from "@/lib/utils/format";

// GET /api/vehicle-makes - List all makes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const conditions = [eq(vehicleMake.isActive, true)];
    if (search) {
      conditions.push(ilike(vehicleMake.normalizedName, `%${normalizeText(search)}%`));
    }
    if (category) {
      conditions.push(sql`${vehicleMake.category} @> ARRAY[${category}]::text[]`);
    }

    const makes = await db.query.vehicleMake.findMany({
      where: and(...conditions),
      with: {
        vehicleModels: true,
      },
      orderBy: asc(vehicleMake.name),
    });

    // Transform to include _count equivalent
    const makesWithCount = makes.map((make) => ({
      ...make,
      _count: {
        vehicle_model: make.vehicleModels.length,
      },
    }));

    return NextResponse.json({ makes: makesWithCount });
  } catch (error) {
    console.error("Error fetching vehicle makes:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle makes" },
      { status: 500 }
    );
  }
}

// POST /api/vehicle-makes - Create or find existing make
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, category } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "Missing required fields: name, category" },
        { status: 400 }
      );
    }

    const normalizedName = normalizeText(name);
    const capitalizedName = capitalizeText(name);

    // Try to find existing make
    let make = await db.query.vehicleMake.findFirst({
      where: eq(vehicleMake.normalizedName, normalizedName),
    });

    if (!make) {
      // Create new make
      const [created] = await db.insert(vehicleMake).values({
        id: randomUUID(),
        name: capitalizedName,
        normalizedName,
        category: Array.isArray(category) ? category : [category],
      }).returning();
      make = created;
    }

    return NextResponse.json(make, { status: make ? 200 : 201 });
  } catch (error) {
    console.error("Error creating vehicle make:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle make" },
      { status: 500 }
    );
  }
}
