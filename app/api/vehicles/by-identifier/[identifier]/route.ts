import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vehicle } from "@/db/schema";
import { ilike } from "drizzle-orm";

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
      _count: {
        work_order: v.workOrders.length,
      },
    }));

    return NextResponse.json({ vehicles: vehiclesWithCount });
  } catch (error) {
    console.error("Error searching vehicles by identifier:", error);
    return NextResponse.json(
      { error: "Failed to search vehicles" },
      { status: 500 }
    );
  }
}
