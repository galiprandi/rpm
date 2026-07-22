import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vehicleModel, vehicleMake } from "@/db/schema";
import { eq, ilike, and } from "drizzle-orm";

// GET /api/vehicle-models/search?q=query&makeId=id - Search models with NHTSA fallback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q");
    const makeId = searchParams.get("makeId");

    if (!query) {
      return NextResponse.json(
        { error: "Missing required parameter: q" },
        { status: 400 }
      );
    }

    const normalizedQuery = query.trim().toLowerCase();

    // 1. Buscar en DB local
    const conditions = [];
    if (makeId) conditions.push(eq(vehicleModel.makeId, makeId));
    conditions.push(ilike(vehicleModel.normalizedName, `%${normalizedQuery}%`));

    const localModels = await db.query.vehicleModel.findMany({
      where: and(...conditions),
      with: { vehicleMake: true },
      limit: 10,
    });

    // 2. Si hay menos de 5 resultados y tenemos makeId, buscar en NHTSA
    let externalModels: Array<{ Model_Name: string }> = [];
    if (localModels.length < 5 && makeId) {
      try {
        const make = await db.query.vehicleMake.findFirst({
          where: eq(vehicleMake.id, makeId),
        });
        if (make) {
          const nhtsaResponse = await fetch(
            `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(make.name)}?format=json`
          );
          if (nhtsaResponse.ok) {
            const nhtsaData = await nhtsaResponse.json();
            externalModels = nhtsaData.Results.filter(
              (m: { Model_Name: string }) =>
                m.Model_Name.toLowerCase().includes(normalizedQuery)
            ).slice(0, 5);
          }
        }
      } catch (nhtsaError) {
        console.warn("NHTSA API error:", nhtsaError);
      }
    }

    return NextResponse.json({
      local: localModels,
      external: externalModels.map((m) => ({
        name: m.Model_Name,
        source: "nhtsa",
      })),
    });
  } catch (error) {
    console.error("Error searching vehicle models:", error);
    return NextResponse.json(
      { error: "Failed to search vehicle models" },
      { status: 500 }
    );
  }
}
