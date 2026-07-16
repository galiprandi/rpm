import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type InvoiceType =
  | 'X_A'
  | 'X_B'
  | 'X_C'
  | 'FACTURA_A'
  | 'FACTURA_B'
  | 'FACTURA_C'
  | 'NOTA_CREDITO_X_A'
  | 'NOTA_CREDITO_X_B'
  | 'NOTA_CREDITO_A'
  | 'NOTA_CREDITO_B'
  | 'PRESUPUESTO'
  | 'REMITO';

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'ISSUED' | 'REJECTED' | 'CANCELLED' | 'ANNULLED';

export interface InvoiceInput {
  type: InvoiceType;
  referenceId: string;
  referenceType: 'work_order' | 'direct_sale' | 'credit_note';
  customerId?: string;
  customerName: string;
  customerDoc?: string;
  customerDocType?: string;
  subtotal: number;
  tax?: number;
  iva21?: number;
  iva105?: number;
  exemptions?: Prisma.InputJsonValue;
  perceptions?: Prisma.InputJsonValue;
  total: number;
  afipData?: Prisma.InputJsonValue;
  status: InvoiceStatus;
  issuedAt?: Date;
  createdBy: string;
}

const DEFAULT_IVA_RATE = 21;

/**
 * Creates a new invoice and automatically assigns the next number.
 * If a transaction client is provided, it uses it. Otherwise, it creates a new transaction.
 */
export async function createInvoice(data: InvoiceInput, tx?: Prisma.TransactionClient) {
  const execute = async (transaction: Prisma.TransactionClient) => {
    const number = await getNextInvoiceNumber(data.type, transaction);

    // Auto-calculate taxes if not provided
    let taxes = {
      subtotal: data.subtotal,
      tax: data.tax || 0,
      iva21: data.iva21 || 0,
      iva105: data.iva105 || 0,
    };

    if (data.tax === undefined || data.tax === null) {
      taxes = calculateInvoiceTaxes(data.total, data.type);
    }

    return transaction.invoice.create({
      data: {
        number,
        type: data.type,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        customerId: data.customerId,
        customerName: data.customerName,
        customerDoc: data.customerDoc,
        customerDocType: data.customerDocType,
        subtotal: taxes.subtotal,
        tax: taxes.tax,
        iva21: taxes.iva21,
        iva105: taxes.iva105,
        exemptions: data.exemptions,
        perceptions: data.perceptions,
        total: data.total,
        afipData: data.afipData,
        status: data.status,
        issuedAt: data.issuedAt,
        createdBy: data.createdBy,
      },
    });
  };

  if (tx) {
    return execute(tx);
  }

  return await prisma.$transaction(execute);
}

export async function getInvoices(filters: {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  status?: string;
  customerId?: string;
  search?: string;
}) {
  const where: Prisma.invoiceWhereInput = {};

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.customerId = filters.customerId;

  if (filters.search) {
    where.OR = [
      { number: { contains: filters.search, mode: 'insensitive' } },
      { customerName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.invoice.findMany({
    where,
    include: {
      customer: {
        select: { name: true, phone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
    },
  });

  if (!invoice) return null;

  // Fetch line items based on reference type
  let items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  try {
    if (invoice.referenceType === 'work_order') {
      const woItems = await prisma.work_order_item.findMany({
        where: { workOrderId: invoice.referenceId },
        include: {
          product: { select: { name: true } },
          service: { select: { name: true } },
        },
      });
      items = woItems.map((item) => ({
        name: item.product?.name || item.service?.name || 'Item sin nombre',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.subtotal),
      }));
    } else if (invoice.referenceType === 'direct_sale') {
      const saleItems = await prisma.direct_sale_item.findMany({
        where: { directSaleId: invoice.referenceId },
      });
      items = saleItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      }));
    } else if (invoice.referenceType === 'credit_note') {
      const cnItems = await prisma.credit_note_item.findMany({
        where: { creditNoteId: invoice.referenceId },
      });
      items = cnItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      }));
    }
  } catch (error) {
    console.error('Error fetching items for invoice:', error);
    // Continue without items if fetch fails
  }

  return {
    ...invoice,
    items,
  };
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  issuedAt?: Date,
  afipData?: Prisma.InputJsonValue
) {
  return prisma.invoice.update({
    where: { id },
    data: {
      status,
      issuedAt: issuedAt || (status === 'ISSUED' ? new Date() : undefined),
      afipData: afipData || undefined,
    },
  });
}

/**
 * Updates an invoice with official AFIP data after successful authorization.
 */
export async function markInvoiceAsOfficial(
  id: string,
  data: {
    number: string;
    type: InvoiceType;
    cae: string;
    caeVencimiento: Date;
    afipData: Prisma.InputJsonValue;
  }
) {
  return prisma.invoice.update({
    where: { id },
    data: {
      number: data.number,
      type: data.type,
      status: 'ISSUED',
      issuedAt: new Date(),
      afipData: data.afipData,
    },
  });
}

/**
 * Calculates and returns the next invoice number for a given type.
 * Uses a transaction to ensure no duplicates.
 */
export async function getNextInvoiceNumber(
  type: string,
  tx: Prisma.TransactionClient = prisma
): Promise<string> {
  // Determine prefix based on type
  let prefix = '0001';
  if (type.startsWith('X_') || type.startsWith('NOTA_CREDITO_X_')) {
    prefix = 'X-0001';
  } else if (type === 'PRESUPUESTO') {
    prefix = 'PRES';
  } else if (type === 'REMITO') {
    prefix = 'REM';
  }

  const lastInvoice = await tx.invoice.findFirst({
    where: {
      type,
      number: { startsWith: prefix },
    },
    orderBy: { number: 'desc' },
    select: { number: true },
  });

  if (!lastInvoice) {
    if (prefix.includes('-')) {
      return `${prefix}-00000001`;
    }
    return `${prefix}-00000001`; // Standard format PV-NUM
  }

  const parts = lastInvoice.number.split('-');
  const lastNumStr = parts[parts.length - 1];
  const nextNumber = parseInt(lastNumStr) + 1;

  // Rebuild the number with the same prefix structure
  const nextNumStr = String(nextNumber).padStart(8, '0');
  const otherParts = parts.slice(0, -1);

  if (otherParts.length > 0) {
    return `${otherParts.join('-')}-${nextNumStr}`;
  }
  return `${prefix}-${nextNumStr}`;
}

/**
 * Determines the invoice type based on customer billing data.
 */
export function determineInvoiceType(
  customerBillingData: unknown,
  baseType: 'FACTURA' | 'NOTA_CREDITO' = 'FACTURA',
  isPreInvoice: boolean = true
): InvoiceType {
  const billingData = customerBillingData as { invoiceType?: string } | null;
  const invoiceTypeLetter = billingData?.invoiceType === 'A' ? 'A' : 'B';

  if (baseType === 'FACTURA') {
    if (isPreInvoice) {
      return `X_${invoiceTypeLetter}` as InvoiceType;
    }
    return `FACTURA_${invoiceTypeLetter}` as InvoiceType;
  } else {
    if (isPreInvoice) {
      return `NOTA_CREDITO_X_${invoiceTypeLetter}` as InvoiceType;
    }
    return `NOTA_CREDITO_${invoiceTypeLetter}` as InvoiceType;
  }
}

/**
 * Calculates tax breakdown for an invoice based on its items and customer type.
 * Initial implementation: defaults everything to 21% if it's a RI customer (Type A),
 * or includes it in the total if it's B.
 */
export function calculateInvoiceTaxes(
  total: number,
  invoiceType: InvoiceType
): {
  subtotal: number;
  tax: number;
  iva21: number;
  iva105: number;
} {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isTypeA = invoiceType.endsWith('_A');

  // Regardless of type A or B, for the database and AFIP reporting:
  // total = net (subtotal) + tax
  // For pre-invoices, we assume a standard 21% IVA until we have per-item tax rates.
  const subtotal = total / (1 + DEFAULT_IVA_RATE / 100);
  const tax = total - subtotal;

  return {
    subtotal,
    tax,
    iva21: tax,
    iva105: 0,
  };
}

/**
 * Updates billing data for a DRAFT or REJECTED invoice.
 * If the customerDocType is changed (e.g. from DNI to CUIT), automatically determines
 * the correct new invoice type and re-generates the sequential number.
 */
export async function updateInvoiceBillingData(
  id: string,
  data: {
    customerName?: string;
    customerDoc?: string;
    customerDocType?: string;
  }
) {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new Error("Comprobante no encontrado");
    }

    if (invoice.status !== 'DRAFT' && invoice.status !== 'REJECTED') {
      throw new Error("Solo se pueden editar comprobantes en estado DRAFT o REJECTED");
    }

    const updatedData: any = {};
    if (data.customerName !== undefined) {
      updatedData.customerName = data.customerName;
    }
    if (data.customerDoc !== undefined) {
      updatedData.customerDoc = data.customerDoc;
    }
    if (data.customerDocType !== undefined) {
      updatedData.customerDocType = data.customerDocType;

      // Check if invoice type needs to change based on the document type
      const isCreditNote = invoice.type.startsWith('NOTA_CREDITO_');
      const isPreInvoice = invoice.type.startsWith('X_') || invoice.type.startsWith('NOTA_CREDITO_X_');

      if (isPreInvoice) {
        const letter = data.customerDocType === 'CUIT' ? 'A' : 'B';
        const newType = isCreditNote
          ? (`NOTA_CREDITO_X_${letter}` as InvoiceType)
          : (`X_${letter}` as InvoiceType);

        if (newType !== invoice.type) {
          updatedData.type = newType;
          // Assign next number for the new type
          updatedData.number = await getNextInvoiceNumber(newType, tx);

          // Re-calculate taxes as changing type A <-> B might affect display
          const taxes = calculateInvoiceTaxes(Number(invoice.total), newType);
          updatedData.subtotal = taxes.subtotal;
          updatedData.tax = taxes.tax;
          updatedData.iva21 = taxes.iva21;
          updatedData.iva105 = taxes.iva105;
        }
      }
    }

    return tx.invoice.update({
      where: { id },
      data: updatedData,
    });
  });
}
