import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { getCashMovementSummary } from "@/lib/services/cashMovementService";

// GET /api/cash-movements/summary - Get cash summary for a date
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const summary = await getCashMovementSummary(date);

    return NextResponse.json({ summary, date });
  } catch (error) {
    console.error("Error fetching cash summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch cash summary" },
      { status: 500 },
    );
  }
}
