import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/work-orders/[id]/items - Update work order items
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { items } = body;

    // Check if work order is delivered
    const workOrder = await prisma.work_order.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    if (workOrder.status === 'DELIVERED') {
      return NextResponse.json(
        { error: "Cannot modify items of a delivered work order" },
        { status: 403 }
      );
    }

    // Delete existing items
    await prisma.work_order_item.deleteMany({
      where: { workOrderId: id },
    });

    // Create new items
    let totalProducts = 0;
    let totalServices = 0;
    let total = 0;

    for (const item of items) {
      const isProduct = item.type === 'product';
      const subtotal = item.quantity * item.unitPrice;

      await prisma.work_order_item.create({
        data: {
          id: crypto.randomUUID(),
          workOrderId: id,
          type: isProduct ? 'PRODUCT' : 'SERVICE',
          productId: isProduct ? item.id : null,
          serviceId: !isProduct ? item.id : null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: subtotal,
          priceListId: item.priceListId,
          isManualPrice: item.isManualPrice,
        },
      });

      if (isProduct) {
        totalProducts += subtotal;
      } else {
        totalServices += subtotal;
      }
      total += subtotal;
    }

    // Update work order totals
    await prisma.work_order.update({
      where: { id },
      data: {
        totalProducts,
        totalServices,
        total,
      },
    });

    return NextResponse.json({ 
      success: true,
      totalProducts,
      totalServices,
      total,
    });
  } catch (error) {
    console.error("Error updating work order items:", error);
    return NextResponse.json(
      { error: "Failed to update work order items" },
      { status: 500 }
    );
  }
}
