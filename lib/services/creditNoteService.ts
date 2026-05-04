/**
 * Credit note service - simplified: operational returns only
 */
import { prisma } from '@/lib/prisma';
import { createCashMovement } from './cashMovementService';

export interface CreditNoteItemInput {
  productId?: string;
  serviceId?: string;
  quantity: number;
}

export interface CreateCreditNoteInput {
  originalSaleId: string;
  originalSaleType: 'direct_sale' | 'work_order';
  items: CreditNoteItemInput[];
  refundMethod: 'CASH' | 'ACCOUNT_CREDIT';
  paymentMethodId?: string;
  paymentMethodCode?: string;
  notes?: string;
  createdBy: string;
}

function decimalToNumber(decimal: unknown): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  if (typeof decimal === 'object' && 'toNumber' in decimal && typeof (decimal as { toNumber: () => number }).toNumber === 'function') {
    return (decimal as { toNumber: () => number }).toNumber();
  }
  return 0;
}

export async function getAlreadyReturnedQuantities(
  originalSaleId: string,
  originalSaleType: 'direct_sale' | 'work_order',
  tx?: any
) {
  const client = tx || prisma;
  const creditNotes = await client.credit_note.findMany({
    where: {
      originalSaleId,
      originalSaleType,
      status: 'ISSUED',
    },
    include: { items: true },
  });

  const returned: Record<string, number> = {};
  for (const cn of creditNotes) {
    for (const item of cn.items) {
      const key = item.productId || item.serviceId || item.id;
      returned[key] = (returned[key] || 0) + item.quantity;
    }
  }
  return returned;
}

function getOriginalItems(
  saleType: 'direct_sale' | 'work_order',
  sale: any,
) {
  if (saleType === 'direct_sale') {
    return sale.items.map((item: any) => ({
      productId: item.productId,
      serviceId: item.serviceId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      name: item.name || item.product?.name || item.service?.name || 'Sin nombre',
    }));
  }
  return sale.work_order_item.map((item: any) => ({
    productId: item.productId,
    serviceId: item.serviceId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    name: item.product?.name || item.service?.name || 'Sin nombre',
  }));
}

export async function createCreditNote(input: CreateCreditNoteInput) {
  const { originalSaleId, originalSaleType, items, refundMethod, paymentMethodId, paymentMethodCode, notes, createdBy } = input;

  // Fetch original sale
  let sale: any;
  let customerId: string;
  let originalPayments: Array<{ paymentMethodId: string; amount: unknown }> = [];

  if (originalSaleType === 'direct_sale') {
    sale = await prisma.direct_sale.findUnique({
      where: { id: originalSaleId },
      include: {
        items: { include: { product: { select: { name: true } }, service: { select: { name: true } } } },
        payments: true,
        customer: true,
      },
    });
    if (!sale) throw new Error('Venta original no encontrada');
    customerId = sale.customerId;
    originalPayments = sale.payments;
  } else {
    sale = await prisma.work_order.findUnique({
      where: { id: originalSaleId },
      include: {
        work_order_item: { include: { product: { select: { name: true } }, service: { select: { name: true } } } },
        customer: true,
      },
    });
    if (!sale) throw new Error('Orden de trabajo original no encontrada');
    customerId = sale.customerId;
  }

  // Fetch already returned quantities
  const returnedQty = await getAlreadyReturnedQuantities(originalSaleId, originalSaleType);

  // Build credit note items with prices from original sale
  const originalItems = getOriginalItems(originalSaleType, sale);
  const creditNoteItems: Array<{
    productId?: string;
    serviceId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  for (const itemInput of items) {
    const original = originalItems.find(
      (oi) =>
        (itemInput.productId && oi.productId === itemInput.productId) ||
        (itemInput.serviceId && oi.serviceId === itemInput.serviceId)
    );

    if (!original) {
      throw new Error('Item no encontrado en la venta original');
    }

    const key = original.productId || original.serviceId || '';
    const alreadyReturned = returnedQty[key] || 0;
    const remaining = original.quantity - alreadyReturned;

    if (itemInput.quantity > remaining) {
      throw new Error(`No puede devolver más de lo vendido: ${original.name}. Vendido: ${original.quantity}, Ya devuelto: ${alreadyReturned}, Disponible: ${remaining}`);
    }

    const unitPrice = decimalToNumber(original.unitPrice);
    const totalPrice = unitPrice * itemInput.quantity;

    creditNoteItems.push({
      productId: itemInput.productId,
      serviceId: itemInput.serviceId,
      name: original.name,
      quantity: itemInput.quantity,
      unitPrice,
      totalPrice,
    });
  }

  const total = creditNoteItems.reduce((sum, item) => sum + item.totalPrice, 0);

  if (total === 0) {
    throw new Error('El total de la nota de credito no puede ser cero');
  }

  // Validate CASH requirements
  if (refundMethod === 'CASH') {
    if (!paymentMethodId) {
      throw new Error('Debe seleccionar un metodo de pago para reintegro en efectivo');
    }
  }

  // Transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create credit note
    const creditNote = await tx.credit_note.create({
      data: {
        originalSaleId,
        originalSaleType,
        customerId,
        total,
        refundMethod,
        paymentMethodId: refundMethod === 'CASH' ? paymentMethodId : null,
        status: 'ISSUED',
        notes,
        createdBy,
      },
    });

    // Create items and update stock
    for (const item of creditNoteItems) {
      await tx.credit_note_item.create({
        data: {
          creditNoteId: creditNote.id,
          productId: item.productId || null,
          serviceId: item.serviceId || null,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        },
      });

      if (item.productId) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });
        if (!product) throw new Error(`Producto no encontrado: ${item.name}`);

        const previousStock = product.stock;
        const newStock = previousStock + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock, lastMovementAt: new Date() },
        });

        await tx.stock_movement.create({
          data: {
            id: crypto.randomUUID(),
            productId: item.productId,
            quantity: item.quantity,
            type: 'IN',
            previousStock,
            newStock,
            reason: `Devolucion NC #${creditNote.id}`,
            reasonDetails: notes,
            userName: createdBy,
          },
        });
      }
    }

    // Cash movement if CASH
    if (refundMethod === 'CASH') {
      await createCashMovement(
        {
          type: 'EXPENSE',
          amount: total,
          method: paymentMethodCode || 'CASH',
          referenceId: creditNote.id,
          referenceType: 'credit_note_refund',
          reason: `Reintegro NC #${creditNote.id}`,
          notes,
          createdBy,
        },
        tx
      );
    }

    // Update customer balance if ACCOUNT_CREDIT
    if (refundMethod === 'ACCOUNT_CREDIT') {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { balance: true },
      });
      if (!customer) throw new Error('Cliente no encontrado');

      const currentBalance = decimalToNumber(customer.balance);
      const newBalance = currentBalance - total;

      await tx.customer.update({
        where: { id: customerId },
        data: { balance: newBalance },
      });
    }

    return creditNote;
  });

  return result;
}

export async function getCreditNotes(filters: {
  customerId?: string;
  originalSaleId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Record<string, unknown> = {};
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.originalSaleId) where.originalSaleId = filters.originalSaleId;
  if (filters.status) where.status = filters.status;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.createdAt as Record<string, unknown>).lte = filters.endDate;
  }

  return prisma.credit_note.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCreditNoteById(id: string) {
  return prisma.credit_note.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true, balance: true } },
      items: {
        include: {
          product: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
        },
      },
      paymentMethod: { select: { id: true, name: true, code: true } },
    },
  });
}

export async function cancelCreditNote(id: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const creditNote = await tx.credit_note.findUnique({
      where: { id },
      include: { items: true, paymentMethod: { select: { code: true } } },
    });

    if (!creditNote) throw new Error('Nota de credito no encontrada');
    if (creditNote.status === 'CANCELLED') throw new Error('La nota de credito ya esta cancelada');

    // Reverse stock
    for (const item of creditNote.items) {
      if (item.productId) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });
        if (product) {
          const previousStock = product.stock;
          const newStock = previousStock - item.quantity;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock, lastMovementAt: new Date() },
          });
          await tx.stock_movement.create({
            data: {
              id: crypto.randomUUID(),
              productId: item.productId,
              quantity: -item.quantity,
              type: 'OUT',
              previousStock,
              newStock,
              reason: `Cancelacion NC #${id}`,
              reasonDetails: reason,
              userName: 'system',
            },
          });
        }
      }
    }

    // Reverse cash movement if CASH
    if (creditNote.refundMethod === 'CASH' && creditNote.paymentMethodId) {
      await createCashMovement(
        {
          type: 'INCOME',
          amount: Number(creditNote.total),
          method: creditNote.paymentMethod?.code || 'CASH',
          referenceId: id,
          referenceType: 'credit_note_cancelled',
          reason: `Cancelacion NC #${id}`,
          notes: reason,
          createdBy: 'system',
        },
        tx
      );
    }

    // Reverse customer balance if ACCOUNT_CREDIT
    if (creditNote.refundMethod === 'ACCOUNT_CREDIT') {
      const customer = await tx.customer.findUnique({
        where: { id: creditNote.customerId },
        select: { balance: true },
      });
      if (customer) {
        const currentBalance = decimalToNumber(customer.balance);
        const newBalance = currentBalance + Number(creditNote.total);
        await tx.customer.update({
          where: { id: creditNote.customerId },
          data: { balance: newBalance },
        });
      }
    }

    const updated = await tx.credit_note.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return updated;
  });
}
