import { prisma } from '@/lib/prisma';
import { createInvoice, determineInvoiceType, type InvoiceType } from './invoiceService';
import { logWorkOrderChange } from "./auditService";
import { randomUUID } from "crypto";

/**
 * Generates a document (Pre-invoice, Presupuesto, Remito) from a Work Order.
 */
export async function generateDocumentFromWorkOrder(
  workOrderId: string,
  createdBy: string,
  options: { type?: InvoiceType; forceNew?: boolean } = {},
  existingTx?: any
) {
  const execute = async (tx: any) => {
    // Fetch work order with items and customer
    const workOrder = await tx.work_order.findUnique({
      where: { id: workOrderId },
      include: {
        customer: true,
        work_order_item: true,
      },
    });

    if (!workOrder) {
      throw new Error('Orden de trabajo no encontrada');
    }

    const customer = workOrder.customer;
    const billingData = customer?.billingData;

    // Determine document type
    const docType = options.type || determineInvoiceType(billingData, 'FACTURA', true);

    // Check if a document of this type already exists to avoid duplicates
    if (!options.forceNew) {
      const existingDocument = await tx.invoice.findFirst({
        where: {
          referenceId: workOrderId,
          referenceType: 'work_order',
          type: docType,
          status: { notIn: ['CANCELLED', 'ANNULLED'] },
        },
      });

      if (existingDocument) {
        return existingDocument;
      }
    }

    let customerDoc: string | undefined = undefined;
    let customerDocType: string | undefined = undefined;

    if (billingData && typeof billingData === 'object') {
      const bd = billingData as any;
      customerDoc = bd.cuit || bd.dni || undefined;
      customerDocType = bd.cuit ? 'CUIT' : (bd.dni ? 'DNI' : undefined);
    }

    // Total is already calculated in the work order
    const total = Number(workOrder.total);

    // Create the invoice/document
    const document = await createInvoice({
      type: docType,
      referenceId: workOrder.id,
      referenceType: 'work_order',
      customerId: workOrder.customerId,
      customerName: customer.name,
      customerDoc,
      customerDocType,
      subtotal: total,
      total: total,
      status: 'DRAFT',
      createdBy,
    }, tx);

    // If it's a pre-invoice, update the work order with the invoice ID
    if (docType.startsWith('X_') || docType.startsWith('FACTURA_')) {
      await tx.work_order.update({
        where: { id: workOrderId },
        data: { invoiceId: document.id },
      });
    }

    return document;
  };

  if (existingTx) {
    return execute(existingTx);
  }

  return await prisma.$transaction(execute);
}

/**
 * Backward compatibility wrapper for generateInvoiceFromWorkOrder.
 */
export async function generateInvoiceFromWorkOrder(workOrderId: string, createdBy: string) {
  return generateDocumentFromWorkOrder(workOrderId, createdBy);
}

/**
 * Updates a Work Order with centralized logic for audit logs, status transitions, and side effects.
 */
export async function updateWorkOrder(
  id: string,
  data: {
    status?: string;
    technicianId?: string | null;
    entryChecklist?: any;
    exitChecklist?: any;
    notes?: string;
    paymentMethod?: string;
    paymentNotes?: string;
    scheduledDate?: string | Date;
    startedAt?: string | Date;
    completedAt?: string | Date;
    deliveredAt?: string | Date;
  },
  context: {
    userId: string;
    userEmail: string;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  return await prisma.$transaction(async (tx) => {
    const currentWO = await tx.work_order.findUnique({
      where: { id },
      include: {
        work_order_item: {
          where: { type: "PRODUCT" },
        },
        customer: { select: { name: true } },
      },
    });

    if (!currentWO) {
      throw new Error("Orden de trabajo no encontrada");
    }

    // 2. Track audit changes
    const trackedFields = [
      { name: "status", current: currentWO.status, new: data.status },
      { name: "technicianId", current: currentWO.technicianId, new: data.technicianId },
      { name: "notes", current: currentWO.notes, new: data.notes },
      { name: "scheduledDate", current: currentWO.scheduledDate?.toISOString(), new: data.scheduledDate instanceof Date ? data.scheduledDate.toISOString() : (data.scheduledDate ? new Date(data.scheduledDate).toISOString() : undefined) },
      { name: "paymentMethod", current: currentWO.paymentMethod, new: data.paymentMethod },
      { name: "paymentNotes", current: currentWO.paymentNotes, new: data.paymentNotes },
    ];

    for (const field of trackedFields) {
      if (field.new !== undefined && String(field.current) !== String(field.new)) {
        await logWorkOrderChange({
          workOrderId: id,
          fieldName: field.name,
          oldValue: field.current,
          newValue: field.new,
          changedBy: context.userEmail,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
      }
    }

    // 3. Status-based timestamp management
    const updateData: any = { ...data };

    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
    if (data.startedAt) updateData.startedAt = new Date(data.startedAt);
    if (data.completedAt) updateData.completedAt = new Date(data.completedAt);
    if (data.deliveredAt) updateData.deliveredAt = new Date(data.deliveredAt);

    if (data.status) {
      if (data.status === "IN_PROGRESS" && !currentWO.startedAt) {
        updateData.startedAt = new Date();
      } else if (
        ["READY", "PAID", "DELIVERED"].includes(data.status) &&
        !currentWO.completedAt
      ) {
        updateData.completedAt = new Date();
      }

      if (data.status === "DELIVERED" && !currentWO.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }

    // 4. Update the Work Order
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
            vehicle_make: true,
            vehicle_model: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 5. Stock discounting logic
    if (data.status && ["READY", "PAID", "DELIVERED"].includes(data.status)) {
      const woPrefix = id.substring(0, 8);
      const existingMovements = await tx.stock_movement.findFirst({
        where: { reason: { startsWith: `Venta OT #${woPrefix}` } },
      });

      if (!existingMovements) {
        for (const item of currentWO.work_order_item) {
          if (item.productId) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true, name: true },
            });

            if (product) {
              const previousStock = Number(product.stock);
              const newStock = previousStock - item.quantity;

              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: newStock,
                  lastMovementAt: new Date(),
                },
              });

              await tx.stock_movement.create({
                data: {
                  id: randomUUID(),
                  productId: item.productId,
                  quantity: -item.quantity,
                  type: "OUT",
                  previousStock,
                  newStock,
                  reason: `Venta OT #${woPrefix} - ${currentWO.customer.name}`,
                  userName: context.userEmail,
                },
              });
            }
          }
        }
      }
    }

    // 6. Auto-generate document on delivery
    if (data.status === "DELIVERED" && currentWO.status !== "DELIVERED") {
      try {
        await generateDocumentFromWorkOrder(id, context.userId, { type: undefined }, tx);
      } catch (invoiceError) {
        console.error("Error auto-generating invoice for work order:", invoiceError);
      }
    }

    return updatedWO;
  });
}
