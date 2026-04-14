import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

import { capitalizeText, normalizeText } from "@/lib/utils/format";

// GET /api/vehicle-models - List models (optionally filtered by makeId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const makeId = searchParams.get("makeId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { isActive: true };
    if (makeId) where.makeId = makeId;
    if (search) {
      where.normalizedName = { contains: normalizeText(search), mode: "insensitive" };
    }

    const models = await prisma.vehicle_model.findMany({
      where,
      include: {
        vehicle_make: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ models });
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
    let model = await prisma.vehicle_model.findFirst({
      where: {
        makeId,
        normalizedName,
      },
    });

    if (!model) {
      // Create new model
      model = await prisma.vehicle_model.create({
        data: {
          id: randomUUID(),
          name: capitalizedName,
          normalizedName,
          makeId,
          years: years || [],
        },
      });
    } else if (years && years.length > 0) {
      // Update years if new ones provided
      const existingYears = model.years || [];
      const newYears = [...new Set([...existingYears, ...years])];
      if (newYears.length > existingYears.length) {
        model = await prisma.vehicle_model.update({
          where: { id: model.id },
          data: { years: newYears },
        });
      }
    }

    return NextResponse.json(model, { status: model ? 200 : 201 });
  } catch (error) {
    console.error("Error creating vehicle model:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle model" },
      { status: 500 }
    );
  }
}
