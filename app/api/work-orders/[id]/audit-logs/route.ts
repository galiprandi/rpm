import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWorkOrderAuditLogs } from "@/lib/services/auditService";

// GET /api/work-orders/[id]/audit-logs - Get audit logs for a work order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify work order exists
    const workOrder = await prisma.work_order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    const logs = await getWorkOrderAuditLogs(id);

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
