import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vehicle } from "@/db/schema";
import { ilike } from "drizzle-orm";
import { toISODate } from "@/lib/utils/date";
import { serializeDrizzleResult } from "@/lib/utils/serialization";

// GET /api/vehicles/by-identifier/[identifier] - Find vehicle by identifier (patent/serial)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params;

    const vehicles = await db.query.vehicle.findMany({
      where: ilike(vehicle.identifier, `%${identifier}%`),
      with: {
        customer: true,
        vehicleMake: true,
        vehicleModel: true,
        workOrders: true,
      },
      limit: 10,
    });

    // Transform to include _count equivalent
    const vehiclesWithCount = vehicles.map((v) => ({
      ...v,
      createdAt: toISODate(v.createdAt),
      updatedAt: toISODate(v.updatedAt),
      _count: {
        workOrders: (v.workOrders || []).length,
      },
    }));

    return NextResponse.json({ vehicles: serializeDrizzleResult(vehiclesWithCount) });
  } catch (error) {
    console.error("Error searching vehicles by identifier:", error);
    return NextResponse.json(
      { error: "Failed to search vehicles" },
      { status: 500 }
    );
  }
}
