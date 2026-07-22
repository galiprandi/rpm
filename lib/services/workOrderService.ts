import { db, type Transaction } from "@/lib/db";
import {
  workOrder,
  workOrderItem,
  invoice,
  payment,
  stockMovement,
  product,
  user,
} from "@/db/schema";
import { eq, and, not, inArray, like } from "drizzle-orm";
import {
  createInvoice,
  determineInvoiceType,
  type InvoiceType,
} from "./invoiceService";
import { logWorkOrderChange } from "./auditService";
import { randomUUID } from "crypto";
import { adjustBalanceAtomically } from "./balanceService";

/**
 * Generates a document (Pre-invoice, Presupuesto, Remito) from a Work Order.
 */
export async function generateDocumentFromWorkOrder(
  workOrderId: string,
  createdBy: string,
  options: { type?: InvoiceType; forceNew?: boolean } = {},
  existingTx?: Transaction,
) {
  const execute = async (tx: Transaction) => {
    // Fetch work order with items and customer
    const workOrderData = await tx.query.workOrder.findFirst({
      where: eq(workOrder.id, workOrderId),
      with: {
        customer: true,
        workOrderItems: true,
      },
    });

    if (!workOrderData) {
      throw new Error("Orden de trabajo no encontrada");
    }

    const customerData = workOrderData.customer;
    const billingData = customerData?.billingData;

    // Determine document type
    const docType =
      options.type || determineInvoiceType(billingData, "FACTURA", true);

    // Check if a document of this type already exists to avoid duplicates
    if (!options.forceNew) {
      const existingDocument = await tx.query.invoice.findFirst({
        where: and(
          eq(invoice.referenceId, workOrderId),
          eq(invoice.referenceType, "work_order"),
          eq(invoice.type, docType),
          not(inArray(invoice.status, ["CANCELLED", "ANNULLED"])),
        ),
      });

      if (existingDocument) {
        return existingDocument;
      }
    }

    let customerDoc: string | undefined = undefined;
    let customerDocType: string | undefined = undefined;

    if (billingData && typeof billingData === "object") {
      const bd = billingData as any;
      customerDoc = bd.cuit || bd.dni || undefined;
      customerDocType = bd.cuit ? "CUIT" : bd.dni ? "DNI" : undefined;
    }

    // Total is already calculated in the work order
    const total = Number(workOrderData.total);

    // Create the invoice/document
    // createInvoice manages its own transaction; call without tx to avoid nesting
    // The work order update below is in the Drizzle transaction.
    const document = await createInvoice(
      {
        type: docType,
        referenceId: workOrderData.id,
        referenceType: "work_order",
        customerId: workOrderData.customerId,
        customerName: customerData!.name,
        customerDoc,
        customerDocType,
        subtotal: total,
        total: total,
        status: "DRAFT",
        createdBy,
      },
    );

    // If it's a pre-invoice, update the work order with the invoice ID
    if (docType.startsWith("X_") || docType.startsWith("FACTURA_")) {
      await tx
        .update(workOrder)
        .set({ invoiceId: document.id })
        .where(eq(workOrder.id, workOrderId));
    }

    return document;
  };

  if (existingTx) {
    return execute(existingTx);
  }

  return await db.transaction(execute);
}

/**
 * Backward compatibility wrapper for generateInvoiceFromWorkOrder.
 */
export async function generateInvoiceFromWorkOrder(
  workOrderId: string,
  createdBy: string,
) {
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
  },
) {
  return await db.transaction(async (tx) => {
    const currentWO = await tx.query.workOrder.findFirst({
      where: eq(workOrder.id, id),
      with: {
        workOrderItems: {
          where: eq(workOrderItem.type, "PRODUCT"),
        },
        customer: { columns: { name: true } },
      },
    });

    if (!currentWO) {
      throw new Error("Orden de trabajo no encontrada");
    }

    // 2. Track audit changes
    const trackedFields = [
      { name: "status", current: currentWO.status, new: data.status },
      {
        name: "technicianId",
        current: currentWO.technicianId,
        new: data.technicianId,
      },
      { name: "notes", current: currentWO.notes, new: data.notes },
      {
        name: "scheduledDate",
        current: currentWO.scheduledDate
          ? new Date(currentWO.scheduledDate).toISOString()
          : undefined,
        new:
          data.scheduledDate instanceof Date
            ? data.scheduledDate.toISOString()
            : data.scheduledDate
              ? new Date(data.scheduledDate).toISOString()
              : undefined,
      },
      {
        name: "paymentMethod",
        current: currentWO.paymentMethod,
        new: data.paymentMethod,
      },
      {
        name: "paymentNotes",
        current: currentWO.paymentNotes,
        new: data.paymentNotes,
      },
    ];

    for (const field of trackedFields) {
      if (
        field.new !== undefined &&
        String(field.current) !== String(field.new)
      ) {
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

    if (data.scheduledDate)
      updateData.scheduledDate = new Date(data.scheduledDate);
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
    await tx.update(workOrder).set(updateData).where(eq(workOrder.id, id));

    // Re-fetch with relations (technician is not a Drizzle relation, fetched separately)
    const updatedWO = await tx.query.workOrder.findFirst({
      where: eq(workOrder.id, id),
      with: {
        customer: {
          columns: { id: true, name: true, phone: true, billingData: true },
        },
        vehicle: {
          columns: { id: true, identifier: true, category: true },
          with: {
            vehicleMake: true,
            vehicleModel: true,
          },
        },
      },
    });

    // Fetch technician separately (not a Drizzle relation)
    let technician: { id: string; name: string } | null = null;
    if (updatedWO?.technicianId) {
      const techUser = await tx.query.user.findFirst({
        where: eq(user.id, updatedWO.technicianId),
        columns: { id: true, name: true },
      });
      technician = techUser || null;
    }

    const updatedWOResult = {
      ...updatedWO,
      technician,
    };

    // 4a. If status changed TO CANCELLED, reverse balance (total - payments)
    if (data.status === "CANCELLED" && currentWO.status !== "CANCELLED") {
      const woTotal = Number(currentWO.total);

      // Fetch actual payments for this WO
      const woPayments = await tx.query.payment.findMany({
        where: eq(payment.workOrderId, id),
        columns: { amount: true },
      });
      const actualPayments = woPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const reversal = woTotal - actualPayments;

      if (Math.abs(reversal) > 0.01) {
        // adjustBalanceAtomically manages its own atomic operation; call without tx
        await adjustBalanceAtomically(
          currentWO.customerId || updatedWO!.customer.id,
          -reversal,
          "work_order_cancel",
        );
      }
    }

    // 5. Stock discounting logic
    if (data.status && ["READY", "PAID", "DELIVERED"].includes(data.status)) {
      const woPrefix = id.substring(0, 8);
      const existingMovements = await tx.query.stockMovement.findFirst({
        where: like(stockMovement.reason, `Venta OT #${woPrefix}%`),
      });

      if (!existingMovements) {
        for (const item of currentWO.workOrderItems) {
          if (item.productId) {
            const productData = await tx.query.product.findFirst({
              where: eq(product.id, item.productId),
              columns: { stock: true, name: true },
            });

            if (productData) {
              const previousStock = Number(productData.stock);
              const newStock = previousStock - item.quantity;

              await tx
                .update(product)
                .set({
                  stock: newStock,
                  lastMovementAt: new Date().toISOString(),
                })
                .where(eq(product.id, item.productId));

              await tx.insert(stockMovement).values({
                id: randomUUID(),
                productId: item.productId,
                quantity: -item.quantity,
                type: "OUT",
                previousStock,
                newStock,
                reason: `Venta OT #${woPrefix} - ${currentWO.customer?.name}`,
                userName: context.userEmail,
              });
            }
          }
        }
      }
    }

    // 6. Auto-generate document on delivery
    if (data.status === "DELIVERED" && currentWO.status !== "DELIVERED") {
      try {
        await generateDocumentFromWorkOrder(
          id,
          context.userId,
          { type: undefined },
          tx,
        );
      } catch (invoiceError) {
        console.error(
          "Error auto-generating invoice for work order:",
          invoiceError,
        );
      }
    }

    return updatedWOResult;
  });
}
