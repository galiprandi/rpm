import { NextRequest, NextResponse } from "next/server";
import { getSessionWithAuth } from "@/lib/api-middleware";
import { UserRole } from "@/lib/auth/roles";
import { getFinanceReport, FinanceGroupBy } from "@/lib/services/financeReportService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const comparisonStartDate = searchParams.get("comparisonStartDate");
    const comparisonEndDate = searchParams.get("comparisonEndDate");
    const groupBy = searchParams.get("groupBy") as FinanceGroupBy | null;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const report = await getFinanceReport({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      comparisonStartDate: comparisonStartDate ? new Date(comparisonStartDate) : undefined,
      comparisonEndDate: comparisonEndDate ? new Date(comparisonEndDate) : undefined,
      groupBy: groupBy || undefined,
    });

    return NextResponse.json(report, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error in finance report API:", error);
    return NextResponse.json(
      { error: "Failed to generate finance report" },
      { status: 500 }
    );
  }
}
