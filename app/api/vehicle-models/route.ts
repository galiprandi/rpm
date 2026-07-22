import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vehicleModel } from "@/db/schema";
import { eq, ilike, and, asc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

import { capitalizeText, normalizeText } from "@/lib/utils/format";
import { toISODate } from "@/lib/utils/date";

// GET /api/vehicle-models - List models (optionally filtered by makeId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const makeId = searchParams.get("makeId");
    const search = searchParams.get("search");

    const conditions = [eq(vehicleModel.isActive, true)];
    if (makeId) conditions.push(eq(vehicleModel.makeId, makeId));
    if (search) {
      conditions.push(ilike(vehicleModel.normalizedName, `%${normalizeText(search)}%`));
    }

    const models = await db.query.vehicleModel.findMany({
      where: and(...conditions),
      with: {
        vehicleMake: true,
      },
      orderBy: asc(vehicleModel.name),
    });

    const modelsWithDates = models.map((model) => ({
      ...model,
      createdAt: toISODate(model.createdAt),
    }));

    return NextResponse.json({ models: modelsWithDates });
  } catch (error) {
    console.error("Error fetching vehicle models:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle models" },
      { status: 500 }
    );
  }
}

// POST /api/vehicle-models - Create or find existing model
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, makeId, years } = body;

    if (!name || !makeId) {
      return NextResponse.json(
        { error: "Missing required fields: name, makeId" },
        { status: 400 }
      );
    }

    const normalizedName = normalizeText(name);
    const capitalizedName = capitalizeText(name);

    // Try to find existing model
    let model = await db.query.vehicleModel.findFirst({
      where: and(
        eq(vehicleModel.makeId, makeId),
        eq(vehicleModel.normalizedName, normalizedName),
      ),
    });

    if (!model) {
      // Create new model
      const [created] = await db.insert(vehicleModel).values({
        id: randomUUID(),
        name: capitalizedName,
        normalizedName,
        makeId,
        years: years || [],
      }).returning();
      model = created;
    } else if (years && years.length > 0) {
      // Update years if new ones provided
      const existingYears = model.years || [];
      const newYears = [...new Set([...existingYears, ...years])];
      if (newYears.length > existingYears.length) {
        const [updated] = await db.update(vehicleModel)
          .set({ years: newYears })
          .where(eq(vehicleModel.id, model.id))
          .returning();
        model = updated;
      }
    }

    return NextResponse.json(
      model ? { ...model, createdAt: toISODate(model.createdAt) } : model,
      { status: model ? 200 : 201 },
    );
  } catch (error) {
    console.error("Error creating vehicle model:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle model" },
      { status: 500 }
    );
  }
}
