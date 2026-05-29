// lib/services/purchaseVoucherService.ts
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

/**
 * Create a new draft purchase voucher.
 * @param data - Basic voucher data (supplierId, letter, number, date, notes, createdBy)
 */

export async function createDraftVoucher(data: {
  supplierId: string;
  letter: string;
  number: string;
  date: Date;
  notes?: string;
  totalAmount: Decimal;
  paymentMethodId?: string | null;
  createdBy: string;
}) {
  return await prisma.purchase_voucher.create({
    data: {
      supplierId: data.supplierId,
      letter: data.letter,
      number: data.number,
      date: data.date,
      notes: data.notes,
      totalAmount: data.totalAmount,
      paymentMethodId: data.paymentMethodId || null,
      createdBy: data.createdBy,
      status: 'DRAFT',
    },
  });
}

/**
 * Update voucher header (supplier, letter, number, date, totalAmount, paymentMethod, notes)
 */
export async function updateVoucherHeader(params: {
  voucherId: string;
  supplierId: string;
  letter: string;
  number: string;
  date: Date;
  totalAmount: Decimal;
  paymentMethodId?: string | null;
  notes?: string;
}) {
  // Ensure voucher is in DRAFT state
  const voucher = await prisma.purchase_voucher.findUnique({
    where: { id: params.voucherId },
    select: { status: true },
  });
  if (!voucher || voucher.status !== 'DRAFT') {
    throw new Error('Only draft vouchers can be modified');
  }

  return await prisma.purchase_voucher.update({
    where: { id: params.voucherId },
    data: {
      supplierId: params.supplierId,
      letter: params.letter,
      number: params.number,
      date: params.date,
      totalAmount: params.totalAmount,
      paymentMethodId: params.paymentMethodId,
      notes: params.notes,
    },
  });
}

/** Add an item to a draft voucher */
export async function addItemToVoucher(params: {
  voucherId: string;
  productId: string;
  quantity: number;
  unitCost: Decimal;
  priceListData?: Record<string, { price: number; isFixed: boolean }>;
}) {
  // Ensure voucher is in DRAFT state
  const voucher = await prisma.purchase_voucher.findUnique({
    where: { id: params.voucherId },
    select: { status: true },
  });
  if (!voucher || voucher.status !== 'DRAFT') {
    throw new Error('Only draft vouchers can be modified');
  }
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
    select: { name: true },
  });
  if (!product) throw new Error('Product not found');
  const subtotal = params.unitCost.mul(new Decimal(params.quantity));
  return await prisma.purchase_voucher_item.create({
    data: {
      voucherId: params.voucherId,
      productId: params.productId,
      productName: product.name,
      quantity: params.quantity,
      unitCost: params.unitCost,
      subtotal,
      priceListData: params.priceListData ?? undefined,
    },
  });
}

/** Finalize a draft voucher */
export async function finalizeVoucher(params: {
  voucherId: string;
  paymentMethodId?: string; // optional, null = cuenta corriente
}) {
  return await prisma.$transaction(async (tx) => {
    // Load voucher with items
    const voucher = await tx.purchase_voucher.findUnique({
      where: { id: params.voucherId },
      include: { items: true },
    });
    if (!voucher) throw new Error('Voucher not found');
    if (voucher.status !== 'DRAFT') throw new Error('Only draft vouchers can be finalized');

    // Update stock, replacementCost, and price list items for each product
    for (const item of voucher.items) {
      // Fetch current product stock before update
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true },
      });
      if (!product) throw new Error('Product not found');
      const previousStock = product.stock;

      // Update stock and replacementCost
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          replacementCost: item.unitCost,
          lastMovementAt: new Date(),
        },
      });

      // Create stock movement record
      await tx.stock_movement.create({
        data: {
          id: `sm_${randomUUID()}`,
          productId: item.productId,
          type: 'PURCHASE_VOUCHER',
          quantity: item.quantity,
          previousStock: previousStock,
          newStock: previousStock + item.quantity,
          reason: 'Carga de comprobante de compra',
          reasonDetails: `Voucher ${voucher.id}`,
        },
      });

      // Upsert price_list_item with calculated/fixed prices from priceListData
      if (item.priceListData && typeof item.priceListData === 'object') {
        const priceData = item.priceListData as Record<string, { price: number; isFixed: boolean }>;
        for (const [priceListId, data] of Object.entries(priceData)) {
          if (data.isFixed) {
            // Fixed price: update or create price_list_item with fixedPrice
            await tx.price_list_item.upsert({
              where: {
                priceListId_productId: {
                  priceListId,
                  productId: item.productId,
                },
              },
              update: {
                fixedPrice: data.price,
                overrideMarginPercentage: null,
              },
              create: {
                id: `pli_${randomUUID()}`,
                priceListId,
                productId: item.productId,
                fixedPrice: data.price,
                updatedAt: new Date(),
              },
            });
          } else {
            // Calculated price: update or create with overrideMarginPercentage = null, fixedPrice = null
            // The actual price will be recalculated by the price list service based on new replacementCost
            await tx.price_list_item.upsert({
              where: {
                priceListId_productId: {
                  priceListId,
                  productId: item.productId,
                },
              },
              update: {
                fixedPrice: null,
                overrideMarginPercentage: null,
              },
              create: {
                id: `pli_${randomUUID()}`,
                priceListId,
                productId: item.productId,
                updatedAt: new Date(),
              },
            });
          }
        }
      }
    }

    // If a payment method was provided, create cash movement
    if (params.paymentMethodId) {
      const paymentMethod = await tx.payment_method.findUnique({
        where: { id: params.paymentMethodId },
        select: { isActive: true },
      });
      if (!paymentMethod) throw new Error('Payment method not found');
      if (!paymentMethod.isActive) throw new Error('Payment method is inactive');
      await tx.cash_movement.create({
        data: {
          type: 'PURCHASE_VOUCHER',
          amount: voucher.totalAmount,
          method: 'PURCHASE',
          referenceId: voucher.id,
          referenceType: 'purchase_voucher',
          createdBy: voucher.createdBy,
          createdAt: new Date(),
        },
      });
    }

    // Mark voucher as finalized
    const updated = await tx.purchase_voucher.update({
      where: { id: params.voucherId },
      data: {
        status: 'FINALIZED',
        finalizedAt: new Date(),
        paymentMethodId: params.paymentMethodId ?? null,
      },
    });
    // Invalidate cache for voucher list
    revalidatePath('/adm/purchase-vouchers');
    return updated;
  });
}

/** Retrieve a voucher by ID (including items) */
export async function getVoucherById(id: string) {
  return await prisma.purchase_voucher.findUnique({
    where: { id },
    include: { 
      items: { 
        include: { 
          product: true 
        } 
      }, 
      supplier: true, 
      paymentMethod: true 
    },
  });
}

/** Update a voucher item (quantity and unitCost). Recalculates subtotal. */
export async function updateVoucherItem(params: {
  itemId: string;
  quantity?: number;
  unitCost?: Decimal;
  priceListData?: Record<string, { price: number; isFixed: boolean }>;
}) {
  const { itemId, quantity, unitCost, priceListData } = params;
  // Load existing item to get voucher status
  const item = await prisma.purchase_voucher_item.findUnique({
    where: { id: itemId },
    select: { voucher: { select: { status: true } }, voucherId: true },
  });
  if (!item) throw new Error('Item not found');
  if (item.voucher.status !== 'DRAFT') throw new Error('Only draft vouchers can be modified');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (quantity !== undefined) data.quantity = quantity;
  if (unitCost !== undefined) data.unitCost = unitCost;
  if (priceListData !== undefined) data.priceListData = priceListData;

  // Recalculate subtotal if both quantity and unitCost are provided, or just the changed one
  const currentItem = await prisma.purchase_voucher_item.findUnique({
    where: { id: itemId },
    select: { quantity: true, unitCost: true },
  });
  if (!currentItem) throw new Error('Item not found');
  const newQty = quantity ?? currentItem.quantity;
  const newCost = unitCost ?? currentItem.unitCost;
  data.subtotal = new Decimal(newQty).mul(newCost);

  return await prisma.purchase_voucher_item.update({
    where: { id: itemId },
    data,
  });
}

/** Remove an item from a draft voucher */
export async function removeVoucherItem(params: { itemId: string }) {
  const { itemId } = params;
  const item = await prisma.purchase_voucher_item.findUnique({
    where: { id: itemId },
    select: { voucher: { select: { status: true } }, id: true },
  });
  if (!item) throw new Error('Item not found');
  if (item.voucher.status !== 'DRAFT') throw new Error('Only draft vouchers can be modified');
  return await prisma.purchase_voucher_item.delete({
    where: { id: itemId },
  });
}

/** Delete a draft voucher (only DRAFT status allowed) */
export async function deleteVoucher(params: { voucherId: string }) {
  const { voucherId } = params;
  const voucher = await prisma.purchase_voucher.findUnique({
    where: { id: voucherId },
    select: { status: true },
  });
  if (!voucher) throw new Error('Voucher not found');
  if (voucher.status !== 'DRAFT') throw new Error('Only draft vouchers can be deleted');

  // Delete all items first (cascade delete should handle this, but explicit is safer)
  await prisma.purchase_voucher_item.deleteMany({
    where: { voucherId },
  });

  // Delete the voucher
  await prisma.purchase_voucher.delete({
    where: { id: voucherId },
  });

  // Invalidate cache
  revalidatePath('/adm/purchase-vouchers');
}

/** List vouchers (optionally filter by status), including items for progress tracking */
export async function listVouchers(filter?: { status?: string }) {
  return await prisma.purchase_voucher.findMany({
    where: filter?.status ? { status: filter.status } : undefined,
    include: { supplier: true, items: true, paymentMethod: true },
    orderBy: { createdAt: 'desc' },
  });
}
