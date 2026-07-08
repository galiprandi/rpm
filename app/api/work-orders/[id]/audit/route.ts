import { NextRequest, NextResponse } from "next/server";
import { getWorkOrderAuditLogs } from "@/lib/services/auditService";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const logs = await getWorkOrderAuditLogs(id);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching work order audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
