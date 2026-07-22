/**
 * PriceList Service - CRUD operations for price lists and items
 *
 * Especificaciones relacionadas:
 * - /specs/spec-price-lists.md
 */

import { db } from '@/lib/db';
import { priceList, priceListItem, product } from '@/db/schema';
import { eq, sql, asc, desc } from 'drizzle-orm';
import { calculateFinalPrice, calculateMarginPercentage, type RoundingRule } from '@/lib/utils/rounding';
import { getMinimumMargin } from './settingsService';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

/**
 * Invalidate the public catalog cache (home + /productos) since price list
 * mutations affect public pricing. Called at the end of every mutating
 * function below.
 */
function revalidatePublicCatalog(): void {
  revalidatePath('/');
  revalidatePath('/productos');
}

/**
 * Calculate the effective base cost for a product.
 * Uses replacementCost if available (> 0), otherwise falls back to costPrice.
 * This is the centralized source of truth for product cost calculation.
 *
 * @param replacementCost - The replacement cost (may be null, 0, or string/number)
 * @param costPrice - The cost price (fallback, may be string/number)
 * @returns The effective base cost as a number
 */
export function getProductBaseCost(
  replacementCost: unknown,
  costPrice: unknown
): number {
  const replacement = replacementCost !== null && replacementCost !== undefined
    ? Number(replacementCost)
    : 0;

  if (replacement > 0) {
    return replacement;
  }

  return costPrice !== null && costPrice !== undefined
    ? Number(costPrice)
    : 0;
}

// Types
export interface PriceList {
  id: string;
  name: string;
  isPublic: boolean;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  baseMarginPercentage: number;
  roundingRule: RoundingRule;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string | null;
  productName?: string;
  productSku?: string;
  replacementCost?: number;
  overrideMarginPercentage: number | null;
  fixedPrice: number | null;
  finalPrice: number;
  actualMargin: number;
  isBelowMinimum: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceListDetail extends PriceList {
  items: PriceListItem[];
}

export interface CreatePriceListInput {
  name: string;
  isPublic?: boolean;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  baseMarginPercentage: number;
  roundingRule?: RoundingRule;
}

export type UpdatePriceListInput = Partial<CreatePriceListInput>;

export interface CreatePriceListItemInput {
  productId: string;
  overrideMarginPercentage?: number | null;
  fixedPrice?: number | null;
}

export interface PriceListResult {
  priceLists: PriceList[];
  total: number;
}

export interface CalculatedPrice {
  replacementCost: number;
  baseMargin: number;
  appliedMargin: number;
  roundingRule: RoundingRule;
  finalPrice: number;
  actualMargin: number;
  isBelowMinimum: boolean;
  fixedPrice: number | null;
}

// Helper to count items for a price list
async function countPriceListItems(plId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)::int` })
    .from(priceListItem)
    .where(eq(priceListItem.priceListId, plId));
  return result[0]?.count ?? 0;
}

// GET all price lists
export async function getPriceLists(includeInactive: boolean = false): Promise<PriceListResult> {
  const priceLists = await db.query.priceList.findMany({
    where: includeInactive ? undefined : eq(priceList.isActive, true),
    orderBy: asc(priceList.name),
    with: {
      priceListItems: true,
    },
  });

  return {
    priceLists: priceLists.map((pl) => ({
      id: pl.id,
      name: pl.name,
      isPublic: pl.isPublic,
      isActive: pl.isActive,
      startDate: pl.startDate ? new Date(pl.startDate) : null,
      endDate: pl.endDate ? new Date(pl.endDate) : null,
      baseMarginPercentage: Number(pl.baseMarginPercentage),
      roundingRule: pl.roundingRule as RoundingRule,
      itemCount: pl.priceListItems.length,
      createdAt: new Date(pl.createdAt),
      updatedAt: new Date(pl.updatedAt),
    })),
    total: priceLists.length,
  };
}

// GET price list by ID with items
export async function getPriceListById(id: string): Promise<PriceListDetail | null> {
  const pl = await db.query.priceList.findFirst({
    where: eq(priceList.id, id),
    with: {
      priceListItems: {
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              sku: true,
              replacementCost: true,
            },
          },
        },
        orderBy: desc(priceListItem.createdAt),
      },
    },
  });

  if (!pl) return null;

  const minimumMargin = await getMinimumMargin();

  // Transform items with calculated prices and margins
  const transformedItems: PriceListItem[] = pl.priceListItems.map((item) => {
    const replacementCost = item.product?.replacementCost
      ? Number(item.product.replacementCost)
      : 0;

    const finalPrice = item.fixedPrice !== null
      ? Number(item.fixedPrice)
      : calculateFinalPrice(
          replacementCost,
          Number(pl.baseMarginPercentage),
          pl.roundingRule as RoundingRule,
          item.overrideMarginPercentage !== null
            ? { overrideMarginPercentage: Number(item.overrideMarginPercentage) }
            : undefined
        );

    const actualMargin = calculateMarginPercentage(replacementCost, finalPrice);

    return {
      id: item.id,
      priceListId: item.priceListId,
      productId: item.productId,
      productName: item.product?.name,
      productSku: item.product?.sku ?? undefined,
      replacementCost,
      overrideMarginPercentage: item.overrideMarginPercentage !== null
        ? Number(item.overrideMarginPercentage)
        : null,
      fixedPrice: item.fixedPrice !== null ? Number(item.fixedPrice) : null,
      finalPrice,
      actualMargin,
      isBelowMinimum: actualMargin < minimumMargin,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    };
  });

  return {
    id: pl.id,
    name: pl.name,
    isPublic: pl.isPublic,
    isActive: pl.isActive,
    startDate: pl.startDate ? new Date(pl.startDate) : null,
    endDate: pl.endDate ? new Date(pl.endDate) : null,
    baseMarginPercentage: Number(pl.baseMarginPercentage),
    roundingRule: pl.roundingRule as RoundingRule,
    itemCount: pl.priceListItems.length,
    createdAt: new Date(pl.createdAt),
    updatedAt: new Date(pl.updatedAt),
    items: transformedItems,
  };
}

// GET price list by name (for uniqueness validation)
export async function getPriceListByName(name: string): Promise<PriceList | null> {
  const pl = await db.query.priceList.findFirst({
    where: eq(priceList.name, name),
    with: {
      priceListItems: true,
    },
  });

  if (!pl) return null;

  return {
    id: pl.id,
    name: pl.name,
    isPublic: pl.isPublic,
    isActive: pl.isActive,
    startDate: pl.startDate ? new Date(pl.startDate) : null,
    endDate: pl.endDate ? new Date(pl.endDate) : null,
    baseMarginPercentage: Number(pl.baseMarginPercentage),
    roundingRule: pl.roundingRule as RoundingRule,
    itemCount: pl.priceListItems.length,
    createdAt: new Date(pl.createdAt),
    updatedAt: new Date(pl.updatedAt),
  };
}

// CREATE price list
export async function createPriceList(input: CreatePriceListInput): Promise<PriceList> {
  const [created] = await db.insert(priceList).values({
    id: randomUUID(),
    name: input.name,
    isPublic: input.isPublic ?? false,
    isActive: input.isActive ?? true,
    startDate: input.startDate ? input.startDate.toISOString() : null,
    endDate: input.endDate ? input.endDate.toISOString() : null,
    baseMarginPercentage: input.baseMarginPercentage.toString(),
    roundingRule: input.roundingRule ?? 'SMART_HUNDREDS',
    updatedAt: new Date().toISOString(),
  }).returning();

  revalidatePublicCatalog();

  const itemCount = await countPriceListItems(created.id);

  return {
    id: created.id,
    name: created.name,
    isPublic: created.isPublic,
    isActive: created.isActive,
    startDate: created.startDate ? new Date(created.startDate) : null,
    endDate: created.endDate ? new Date(created.endDate) : null,
    baseMarginPercentage: Number(created.baseMarginPercentage),
    roundingRule: created.roundingRule as RoundingRule,
    itemCount,
    createdAt: new Date(created.createdAt),
    updatedAt: new Date(created.updatedAt),
  };
}

// UPDATE price list
export async function updatePriceList(id: string, input: UpdatePriceListInput): Promise<PriceList> {
  const data: Partial<typeof priceList.$inferInsert> = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.isPublic !== undefined) data.isPublic = input.isPublic;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.startDate !== undefined) data.startDate = input.startDate ? input.startDate.toISOString() : null;
  if (input.endDate !== undefined) data.endDate = input.endDate ? input.endDate.toISOString() : null;
  if (input.baseMarginPercentage !== undefined) data.baseMarginPercentage = input.baseMarginPercentage.toString();
  if (input.roundingRule !== undefined) data.roundingRule = input.roundingRule;

  await db.update(priceList).set(data).where(eq(priceList.id, id));

  revalidatePublicCatalog();

  const pl = await db.query.priceList.findFirst({
    where: eq(priceList.id, id),
    with: { priceListItems: true },
  });

  if (!pl) throw new Error('Price list not found after update');

  return {
    id: pl.id,
    name: pl.name,
    isPublic: pl.isPublic,
    isActive: pl.isActive,
    startDate: pl.startDate ? new Date(pl.startDate) : null,
    endDate: pl.endDate ? new Date(pl.endDate) : null,
    baseMarginPercentage: Number(pl.baseMarginPercentage),
    roundingRule: pl.roundingRule as RoundingRule,
    itemCount: pl.priceListItems.length,
    createdAt: new Date(pl.createdAt),
    updatedAt: new Date(pl.updatedAt),
  };
}

// DELETE price list (hard delete with cascade)
export async function deletePriceList(id: string): Promise<void> {
  await db.delete(priceList).where(eq(priceList.id, id));
  revalidatePublicCatalog();
}

// CREATE price list item (exception)
export async function createPriceListItem(
  priceListId: string,
  input: CreatePriceListItemInput
): Promise<PriceListItem> {
  // Verify the price list exists
  const pl = await db.query.priceList.findFirst({
    where: eq(priceList.id, priceListId),
  });

  if (!pl) {
    throw new Error('Price list not found');
  }

  // Verify the product exists and has replacement cost
  const prod = await db.query.product.findFirst({
    where: eq(product.id, input.productId),
  });

  if (!prod) {
    throw new Error('Product not found');
  }

  const replacementCost = getProductBaseCost(prod.replacementCost, prod.costPrice);

  // Create the item
  const [item] = await db.insert(priceListItem).values({
    id: randomUUID(),
    priceListId,
    productId: input.productId,
    overrideMarginPercentage: input.overrideMarginPercentage != null ? input.overrideMarginPercentage.toString() : null,
    fixedPrice: input.fixedPrice != null ? input.fixedPrice.toString() : null,
    updatedAt: new Date().toISOString(),
  }).returning();

  // Fetch with product relation
  const itemWithProduct = await db.query.priceListItem.findFirst({
    where: eq(priceListItem.id, item.id),
    with: {
      product: {
        columns: {
          id: true,
          name: true,
          sku: true,
          replacementCost: true,
          costPrice: true,
        },
      },
    },
  });

  const minimumMargin = await getMinimumMargin();

  const finalPrice = item.fixedPrice !== null
    ? Number(item.fixedPrice)
    : calculateFinalPrice(
        replacementCost,
        Number(pl.baseMarginPercentage),
        pl.roundingRule as RoundingRule,
        item.overrideMarginPercentage !== null
          ? { overrideMarginPercentage: Number(item.overrideMarginPercentage) }
          : undefined
      );

  const actualMargin = calculateMarginPercentage(replacementCost, finalPrice);

  revalidatePublicCatalog();
  return {
    id: item.id,
    priceListId: item.priceListId,
    productId: item.productId,
    productName: itemWithProduct?.product?.name || 'Unknown Product',
    productSku: itemWithProduct?.product?.sku || undefined,
    replacementCost,
    overrideMarginPercentage: item.overrideMarginPercentage !== null
      ? Number(item.overrideMarginPercentage)
      : null,
    fixedPrice: item.fixedPrice !== null ? Number(item.fixedPrice) : null,
    finalPrice,
    actualMargin,
    isBelowMinimum: actualMargin < minimumMargin,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

// DELETE price list item
export async function deletePriceListItem(id: string): Promise<void> {
  await db.delete(priceListItem).where(eq(priceListItem.id, id));
  revalidatePublicCatalog();
}

// Calculate price for a product in a specific price list
export async function calculateProductPrice(
  productId: string,
  priceListId: string
): Promise<CalculatedPrice | null> {
  const pl = await db.query.priceList.findFirst({
    where: eq(priceList.id, priceListId),
  });

  if (!pl) return null;

  const prod = await db.query.product.findFirst({
    where: eq(product.id, productId),
  });

  if (!prod) return null;

  const replacementCost = getProductBaseCost(prod.replacementCost, prod.costPrice);

  // Check for exception
  const exception = await db.query.priceListItem.findFirst({
    where: eq(priceListItem.priceListId, priceListId),
  });

  // Need to also filter by productId - use a more specific query
  const exceptionWithProduct = exception?.productId === productId ? exception : await db.query.priceListItem.findFirst({
    where: eq(priceListItem.productId, productId),
  });

  // Actually, we need to find by both priceListId AND productId
  // Let's use a proper query
  const { and } = await import('drizzle-orm');
  const properException = await db.query.priceListItem.findFirst({
    where: and(
      eq(priceListItem.priceListId, priceListId),
      eq(priceListItem.productId, productId),
    ),
  });

  const minimumMargin = await getMinimumMargin();

  const finalPrice = properException?.fixedPrice !== null && properException?.fixedPrice !== undefined
    ? Number(properException.fixedPrice)
    : calculateFinalPrice(
        replacementCost,
        Number(pl.baseMarginPercentage),
        pl.roundingRule as RoundingRule,
        properException?.overrideMarginPercentage !== null && properException?.overrideMarginPercentage !== undefined
          ? { overrideMarginPercentage: Number(properException.overrideMarginPercentage) }
          : undefined
      );

  const appliedMargin = properException?.overrideMarginPercentage !== null && properException?.overrideMarginPercentage !== undefined
    ? Number(properException.overrideMarginPercentage)
    : Number(pl.baseMarginPercentage);

  const actualMargin = calculateMarginPercentage(replacementCost, finalPrice);

  return {
    replacementCost,
    baseMargin: Number(pl.baseMarginPercentage),
    appliedMargin,
    roundingRule: pl.roundingRule as RoundingRule,
    finalPrice,
    actualMargin,
    isBelowMinimum: actualMargin < minimumMargin,
    fixedPrice: properException?.fixedPrice !== null && properException?.fixedPrice !== undefined
      ? Number(properException.fixedPrice)
      : null,
  };
}
