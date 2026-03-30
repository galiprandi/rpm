import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/services - List all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (isActive !== null) where.isActive = isActive === "true";

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
        { error: "Missing required fields: name, baseCost" },
        { status: 400 }
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

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
