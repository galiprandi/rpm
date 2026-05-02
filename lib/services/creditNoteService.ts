/**
 * Service for credit notes and returns
 */
import { prisma } from '@/lib/prisma';
import { createCashMovement } from './cashMovementService';
import { getNextInvoiceNumber } from './invoiceService';

export interface CreditNoteItemInput {
  productId?: string;
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateCreditNoteInput {
  originalSaleId: string;
  originalSaleType: 'direct_sale' | 'work_order';
  customerId: string;
  items: CreditNoteItemInput[];
  refundMethod: 'CASH' | 'ACCOUNT_CREDIT' | 'MIXED';
  cashAmount?: number;
  accountCreditAmount?: number;
  refundMethodCode?: string;
  notes?: string;
  createdBy: string;
}

/**
 * Create a credit note with items and apply all effects
 * - Stock restoration for products
 * - Cash movement for CASH refunds
 * - Customer balance update for ACCOUNT_CREDIT
 * - Invoice creation (NOTA_CREDITO)
 */
export async function createCreditNote(input: CreateCreditNoteInput) {
  const {
    originalSaleId,
    originalSaleType,
    customerId,
    items,
    refundMethod,
    cashAmount,
    accountCreditAmount,
    refundMethodCode,
    notes,
    createdBy,
  } = input;

  // Calculate total
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Validate refund method amounts
  if (refundMethod === 'CASH') {
    if (!cashAmount || cashAmount !== total) {
      throw new Error('For CASH refund method, cashAmount must equal total');
    }
  } else if (refundMethod === 'ACCOUNT_CREDIT') {
    if (!accountCreditAmount || accountCreditAmount !== total) {
      throw new Error('For ACCOUNT_CREDIT refund method, accountCreditAmount must equal total');
    }
  } else if (refundMethod === 'MIXED') {
    if (!cashAmount || !accountCreditAmount || cashAmount + accountCreditAmount !== total) {
      throw new Error('For MIXED refund method, cashAmount + accountCreditAmount must equal total');
    }
  }

  // Validate original sale exists and belongs to the customer
  if (originalSaleType === 'direct_sale') {
    const directSale = await prisma.direct_sale.findUnique({
      where: { id: originalSaleId },
      select: { customerId: true, customerName: true, items: true },
    });

    if (!directSale) {
      throw new Error('Direct sale not found');
    }

    if (directSale.customerId !== customerId) {
      throw new Error('Customer mismatch: credit note must be for the same customer as the original sale');
    }

    // Validate items exist in original sale and quantities are valid
    for (const item of items) {
      const originalItem = directSale.items.find(
        (i) =>
          (item.productId && i.productId === item.productId) ||
          (item.serviceId && i.serviceId === item.serviceId)
      );

      if (!originalItem) {
        throw new Error(`Item not found in original sale: ${item.name}`);
      }

      if (item.quantity > originalItem.quantity) {
        throw new Error(
          `Cannot return more than sold: ${item.name}. Sold: ${originalItem.quantity}, Requested: ${item.quantity}`
        );
      }
    }
  } else if (originalSaleType === 'work_order') {
    const workOrder = await prisma.work_order.findUnique({
      where: { id: originalSaleId },
      select: { customerId: true },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.customerId !== customerId) {
      throw new Error('Customer mismatch: credit note must be for the same customer as the original work order');
    }

    // Validate items exist in original work order
    const workOrderItems = await prisma.work_order_item.findMany({
      where: { workOrderId: originalSaleId },
    });

    for (const item of items) {
      const originalItem = workOrderItems.find(
        (i) =>
          (item.productId && i.productId === item.productId) ||
          (item.serviceId && i.serviceId === item.serviceId)
      );

      if (!originalItem) {
        throw new Error(`Item not found in original work order: ${item.name}`);
      }

      if (item.quantity > originalItem.quantity) {
        throw new Error(
          `Cannot return more than sold: ${item.name}. Sold: ${originalItem.quantity}, Requested: ${item.quantity}`
        );
      }
    }
  }

  // Create credit note in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create credit note
    const creditNote = await (tx as any).credit_note.create({
      data: {
        originalSaleId,
        originalSaleType,
        customerId,
        total,
        refundMethod,
        cashAmount: refundMethod === 'CASH' || refundMethod === 'MIXED' ? cashAmount : null,
        accountCreditAmount:
          refundMethod === 'ACCOUNT_CREDIT' || refundMethod === 'MIXED' ? accountCreditAmount : null,
        refundMethodCode,
        status: 'DRAFT',
        notes,
        createdBy,
      },
    });

    // Create items and update stock for products
    for (const item of items) {
      await (tx as any).credit_note_item.create({
        data: {
          creditNoteId: creditNote.id,
          productId: item.productId,
          serviceId: item.serviceId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        },
      });

      // Update stock for products only (not services)
      if (item.productId) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.name}`);
        }

        const previousStock = product.stock;
        const newStock = previousStock + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            lastMovementAt: new Date(),
          },
        });

        // Create stock movement
        await tx.stock_movement.create({
          data: {
            id: crypto.randomUUID(),
            productId: item.productId,
            quantity: item.quantity,
            type: 'IN',
            previousStock,
            newStock,
            reason: `Devolución NC #${creditNote.id}`,
            reasonDetails: notes,
            userName: createdBy,
          },
        });
      }
    }

    // Create cash movement if refund method includes CASH
    if (refundMethod === 'CASH' || refundMethod === 'MIXED') {
      await createCashMovement(
        {
          type: 'EXPENSE',
          amount: cashAmount!,
          method: refundMethodCode || 'CASH',
          referenceId: creditNote.id,
          referenceType: 'credit_note_refund' as any, // New type, bypassing TS check
          reason: `Reintegro NC #${creditNote.id}`,
          notes,
          createdBy,
        },
        tx
      );
    }

    // Update customer balance if refund method includes ACCOUNT_CREDIT
    if (refundMethod === 'ACCOUNT_CREDIT' || refundMethod === 'MIXED') {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { balance: true },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Helper to convert Decimal to number
      const decimalToNumber = (decimal: unknown): number => {
        if (decimal === null || decimal === undefined) return 0;
        if (typeof decimal === 'number') return decimal;
        if (typeof decimal === 'object' && 'toNumber' in decimal && typeof (decimal as { toNumber: () => number }).toNumber === 'function') {
          return (decimal as { toNumber: () => number }).toNumber();
        }
        return 0;
      };

      const currentBalance = decimalToNumber(customer.balance);
      const newBalance = currentBalance - (accountCreditAmount || 0); // Decrement balance (more negative = credit in favor)

      await tx.customer.update({
        where: { id: customerId },
        data: {
          balance: newBalance,
        },
      });
    }

    // Create invoice (NOTA_CREDITO)
    const customerRecord = await tx.customer.findUnique({
      where: { id: customerId },
      select: { name: true },
    });

    const invoiceNumber = await getNextInvoiceNumber('NOTA_CREDITO');

    const invoice = await tx.invoice.create({
      data: {
        number: invoiceNumber,
        type: 'NOTA_CREDITO',
        referenceId: originalSaleId,
        referenceType: originalSaleType,
        customerId,
        customerName: customerRecord?.name || 'Unknown',
        subtotal: total,
        total,
        status: 'DRAFT',
        createdBy,
      },
    });

    // Link invoice to credit note
    await (tx as any).credit_note.update({
      where: { id: creditNote.id },
      data: {
        invoiceId: invoice.id,
      },
    });

    return { creditNote, invoice };
  });

  return result;
}

/**
 * Get credit notes with filters
 */
export async function getCreditNotes(filters: {
  customerId?: string;
  originalSaleId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Record<string, unknown> = {};

  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters.originalSaleId) {
    where.originalSaleId = filters.originalSaleId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      (where.createdAt as Record<string, unknown>).gte = filters.startDate;
    }
    if (filters.endDate) {
      (where.createdAt as Record<string, unknown>).lte = filters.endDate;
    }
  }

  return (prisma as any).credit_note.findMany({
    where,
    include: {
      customer: {
        select: { id: true, name: true, phone: true },
      },
      invoice: {
        select: { id: true, number: true, status: true },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get credit note by ID with full details
 */
export async function getCreditNoteById(id: string) {
  return (prisma as any).credit_note.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true, phone: true, email: true, balance: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true },
          },
          service: {
            select: { id: true, name: true },
          },
        },
      },
      invoice: true,
    },
  });
}

/**
 * Update credit note status
 */
export async function updateCreditNoteStatus(
  id: string,
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED',
  reason?: string
) {
  return prisma.$transaction(async (tx) => {
    const creditNote = await (tx as any).credit_note.findUnique({
      where: { id },
      include: {
        items: true,
        invoice: true,
      },
    });

    if (!creditNote) {
      throw new Error('Credit note not found');
    }

    // If cancelling, reverse all movements
    if (status === 'CANCELLED') {
      // Reverse stock movements
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
              data: {
                stock: newStock,
                lastMovementAt: new Date(),
              },
            });

            await tx.stock_movement.create({
              data: {
                id: crypto.randomUUID(),
                productId: item.productId,
                quantity: -item.quantity,
                type: 'OUT',
                previousStock,
                newStock,
                reason: `Cancelación NC #${id}`,
                reasonDetails: reason,
                userName: 'system',
              },
            });
          }
        }
      }

      // Reverse cash movement if CASH or MIXED
      if (creditNote.refundMethod === 'CASH' || creditNote.refundMethod === 'MIXED') {
        await createCashMovement(
          {
            type: 'INCOME',
            amount: creditNote.cashAmount || 0,
            method: creditNote.refundMethodCode || 'CASH',
            referenceId: id,
            referenceType: 'credit_note_cancelled' as any, // New type, bypassing TS check
            reason: `Cancelación NC #${id}`,
            notes: reason,
            createdBy: 'system',
          },
          tx
        );
      }

      // Reverse customer balance if ACCOUNT_CREDIT or MIXED
      if (creditNote.refundMethod === 'ACCOUNT_CREDIT' || creditNote.refundMethod === 'MIXED') {
        const customer = await tx.customer.findUnique({
          where: { id: creditNote.customerId },
          select: { balance: true },
        });

        if (customer) {
          const decimalToNumber = (decimal: unknown): number => {
            if (decimal === null || decimal === undefined) return 0;
            if (typeof decimal === 'number') return decimal;
            if (typeof decimal === 'object' && 'toNumber' in decimal && typeof (decimal as { toNumber: () => number }).toNumber === 'function') {
              return (decimal as { toNumber: () => number }).toNumber();
            }
            return 0;
          };

          const currentBalance = decimalToNumber(customer.balance);
          const newBalance = currentBalance + (creditNote.accountCreditAmount || 0); // Increment balance back

          await tx.customer.update({
            where: { id: creditNote.customerId },
            data: {
              balance: newBalance,
            },
          });
        }
      }

      // Update invoice status if exists
      if (creditNote.invoice) {
        await tx.invoice.update({
          where: { id: creditNote.invoice.id },
          data: { status: 'CANCELLED' },
        });
      }
    }

    // Update credit note status
    const updated = await (tx as any).credit_note.update({
      where: { id },
      data: { status },
    });

    return updated;
  });
}
