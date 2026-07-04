import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createInvoice, determineInvoiceType } from "@/lib/services/invoiceService";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { randomUUID } from "crypto";

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Use a transaction for status update and stock discounting
    const workOrder = await prisma.$transaction(async (tx) => {
      // Get current work order to check timestamps and items
      const currentWorkOrder = await tx.work_order.findUnique({
        where: { id },
        include: {
          work_order_item: {
            where: { type: 'PRODUCT' },
          },
          customer: { select: { name: true } }
        }
      });

      if (!currentWorkOrder) {
        throw new Error("Work order not found");
      }

      // Build update data with timestamps based on status
      const updateData: Record<string, unknown> = { status };

      if (status === "IN_PROGRESS" && !currentWorkOrder.startedAt) {
        updateData.startedAt = new Date();
      } else if (["READY", "PAID", "DELIVERED"].includes(status) && !currentWorkOrder.completedAt) {
        updateData.completedAt = new Date();
      }

      if (status === "DELIVERED" && !currentWorkOrder.deliveredAt) {
        updateData.deliveredAt = new Date();
      }

      // Update work order
      const updatedWO = await tx.work_order.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              billingData: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              identifier: true,
              category: true,
            },
          },
        },
      });

      // Discount stock if moving to a final status for the first time
      if (["READY", "PAID", "DELIVERED"].includes(status)) {
        // Check if already discounted (by looking for movements with this WO ID)
        const woPrefix = id.substring(0, 8);
        const existingMovements = await tx.stock_movement.findFirst({
          where: { reason: { startsWith: `Venta OT #${woPrefix}` } }
        });

        if (!existingMovements) {
          for (const item of currentWorkOrder.work_order_item) {
            if (item.productId) {
              const product = await tx.product.findUnique({
                where: { id: item.productId },
                select: { stock: true, name: true },
              });

              if (product) {
                const previousStock = product.stock;
                const newStock = previousStock - item.quantity;

                await tx.product.update({
                  where: { id: item.productId },
                  data: {
                    stock: newStock,
                    lastMovementAt: new Date(),
                  },
                });

                // Create stock movement record
                await tx.stock_movement.create({
                  data: {
                    id: randomUUID(),
                    productId: item.productId,
                    quantity: -item.quantity,
                    type: 'OUT',
                    previousStock,
                    newStock,
                    reason: `Venta OT #${woPrefix} - ${currentWorkOrder.customer.name}`,
                    userName: session?.user.email || 'system',
                  },
                });
              }
            }
          }
        }
      }

      return updatedWO;
    });

    // --- Generate Pre-Invoice on Delivery ---
    if (status === "DELIVERED") {
      try {
        const billingData = workOrder.customer.billingData as any;
        let customerDoc: string | undefined = undefined;
        let customerDocType: string | undefined = undefined;

        if (billingData && typeof billingData === 'object') {
          customerDoc = billingData.cuit || billingData.dni || undefined;
          customerDocType = billingData.cuit ? 'CUIT' : (billingData.dni ? 'DNI' : undefined);
        }

        const invoiceType = determineInvoiceType(billingData, 'FACTURA', true);

        await createInvoice({
          type: invoiceType,
          referenceId: workOrder.id,
          referenceType: 'work_order',
          customerId: workOrder.customerId,
          customerName: workOrder.customer.name,
          customerDoc,
          customerDocType,
          subtotal: Number(workOrder.total), // Simplified
          total: Number(workOrder.total),
          status: 'DRAFT',
          createdBy: session?.user.id || 'system',
        });
      } catch (invoiceError) {
        console.error('Error generating pre-invoice for work order:', invoiceError);
      }
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error("Error updating work order status:", error);
    return NextResponse.json(
      { error: "Failed to update work order status" },
      { status: 500 }
    );
  }
}
