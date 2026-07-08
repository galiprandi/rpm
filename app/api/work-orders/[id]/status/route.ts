import { NextRequest, NextResponse } from "next/server";
import { updateWorkOrder, generateDocumentFromWorkOrder } from "@/lib/services/workOrderService";
import { getSessionWithAuth } from "@/lib/api-middleware";

export const dynamic = 'force-dynamic';

// Valid work order statuses
const VALID_STATUSES = [
  "CONFIRMED",
  "WAITING",
  "IN_PROGRESS",
  "QC_CHECK",
  "READY",
  "PAID",
  "DELIVERED",
];

// PUT /api/work-orders/[id]/status - Update work order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionWithAuth();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const userId = session?.user.email || "system";
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    const workOrder = await updateWorkOrder(id, { status }, userId, { ipAddress, userAgent });

    // --- Generate Pre-Invoice on Delivery ---
    if (status === "DELIVERED") {
      try {
        await generateDocumentFromWorkOrder(
          workOrder.id,
          userId,
        );
      } catch (invoiceError) {
        console.error(
          "Error generating pre-invoice for work order:",
          invoiceError,
        );
      }
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Error updating work order status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update work order status" },
      { status: 500 },
    );
  }
}
