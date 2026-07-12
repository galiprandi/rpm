import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { UserRole } from "@/lib/auth/roles";
import { getServiceReport, type ServiceGroupBy } from "@/lib/services/serviceReportService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole =
      ((session.user as { role?: string }).role as UserRole) || UserRole.USER;
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const comparisonStartDate = searchParams.get("comparisonStartDate");
    const comparisonEndDate = searchParams.get("comparisonEndDate");
    const groupBy = searchParams.get("groupBy") as ServiceGroupBy | null;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Fechas de inicio y fin son requeridas" },
        { status: 400 },
      );
    }

    const report = await getServiceReport({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      comparisonStartDate: comparisonStartDate
        ? new Date(comparisonStartDate)
        : undefined,
      comparisonEndDate: comparisonEndDate
        ? new Date(comparisonEndDate)
        : undefined,
      groupBy: groupBy || undefined,
    });

    return NextResponse.json(report, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error in reports/services API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
