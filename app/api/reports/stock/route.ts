import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { UserRole } from "@/lib/auth/roles";
import { getInventoryReport } from "@/lib/services/stockReportService";

export const revalidate = 3600; // 1 hour

export async function GET() {
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

    const report = await getInventoryReport();

    return NextResponse.json(report, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error in reports/stock API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
