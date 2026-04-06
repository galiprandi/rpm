import { prisma } from '@/lib/prisma';

export interface InvoiceInput {
  number: string;
  type: 'FACTURA_A' | 'FACTURA_B' | 'NOTA_CREDITO' | 'RECIBO';
  referenceId: string;
  referenceType: 'work_order' | 'direct_sale';
  customerId?: string;
  customerName: string;
  subtotal: number;
  tax?: number;
  total: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  afipData?: any;
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED';
  issuedAt?: Date;
  createdBy: string;
}

export async function createInvoice(data: InvoiceInput) {
  return prisma.invoice.create({
    data: {
      number: data.number,
      type: data.type,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      customerId: data.customerId,
      customerName: data.customerName,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      afipData: data.afipData,
      status: data.status,
      issuedAt: data.issuedAt,
      createdBy: data.createdBy,
    },
  });
}

export async function getInvoices(filters: {
  startDate?: Date;
  endDate?: Date;
  type?: string;
  status?: string;
  customerId?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.customerId = filters.customerId;

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

export async function updateInvoiceStatus(id: string, status: 'DRAFT' | 'ISSUED' | 'CANCELLED', issuedAt?: Date) {
  return prisma.invoice.update({
    where: { id },
    data: {
      status,
      issuedAt: issuedAt || (status === 'ISSUED' ? new Date() : null),
    },
  });
}

export async function getNextInvoiceNumber(type: string): Promise<string> {
  const lastInvoice = await prisma.invoice.findFirst({
    where: { type },
    orderBy: { number: 'desc' },
    select: { number: true },
  });

  if (!lastInvoice) {
    return '0001-00000001';
  }

  const [prefix, number] = lastInvoice.number.split('-');
  const nextNumber = parseInt(number) + 1;
  return `${prefix}-${String(nextNumber).padStart(8, '0')}`;
}
