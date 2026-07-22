import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { workOrder, workOrderItem } from "@/db/schema";
import { eq } from "drizzle-orm";
import { adjustBalanceAtomically } from "@/lib/services/balanceService";

// PUT /api/work-orders/[id]/items - Update work order items
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { items } = body;

    // Check if work order is delivered
    const workOrderRecord = await db.query.workOrder.findFirst({
      where: eq(workOrder.id, id),
      columns: { status: true, total: true, customerId: true },
    });

    if (!workOrderRecord) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 },
      );
    }

    if (workOrderRecord.status === "DELIVERED") {
      return NextResponse.json(
        { error: "Cannot modify items of a delivered work order" },
        { status: 403 },
      );
    }

    const oldTotal = Number(workOrderRecord.total);

    // Delete existing items, update totals, and adjust balance in a transaction
    const result = await db.transaction(async (tx) => {
      // Delete existing items
      await tx.delete(workOrderItem).where(eq(workOrderItem.workOrderId, id));

      // Create new items
      let totalProducts = 0;
      let totalServices = 0;
      let total = 0;

      for (const item of items) {
        const isProduct = item.type === "product";
        const subtotal = item.quantity * item.unitPrice;

        await tx.insert(workOrderItem).values({
          id: crypto.randomUUID(),
          workOrderId: id,
          type: isProduct ? "PRODUCT" : "SERVICE",
          productId: isProduct ? item.id : null,
          serviceId: !isProduct ? item.id : null,
          name: item.isManualName ? item.name : null,
          isManualName: item.isManualName || false,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          subtotal: String(subtotal),
          priceListId: item.priceListId,
          isManualPrice: item.isManualPrice,
        });

        if (isProduct) {
          totalProducts += subtotal;
        } else {
          totalServices += subtotal;
        }
        total += subtotal;
      }

      // Update work order totals
      await tx.update(workOrder).set({
        totalProducts: String(totalProducts),
        totalServices: String(totalServices),
        total: String(total),
      }).where(eq(workOrder.id, id));

      // Adjust customer balance by the delta
      const delta = total - oldTotal;
      if (Math.abs(delta) > 0.01) {
        await adjustBalanceAtomically(
          workOrderRecord.customerId,
          delta,
          "work_order_items_update",
          tx,
        );
      }

      return { totalProducts, totalServices, total };
    });

    return NextResponse.json({
      success: true,
      totalProducts: result.totalProducts,
      totalServices: result.totalServices,
      total: result.total,
    });
  } catch (error) {
    console.error("Error updating work order items:", error);
    return NextResponse.json(
      { error: "Failed to update work order items" },
      { status: 500 },
    );
  }
}
