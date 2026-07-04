import { prisma } from '@/lib/prisma';
import { createInvoice, determineInvoiceType } from './invoiceService';

/**
 * Generates a pre-invoice from a Work Order.
 * Usually called when the Work Order is marked as DELIVERED.
 */
export async function generateInvoiceFromWorkOrder(workOrderId: string, createdBy: string) {
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

    // Check if an invoice already exists for this WO to avoid duplicates
    const existingInvoice = await tx.invoice.findFirst({
      where: {
        referenceId: workOrderId,
        referenceType: 'work_order',
        status: { not: 'CANCELLED' },
      },
    });

    if (existingInvoice) {
      return existingInvoice;
    }

    const customer = workOrder.customer;
    const billingData = customer?.billingData;

    let customerDoc: string | undefined = undefined;
    let customerDocType: string | undefined = undefined;

    if (billingData && typeof billingData === 'object') {
      const bd = billingData as any;
      customerDoc = bd.cuit || bd.dni || undefined;
      customerDocType = bd.cuit ? 'CUIT' : (bd.dni ? 'DNI' : undefined);
    }

    const invoiceType = determineInvoiceType(billingData, 'FACTURA', true);

    // Total is already calculated in the work order
    const total = Number(workOrder.total);

    // Create the invoice
    const invoice = await createInvoice({
      type: invoiceType,
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

    // Update the work order with the invoice ID
    await tx.work_order.update({
      where: { id: workOrderId },
      data: { invoiceId: invoice.id },
    });

    return invoice;
  });
}
