/**
 * Cost Update Service - Mass cost update operations with preview and audit
 *
 * Especificaciones relacionadas:
 * - /specs/spec-mass-cost-update.md
 */

import { db } from '@/lib/db';
import { product, priceList, priceListItem, costUpdateBatch, category, supplier } from '@/db/schema';
import { eq, and, or, ilike, inArray, asc, desc, sql, type SQL } from 'drizzle-orm';
import { getProductBaseCost } from './priceListService';
import { parseSearchQuery } from '@/lib/utils/searchQueryParser';
import { calculateFinalPrice } from '@/lib/utils/rounding';

// ============================================================================
// Types
// ============================================================================

export type AdjustmentType = 'PERCENTAGE_INC' | 'PERCENTAGE_DEC' | 'FIXED_INC' | 'FIXED_DEC' | 'SET_VALUE';

export interface CostUpdateFilters {
  supplierId?: string;
  categoryId?: string;
  search?: string;
  productIds?: string[];
  priceListId?: string; // Target for the update
}

export interface CostUpdateAdjustment {
  type: AdjustmentType;
  value: number;
}

export interface CostUpdatePreviewItem {
  id: string;
  sku: string;
  name: string;
  currentCost: number;
  newCost: number;
  variationPercent: number;
  warningFlag: boolean;
}

export interface CostUpdatePreviewResult {
  items: CostUpdatePreviewItem[];
  totalItems: number;
  hasNegativeCosts: boolean;
  negativeCount: number;
}

export interface CostUpdateBatch {
  id: string;
  userId: string;
  userName: string | null;
  filtersApplied: Record<string, unknown>;
  adjustmentType: string;
  adjustmentValue: number;
  itemsAffected: number;
  createdAt: Date;
}

// ============================================================================
// Constants
// ============================================================================

/** Warning threshold for cost variation (20%) */
const WARNING_VARIATION_THRESHOLD = 20;

/** Default page size for preview pagination */
const DEFAULT_PREVIEW_PAGE_SIZE = 20;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate the new cost based on adjustment type and value
 */
export function calculateNewCost(currentCost: number, adjustment: CostUpdateAdjustment): number {
  const { type, value } = adjustment;

  switch (type) {
    case 'PERCENTAGE_INC':
      return currentCost * (1 + value / 100);
    case 'PERCENTAGE_DEC':
      return currentCost * (1 - value / 100);
    case 'FIXED_INC':
      return currentCost + value;
    case 'FIXED_DEC':
      return currentCost - value;
    case 'SET_VALUE':
      return value;
    default:
      return currentCost;
  }
}

/**
 * Calculate variation percentage between current and new cost
 */
export function calculateVariationPercent(currentCost: number, newCost: number): number {
  if (currentCost === 0) {
    return newCost > 0 ? 100 : 0;
  }
  return Number(((newCost - currentCost) / currentCost * 100).toFixed(2));
}

/**
 * Check if variation exceeds warning threshold (20%)
 */
export function isWarningVariation(variationPercent: number): boolean {
  return Math.abs(variationPercent) > WARNING_VARIATION_THRESHOLD;
}

/**
 * Build Drizzle where clause from filters
 */
function buildWhereClause(filters: CostUpdateFilters): SQL | undefined {
  const conditions: SQL[] = [eq(product.isActive, true)];

  if (filters.productIds && filters.productIds.length > 0) {
    conditions.push(inArray(product.id, filters.productIds));
  }

  if (filters.categoryId) {
    conditions.push(eq(product.categoryId, filters.categoryId));
  }

  if (filters.supplierId) {
    conditions.push(eq(product.supplierId, filters.supplierId));
  }

  if (filters.search) {
    const terms = parseSearchQuery(filters.search);

    // Group required conditions - all must match
    const requiredAndPhrases: SQL[] = [
      ...terms.phrases.map(phrase =>
        or(
          ilike(product.name, `%${phrase}%`),
          ilike(product.sku, `%${phrase}%`),
          ilike(product.barcode, `%${phrase}%`),
        )!
      ),
      ...terms.required.map(term =>
        or(
          ilike(product.name, `%${term}%`),
          ilike(product.sku, `%${term}%`),
          ilike(product.barcode, `%${term}%`),
        )!
      ),
    ];

    if (requiredAndPhrases.length > 0) {
      conditions.push(...requiredAndPhrases);

      if (terms.optional.length > 0) {
        const optionalStr = terms.optional.join(' ');
        conditions.push(
          or(
            ilike(product.name, `%${optionalStr}%`),
            ilike(product.sku, `%${optionalStr}%`),
            ilike(product.barcode, `%${optionalStr}%`),
          )!
        );
      }
    } else if (terms.optional.length > 0) {
      conditions.push(
        or(
          ilike(product.name, `%${filters.search}%`),
          ilike(product.sku, `%${filters.search}%`),
          ilike(product.barcode, `%${filters.search}%`),
        )!
      );
    }
  }

  return and(...conditions);
}

// ============================================================================
// Preview Function
// ============================================================================

/**
 * Preview cost update changes without applying them
 * Returns paginated results (20 items per page by default)
 */
export async function previewCostUpdate(
  filters: CostUpdateFilters,
  adjustment: CostUpdateAdjustment,
  page: number = 1,
  pageSize: number = DEFAULT_PREVIEW_PAGE_SIZE
): Promise<CostUpdatePreviewResult> {
  const where = buildWhereClause(filters);

  // Get total count for pagination
  const totalItemsResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(product)
    .where(where);
  const totalItems = totalItemsResult[0]?.count ?? 0;

  // Get target price list if specified
  let targetPriceList: typeof priceList.$inferSelect | null = null;
  if (filters.priceListId) {
    targetPriceList = await db.query.priceList.findFirst({
      where: eq(priceList.id, filters.priceListId),
    }) ?? null;
  }

  // Get paginated products
  const products = await db.query.product.findMany({
    where,
    columns: {
      id: true,
      sku: true,
      name: true,
      replacementCost: true,
      costPrice: true,
    },
    with: filters.priceListId ? {
      priceListItems: {
        where: eq(priceListItem.priceListId, filters.priceListId),
      },
    } : undefined,
    orderBy: asc(product.name),
    offset: (page - 1) * pageSize,
    limit: pageSize,
  });

  let hasNegativeCosts = false;
  let negativeCount = 0;

  const items: CostUpdatePreviewItem[] = products.map((p: any) => {
    let currentValue: number;

    if (targetPriceList) {
      // If updating a price list, the "current value" is the current price in that list
      const baseCost = getProductBaseCost(p.replacementCost, p.costPrice);
      const exception = p.priceListItems?.[0];

      if (exception?.fixedPrice) {
        currentValue = Number(exception.fixedPrice);
      } else {
        const margin = exception?.overrideMarginPercentage !== null && exception?.overrideMarginPercentage !== undefined
          ? Number(exception.overrideMarginPercentage)
          : Number(targetPriceList.baseMarginPercentage);

        currentValue = calculateFinalPrice(
          baseCost,
          margin,
          targetPriceList.roundingRule as any
        );
      }
    } else {
      // Updating replacement cost
      currentValue = getProductBaseCost(p.replacementCost, p.costPrice);
    }

    const newValue = calculateNewCost(currentValue, adjustment);
    const isSetVal = adjustment.type === 'SET_VALUE';
    const variationPercent = isSetVal ? 0 : calculateVariationPercent(currentValue, newValue);
    const warningFlag = isSetVal ? false : isWarningVariation(variationPercent);

    if (newValue < 0) {
      hasNegativeCosts = true;
      negativeCount++;
    }

    return {
      id: p.id,
      sku: p.sku || '',
      name: p.name,
      currentCost: currentValue, // We keep the name currentCost but it might be currentPrice
      newCost: Number(newValue.toFixed(2)),
      variationPercent,
      warningFlag,
    };
  });

  return {
    items,
    totalItems,
    hasNegativeCosts,
    negativeCount,
  };
}

// ============================================================================
// Apply Function
// ============================================================================

/**
 * Apply cost update to all filtered products
 * Creates audit record in cost_update_batch
 * Returns the batch record
 */
export async function applyCostUpdate(
  filters: CostUpdateFilters,
  adjustment: CostUpdateAdjustment,
  userId: string,
  userName: string | null
): Promise<CostUpdateBatch> {
  const where = buildWhereClause(filters);

  // Get target price list if specified
  let targetPriceList: typeof priceList.$inferSelect | null = null;
  if (filters.priceListId) {
    targetPriceList = await db.query.priceList.findFirst({
      where: eq(priceList.id, filters.priceListId),
    }) ?? null;
    if (!targetPriceList) throw new Error('Target price list not found');
  }

  // Get all product IDs that will be affected (for count)
  const productsToUpdate = await db.query.product.findMany({
    where,
    columns: {
      id: true,
      replacementCost: true,
      costPrice: true,
    },
    with: filters.priceListId ? {
      priceListItems: {
        where: eq(priceListItem.priceListId, filters.priceListId),
      },
    } : undefined,
  });

  if (productsToUpdate.length === 0) {
    throw new Error('No products found matching the specified filters');
  }

  const itemsAffected = productsToUpdate.length;

  if (!targetPriceList) {
    // Updating replacement cost - old behavior
    const costGroups = new Map<number, string[]>();

    for (const p of productsToUpdate) {
      const currentCost = getProductBaseCost(p.replacementCost, p.costPrice);
      const newCost = Number(calculateNewCost(currentCost, adjustment).toFixed(2));

      const group = costGroups.get(newCost) || [];
      group.push(p.id);
      costGroups.set(newCost, group);
    }

    await db.transaction(async (tx) => {
      const updatePromises = Array.from(costGroups.entries()).map(([newCost, productIds]) =>
        tx
          .update(product)
          .set({ replacementCost: newCost.toString() })
          .where(inArray(product.id, productIds))
      );
      await Promise.all(updatePromises);
    });
  } else {
    // Updating a specific price list - new behavior
    const priceListId = targetPriceList.id;
    const roundingRule = targetPriceList.roundingRule as any;
    const baseMargin = Number(targetPriceList.baseMarginPercentage);

    await db.transaction(async (tx) => {
      for (const p of productsToUpdate) {
        const baseCost = getProductBaseCost(p.replacementCost, p.costPrice);
        const exception = (p as any).priceListItems?.[0];

        let currentValue: number;
        if (exception?.fixedPrice) {
          currentValue = Number(exception.fixedPrice);
        } else {
          const margin = exception?.overrideMarginPercentage !== null && exception?.overrideMarginPercentage !== undefined
            ? Number(exception.overrideMarginPercentage)
            : baseMargin;

          currentValue = calculateFinalPrice(baseCost, margin, roundingRule);
        }

        const newValue = Number(calculateNewCost(currentValue, adjustment).toFixed(2));

        // Upsert price_list_item with fixedPrice
        await tx
          .insert(priceListItem)
          .values({
            id: crypto.randomUUID(),
            priceListId,
            productId: p.id,
            fixedPrice: newValue.toString(),
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: [priceListItem.priceListId, priceListItem.productId],
            set: {
              fixedPrice: newValue.toString(),
              overrideMarginPercentage: null, // If we set a fixed price, we should probably clear the override margin
              updatedAt: new Date().toISOString(),
            },
          });
      }
    });
  }

  // Create audit record outside transaction (using main db client)
  await db.insert(costUpdateBatch).values({
    userId,
    userName,
    filtersApplied: filters as any,
    adjustmentType: adjustment.type,
    adjustmentValue: adjustment.value.toString(),
    itemsAffected,
  });

  // Return the created batch (most recent for this user)
  const batch = await db.query.costUpdateBatch.findFirst({
    where: eq(costUpdateBatch.userId, userId),
    orderBy: desc(costUpdateBatch.createdAt),
  });

  if (!batch) {
    throw new Error('Failed to retrieve created batch record');
  }

  return {
    id: batch.id,
    userId: batch.userId,
    userName: batch.userName,
    filtersApplied: batch.filtersApplied as Record<string, unknown>,
    adjustmentType: batch.adjustmentType,
    adjustmentValue: Number(batch.adjustmentValue),
    itemsAffected: batch.itemsAffected,
    createdAt: new Date(batch.createdAt),
  };
}

// ============================================================================
// History Function
// ============================================================================

/**
 * Get history of cost update batches with pagination
 */
export async function getCostUpdateHistory(
  page: number = 1,
  pageSize: number = 20
): Promise<{ batches: CostUpdateBatch[]; total: number }> {
  const [batches, totalResult] = await Promise.all([
    db.query.costUpdateBatch.findMany({
      orderBy: desc(costUpdateBatch.createdAt),
      offset: (page - 1) * pageSize,
      limit: pageSize,
    }),
    db.select({ count: sql<number>`count(*)::int` })
      .from(costUpdateBatch),
  ]);

  const total = totalResult[0]?.count ?? 0;

  // Get all categories and suppliers for name resolution
  const [categories, suppliers] = await Promise.all([
    db.query.category.findMany({
      columns: { id: true, name: true }
    }),
    db.query.supplier.findMany({
      columns: { id: true, name: true }
    })
  ]);

  // Create lookup maps
  const categoryMap = new Map(categories.map((cat: any) => [cat.id, cat.name]));
  const supplierMap = new Map(suppliers.map((sup: any) => [sup.id, sup.name]));

  // Helper to enrich filters with names
  const enrichFilters = (filters: Record<string, unknown>): Record<string, unknown> => {
    const enriched = { ...filters };
    
    if (filters.categoryId && typeof filters.categoryId === 'string') {
      enriched.categoryId = categoryMap.get(filters.categoryId) || filters.categoryId;
    }
    
    if (filters.supplierId && typeof filters.supplierId === 'string') {
      enriched.supplierId = supplierMap.get(filters.supplierId) || filters.supplierId;
    }
    
    return enriched;
  };

  return {
    batches: batches.map((batch: any) => ({
      id: batch.id,
      userId: batch.userId,
      userName: batch.userName,
      filtersApplied: enrichFilters(batch.filtersApplied as Record<string, unknown>),
      adjustmentType: batch.adjustmentType,
      adjustmentValue: Number(batch.adjustmentValue),
      itemsAffected: batch.itemsAffected,
      createdAt: new Date(batch.createdAt),
    })),
    total,
  };
}
