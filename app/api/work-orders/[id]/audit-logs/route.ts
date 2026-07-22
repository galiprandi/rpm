import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workOrder } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getWorkOrderAuditLogs } from "@/lib/services/auditService";

// GET /api/work-orders/[id]/audit-logs - Get audit logs for a work order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify work order exists
    const workOrderRecord = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, id),
      columns: { id: true },
    });

    if (!workOrderRecord) {
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
