import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vehicle-models/search?q=query&makeId=id - Search models with NHTSA fallback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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
    const localModels = await prisma.vehicle_model.findMany({
      where: {
        ...(makeId && { makeId }),
        normalizedName: { contains: normalizedQuery },
      },
      include: { vehicle_make: true },
      take: 10,
    });

    // 2. Si hay menos de 5 resultados y tenemos makeId, buscar en NHTSA
    let externalModels: Array<{ Model_Name: string }> = [];
    if (localModels.length < 5 && makeId) {
      try {
        const make = await prisma.vehicle_make.findUnique({
          where: { id: makeId },
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
