import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vehicles - List vehicles with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const identifier = searchParams.get("identifier");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = customerId;
    if (identifier) where.identifier = { contains: identifier, mode: "insensitive" };
    if (category) where.category = category;

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        make: true,
        model: true,
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.vehicle.count({ where });

    return NextResponse.json({ vehicles, total, limit, offset });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

// POST /api/vehicles - Create vehicle/asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      identifier,
      category,
      customerId,
      makeId,
      modelId,
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
        { status: 400 }
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
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        identifier: identifier.toUpperCase(),
        category,
        customerId,
        makeId,
        modelId,
        year,
        color,
        equipmentName,
        equipmentType,
        description,
        notes,
      },
      include: {
        customer: true,
        make: true,
        model: true,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle" },
      { status: 500 }
    );
  }
}
