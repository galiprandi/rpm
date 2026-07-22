// lib/services/purchaseVoucherService.ts
import { db } from "@/lib/db";
import {
  purchaseVoucher,
  purchaseVoucherItem,
  product,
  stockMovement,
  priceListItem,
  paymentMethod,
  cashMovement,
  supplier,
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { invalidateCashStatus } from "@/lib/cache";
import { randomUUID } from "crypto";

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
  totalAmount: number;
  paymentMethodId?: string | null;
  createdBy: string;
}) {
  const [created] = await db.insert(purchaseVoucher).values({
    supplierId: data.supplierId,
    letter: data.letter,
    number: data.number,
    date: data.date.toISOString(),
    notes: data.notes,
    totalAmount: data.totalAmount.toString(),
    paymentMethodId: data.paymentMethodId || null,
    createdBy: data.createdBy,
    status: "DRAFT",
    updatedAt: new Date().toISOString(),
  }).returning();

  return created;
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
  totalAmount: number;
  paymentMethodId?: string | null;
  notes?: string;
}) {
  // Ensure voucher is in DRAFT state
  const voucher = await db.query.purchaseVoucher.findFirst({
    where: eq(purchaseVoucher.id, params.voucherId),
    columns: { status: true },
  });
  if (!voucher || voucher.status !== "DRAFT") {
    throw new Error("Only draft vouchers can be modified");
  }

  const [updated] = await db.update(purchaseVoucher).set({
    supplierId: params.supplierId,
    letter: params.letter,
    number: params.number,
    date: params.date.toISOString(),
    totalAmount: params.totalAmount.toString(),
    paymentMethodId: params.paymentMethodId,
    notes: params.notes,
  }).where(eq(purchaseVoucher.id, params.voucherId)).returning();

  return updated;
}

/** Add an item to a draft voucher */
export async function addItemToVoucher(params: {
  voucherId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  priceListData?: Record<string, { price: number; isFixed: boolean }>;
}) {
  // Ensure voucher is in DRAFT state
  const voucher = await db.query.purchaseVoucher.findFirst({
    where: eq(purchaseVoucher.id, params.voucherId),
    columns: { status: true },
  });
  if (!voucher || voucher.status !== "DRAFT") {
    throw new Error("Only draft vouchers can be modified");
  }
  const prod = await db.query.product.findFirst({
    where: eq(product.id, params.productId),
    columns: { name: true },
  });
  if (!prod) throw new Error("Product not found");
  const subtotal = params.unitCost * params.quantity;
  const [created] = await db.insert(purchaseVoucherItem).values({
    voucherId: params.voucherId,
    productId: params.productId,
    productName: prod.name,
    quantity: params.quantity,
    unitCost: params.unitCost.toString(),
    subtotal: subtotal.toString(),
    priceListData: params.priceListData ?? undefined,
    updatedAt: new Date().toISOString(),
  }).returning();

  return created;
}

/** Finalize a draft voucher */
export async function finalizeVoucher(params: {
  voucherId: string;
  paymentMethodId?: string; // optional, null = cuenta corriente
}) {
  const result = await db.transaction(async (tx) => {
    // Load voucher with items
    const voucher = await tx.query.purchaseVoucher.findFirst({
      where: eq(purchaseVoucher.id, params.voucherId),
      with: { purchaseVoucherItems: true },
    });
    if (!voucher) throw new Error("Voucher not found");
    if (voucher.status !== "DRAFT")
      throw new Error("Only draft vouchers can be finalized");

    // Update stock, replacementCost, and price list items for each product
    for (const item of voucher.purchaseVoucherItems) {
      // Fetch current product stock before update
      const prod = await tx.query.product.findFirst({
        where: eq(product.id, item.productId),
        columns: { stock: true },
      });
      if (!prod) throw new Error("Product not found");
      const previousStock = prod.stock;

      // Update stock and replacementCost
      await tx.update(product).set({
        stock: sql`${product.stock} + ${item.quantity}`,
        replacementCost: item.unitCost,
        lastMovementAt: new Date().toISOString(),
      }).where(eq(product.id, item.productId));

      // Create stock movement record
      await tx.insert(stockMovement).values({
        id: `sm_${randomUUID()}`,
        productId: item.productId,
        type: "PURCHASE_VOUCHER",
        quantity: item.quantity,
        previousStock: previousStock,
        newStock: previousStock + item.quantity,
        reason: "Carga de comprobante de compra",
        reasonDetails: `Voucher ${voucher.id}`,
      });

      // Upsert price_list_item with calculated/fixed prices from priceListData
      if (item.priceListData && typeof item.priceListData === "object") {
        const priceData = item.priceListData as Record<
          string,
          { price: number; isFixed: boolean }
        >;
        for (const [priceListId, data] of Object.entries(priceData)) {
          // Check if price list item exists
          const existing = await tx.query.priceListItem.findFirst({
            where: and(
              eq(priceListItem.priceListId, priceListId),
              eq(priceListItem.productId, item.productId),
            ),
          });

          if (data.isFixed) {
            // Fixed price: update or create price_list_item with fixedPrice
            if (existing) {
              await tx.update(priceListItem).set({
                fixedPrice: data.price.toString(),
                overrideMarginPercentage: null,
              }).where(eq(priceListItem.id, existing.id));
            } else {
              await tx.insert(priceListItem).values({
                id: `pli_${randomUUID()}`,
                priceListId,
                productId: item.productId,
                fixedPrice: data.price.toString(),
                updatedAt: new Date().toISOString(),
              });
            }
          } else {
            // Calculated price: update or create with overrideMarginPercentage = null, fixedPrice = null
            if (existing) {
              await tx.update(priceListItem).set({
                fixedPrice: null,
                overrideMarginPercentage: null,
              }).where(eq(priceListItem.id, existing.id));
            } else {
              await tx.insert(priceListItem).values({
                id: `pli_${randomUUID()}`,
                priceListId,
                productId: item.productId,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    // If a payment method was provided, create cash movement
    if (params.paymentMethodId) {
      const pm = await tx.query.paymentMethod.findFirst({
        where: eq(paymentMethod.id, params.paymentMethodId),
        columns: { isActive: true },
      });
      if (!pm) throw new Error("Payment method not found");
      if (!pm.isActive)
        throw new Error("Payment method is inactive");
      await tx.insert(cashMovement).values({
        id: `cm_${randomUUID()}`,
        type: "PURCHASE_VOUCHER",
        amount: voucher.totalAmount,
        method: "PURCHASE",
        referenceId: voucher.id,
        referenceType: "purchase_voucher",
        createdBy: voucher.createdBy,
      });
    }

    // Mark voucher as finalized
    const [updated] = await tx.update(purchaseVoucher).set({
      status: "FINALIZED",
      finalizedAt: new Date().toISOString(),
      paymentMethodId: params.paymentMethodId ?? null,
    }).where(eq(purchaseVoucher.id, params.voucherId)).returning();

    // Invalidate cache for voucher list
    revalidatePath("/adm/purchase-vouchers");
    return updated;
  });

  invalidateCashStatus();
  return result;
}

/** Retrieve a voucher by ID (including items) */
export async function getVoucherById(id: string) {
  const voucher = await db.query.purchaseVoucher.findFirst({
    where: eq(purchaseVoucher.id, id),
    with: {
      purchaseVoucherItems: {
        with: {
          product: true,
        },
      },
      supplier: true,
      paymentMethod: true,
    },
  });

  if (!voucher) return null;

  // Map relation names for backward compatibility
  return {
    ...voucher,
    items: voucher.purchaseVoucherItems,
  };
}

/** Update a voucher item (quantity and unitCost). Recalculates subtotal. */
export async function updateVoucherItem(params: {
  itemId: string;
  quantity?: number;
  unitCost?: number;
  priceListData?: Record<string, { price: number; isFixed: boolean }>;
}) {
  const { itemId, quantity, unitCost, priceListData } = params;
  // Load existing item to get voucher status
  const item = await db.query.purchaseVoucherItem.findFirst({
    where: eq(purchaseVoucherItem.id, itemId),
    with: { purchaseVoucher: { columns: { status: true } } },
  });
  if (!item) throw new Error("Item not found");
  if (item.purchaseVoucher.status !== "DRAFT")
    throw new Error("Only draft vouchers can be modified");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (quantity !== undefined) data.quantity = quantity;
  if (unitCost !== undefined) data.unitCost = unitCost.toString();
  if (priceListData !== undefined) data.priceListData = priceListData;

  // Recalculate subtotal if both quantity and unitCost are provided, or just the changed one
  const currentItem = await db.query.purchaseVoucherItem.findFirst({
    where: eq(purchaseVoucherItem.id, itemId),
    columns: { quantity: true, unitCost: true },
  });
  if (!currentItem) throw new Error("Item not found");
  const newQty = quantity ?? currentItem.quantity;
  const newCost = unitCost ?? Number(currentItem.unitCost);
  data.subtotal = (newQty * newCost).toString();

  const [updated] = await db.update(purchaseVoucherItem).set(data)
    .where(eq(purchaseVoucherItem.id, itemId)).returning();

  return updated;
}

/** Remove an item from a draft voucher */
export async function removeVoucherItem(params: { itemId: string }) {
  const { itemId } = params;
  const item = await db.query.purchaseVoucherItem.findFirst({
    where: eq(purchaseVoucherItem.id, itemId),
    with: { purchaseVoucher: { columns: { status: true } } },
  });
  if (!item) throw new Error("Item not found");
  if (item.purchaseVoucher.status !== "DRAFT")
    throw new Error("Only draft vouchers can be modified");
  const [deleted] = await db.delete(purchaseVoucherItem)
    .where(eq(purchaseVoucherItem.id, itemId)).returning();
  return deleted;
}

/** Delete a draft voucher (only DRAFT status allowed) */
export async function deleteVoucher(params: { voucherId: string }) {
  const { voucherId } = params;
  const voucher = await db.query.purchaseVoucher.findFirst({
    where: eq(purchaseVoucher.id, voucherId),
    columns: { status: true },
  });
  if (!voucher) throw new Error("Voucher not found");
  if (voucher.status !== "DRAFT")
    throw new Error("Only draft vouchers can be deleted");

  // Delete all items first (cascade delete should handle this, but explicit is safer)
  await db.delete(purchaseVoucherItem)
    .where(eq(purchaseVoucherItem.voucherId, voucherId));

  // Delete the voucher
  await db.delete(purchaseVoucher)
    .where(eq(purchaseVoucher.id, voucherId));

  // Invalidate cache
  revalidatePath("/adm/purchase-vouchers");
}

/** List vouchers (optionally filter by status), including items for progress tracking */
export async function listVouchers(filter?: { status?: string }) {
  const vouchers = await db.query.purchaseVoucher.findMany({
    where: filter?.status ? eq(purchaseVoucher.status, filter.status) : undefined,
    with: { supplier: true, purchaseVoucherItems: true, paymentMethod: true },
    orderBy: desc(purchaseVoucher.createdAt),
  });

  // Map relation names for backward compatibility
  return vouchers.map(v => ({
    ...v,
    items: v.purchaseVoucherItems,
  }));
}
