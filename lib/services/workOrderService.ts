import { prisma } from '@/lib/prisma';
import { createInvoice, determineInvoiceType, type InvoiceType } from './invoiceService';

/**
 * Generates a document (Pre-invoice, Presupuesto, Remito) from a Work Order.
 */
export async function generateDocumentFromWorkOrder(
  workOrderId: string,
  createdBy: string,
  options: { type?: InvoiceType; forceNew?: boolean } = {}
) {
  return await prisma.$transaction(async (tx) => {
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
    // For PRESUPUESTO and REMITO, we might allow multiple if forceNew is true,
    // but for invoices we generally want only one active.
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
      subtotal: total, // Simplified for now: total = subtotal
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
  });
}

/**
 * Backward compatibility wrapper for generateInvoiceFromWorkOrder.
 */
export async function generateInvoiceFromWorkOrder(workOrderId: string, createdBy: string) {
  return generateDocumentFromWorkOrder(workOrderId, createdBy);
}
