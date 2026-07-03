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

/**
 * Creates a new invoice and automatically assigns the next number.
 * If a transaction client is provided, it uses it. Otherwise, it creates a new transaction.
 */
export async function createInvoice(data: InvoiceInput, tx?: Prisma.TransactionClient) {
  const execute = async (transaction: Prisma.TransactionClient) => {
    const number = await getNextInvoiceNumber(data.type, transaction);

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
        subtotal: data.subtotal,
        tax: data.tax,
        iva21: data.iva21,
        iva105: data.iva105,
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
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
    },
  });
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
