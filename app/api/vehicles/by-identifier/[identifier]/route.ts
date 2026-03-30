import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vehicles/by-identifier/[identifier] - Find vehicle by identifier (patent/serial)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params;

    const vehicles = await prisma.vehicle.findMany({
      where: {
        identifier: {
          contains: identifier,
          mode: "insensitive",
        },
      },
      include: {
        customer: true,
        make: true,
        model: true,
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
      take: 10,
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("Error searching vehicles by identifier:", error);
    return NextResponse.json(
      { error: "Failed to search vehicles" },
      { status: 500 }
    );
  }
}
