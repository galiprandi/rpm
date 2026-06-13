import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { capitalizeText, normalizeText } from "@/lib/utils/format";

// GET /api/vehicle-makes - List all makes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { isActive: true };
    if (search) {
      where.normalizedName = { contains: normalizeText(search), mode: "insensitive" };
    }
    if (category) {
      where.category = { has: category };
    }

    const makes = await prisma.vehicle_make.findMany({
      where,
      include: {
        _count: {
          select: {
            vehicle_model: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ makes });
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
    let make = await prisma.vehicle_make.findUnique({
      where: { normalizedName },
    });

    if (!make) {
      // Create new make
      make = await prisma.vehicle_make.create({
        data: {
          id: randomUUID(),
          name: capitalizedName,
          normalizedName,
          category: Array.isArray(category) ? category : [category],
        },
      });
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
