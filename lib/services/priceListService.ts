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
import { invalidatePriceLists } from '@/lib/cache';
import {
  calculateBatchPrices,
  validateNoCycle,
  CircularReferenceError,
} from './priceCalculationService';
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
  invalidatePriceLists();
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
  /** Optional reference to another price list used as the calculation base. */
  basePriceListId: string | null;
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
  /** Optional reference to another price list used as the calculation base. */
  basePriceListId?: string | null;
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
      basePriceListId: pl.basePriceListId ?? null,
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
              costPrice: true,
            },
          },
        },
        orderBy: desc(priceListItem.createdAt),
      },
    },
  });

  if (!pl) return null;

  // Compute prices via the centralized service so chains (basePriceListId)
  // and exceptions are resolved consistently across the system.
  const productIds = pl.priceListItems
    .map((item: { productId: string | null }) => item.productId)
    .filter((pid: string | null): pid is string => pid !== null);

  const priceMap = productIds.length > 0
    ? await calculateBatchPrices(productIds, [pl.id])
    : new Map<string, Map<string, ReturnType<typeof Object>>>();

  const transformedItems: PriceListItem[] = pl.priceListItems.map((item: any) => {
    const replacementCost = item.product
      ? getProductBaseCost(item.product.replacementCost, item.product.costPrice)
      : 0;

    const calc = item.productId
      ? (priceMap as Map<string, Map<string, any>>).get(item.productId)?.get(pl.id)
      : undefined;

    const finalPrice = calc?.finalPrice ?? (item.fixedPrice !== null ? Number(item.fixedPrice) : 0);
    const actualMargin = calc?.actualMargin ?? calculateMarginPercentage(replacementCost, finalPrice);
    const isBelowMinimum = calc?.isBelowMinimum ?? false;

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
      isBelowMinimum,
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
    basePriceListId: pl.basePriceListId ?? null,
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
    basePriceListId: pl.basePriceListId ?? null,
    itemCount: pl.priceListItems.length,
    createdAt: new Date(pl.createdAt),
    updatedAt: new Date(pl.updatedAt),
  };
}

// CREATE price list
export async function createPriceList(input: CreatePriceListInput): Promise<PriceList> {
  // Validate no cycle before inserting. The new list's id is generated now so
  // we can check self-reference and transitive cycles against the proposed base.
  const newId = randomUUID();
  const basePriceListId = input.basePriceListId ?? null;

  if (basePriceListId !== null) {
    // For a new list, the only possible cycle is self-reference (impossible
    // with a random UUID) — but validate the base exists and its chain is clean.
    await validateNoCycle(newId, basePriceListId);
  }

  const [created] = await db.insert(priceList).values({
    id: newId,
    name: input.name,
    isPublic: input.isPublic ?? false,
    isActive: input.isActive ?? true,
    startDate: input.startDate ? input.startDate.toISOString() : null,
    endDate: input.endDate ? input.endDate.toISOString() : null,
    baseMarginPercentage: input.baseMarginPercentage.toString(),
    roundingRule: input.roundingRule ?? 'SMART_HUNDREDS',
    basePriceListId,
    updatedAt: new Date().toISOString(),
  }).returning() as any;

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
    basePriceListId: created.basePriceListId ?? null,
    itemCount,
    createdAt: new Date(created.createdAt),
    updatedAt: new Date(created.updatedAt),
  };
}

// UPDATE price list
export async function updatePriceList(id: string, input: UpdatePriceListInput): Promise<PriceList> {
  // Validate no cycle when basePriceListId is being changed.
  if (input.basePriceListId !== undefined) {
    await validateNoCycle(id, input.basePriceListId ?? null);
  }

  const data: Partial<typeof priceList.$inferInsert> = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.isPublic !== undefined) data.isPublic = input.isPublic;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.startDate !== undefined) data.startDate = input.startDate ? input.startDate.toISOString() : null;
  if (input.endDate !== undefined) data.endDate = input.endDate ? input.endDate.toISOString() : null;
  if (input.baseMarginPercentage !== undefined) data.baseMarginPercentage = input.baseMarginPercentage.toString();
  if (input.roundingRule !== undefined) data.roundingRule = input.roundingRule;
  if (input.basePriceListId !== undefined) data.basePriceListId = input.basePriceListId;

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
    basePriceListId: pl.basePriceListId ?? null,
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

// UPSERT price list item (exception)
// If an item already exists for (priceListId, productId), update it instead of failing.
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

  // Upsert: insert or update on conflict (priceListId, productId)
  const [item] = await db.insert(priceListItem)
    .values({
      id: randomUUID(),
      priceListId,
      productId: input.productId,
      overrideMarginPercentage: input.overrideMarginPercentage != null ? input.overrideMarginPercentage.toString() : null,
      fixedPrice: input.fixedPrice != null ? input.fixedPrice.toString() : null,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [priceListItem.priceListId, priceListItem.productId],
      set: {
        overrideMarginPercentage: input.overrideMarginPercentage != null ? input.overrideMarginPercentage.toString() : null,
        fixedPrice: input.fixedPrice != null ? input.fixedPrice.toString() : null,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

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

  // Compute price via centralized service (resolves basePriceListId chain)
  const calc = await calculateBatchPrices([input.productId], [priceListId]);
  const calcResult = calc.get(input.productId)?.get(priceListId);
  const finalPrice = calcResult?.finalPrice ?? (item.fixedPrice !== null ? Number(item.fixedPrice) : 0);
  const actualMargin = calcResult?.actualMargin ?? calculateMarginPercentage(replacementCost, finalPrice);
  const isBelowMinimum = calcResult?.isBelowMinimum ?? false;

  revalidatePublicCatalog();
  return {
    id: item.id,
    priceListId: item.priceListId,
    productId: item.productId,
    productName: (itemWithProduct?.product as any)?.name || 'Unknown Product',
    productSku: (itemWithProduct?.product as any)?.sku || undefined,
    replacementCost,
    overrideMarginPercentage: item.overrideMarginPercentage !== null
      ? Number(item.overrideMarginPercentage)
      : null,
    fixedPrice: item.fixedPrice !== null ? Number(item.fixedPrice) : null,
    finalPrice,
    actualMargin,
    isBelowMinimum,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

// DELETE price list item
export async function deletePriceListItem(id: string): Promise<void> {
  await db.delete(priceListItem).where(eq(priceListItem.id, id));
  revalidatePublicCatalog();
}

// UPDATE price list item by id
export async function updatePriceListItem(
  id: string,
  input: Partial<CreatePriceListItemInput>
): Promise<PriceListItem> {
  const existing = await db.query.priceListItem.findFirst({
    where: eq(priceListItem.id, id),
  });

  if (!existing) {
    throw new Error('Price list item not found');
  }

  const pl = await db.query.priceList.findFirst({
    where: eq(priceList.id, existing.priceListId),
  });

  if (!pl) {
    throw new Error('Price list not found');
  }

  const prod = existing.productId
    ? await db.query.product.findFirst({ where: eq(product.id, existing.productId) })
    : null;

  if (!prod) {
    throw new Error('Product not found');
  }

  const replacementCost = getProductBaseCost(prod.replacementCost, prod.costPrice);

  const [item] = await db.update(priceListItem)
    .set({
      overrideMarginPercentage: input.overrideMarginPercentage != null
        ? input.overrideMarginPercentage.toString()
        : null,
      fixedPrice: input.fixedPrice != null ? input.fixedPrice.toString() : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(priceListItem.id, id))
    .returning();

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

  // Compute price via centralized service (resolves basePriceListId chain)
  const productId = existing.productId ?? '';
  const calc = productId
    ? await calculateBatchPrices([productId], [existing.priceListId])
    : new Map<string, Map<string, any>>();
  const calcResult = calc.get(productId)?.get(existing.priceListId);
  const finalPrice = calcResult?.finalPrice ?? (item.fixedPrice !== null ? Number(item.fixedPrice) : 0);
  const actualMargin = calcResult?.actualMargin ?? calculateMarginPercentage(replacementCost, finalPrice);
  const isBelowMinimum = calcResult?.isBelowMinimum ?? false;

  revalidatePublicCatalog();

  return {
    id: item.id,
    priceListId: item.priceListId,
    productId: item.productId,
    productName: (itemWithProduct?.product as any)?.name || 'Unknown Product',
    productSku: (itemWithProduct?.product as any)?.sku || undefined,
    replacementCost,
    overrideMarginPercentage: item.overrideMarginPercentage !== null
      ? Number(item.overrideMarginPercentage)
      : null,
    fixedPrice: item.fixedPrice !== null ? Number(item.fixedPrice) : null,
    finalPrice,
    actualMargin,
    isBelowMinimum,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
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

  // Delegate to centralized service (resolves basePriceListId chain + exceptions)
  const { calculateListItemPrice } = await import('./priceCalculationService');
  const calc = await calculateListItemPrice(productId, priceListId);

  return {
    replacementCost: calc.realCost,
    baseMargin: Number(pl.baseMarginPercentage),
    appliedMargin: calc.appliedMargin,
    roundingRule: pl.roundingRule as RoundingRule,
    finalPrice: calc.finalPrice,
    actualMargin: calc.actualMargin,
    isBelowMinimum: calc.isBelowMinimum,
    fixedPrice: calc.isFixed ? calc.finalPrice : null,
  };
}
