/**
 * Cost Update Service - Mass cost update operations with preview and audit
 *
 * Especificaciones relacionadas:
 * - /specs/spec-mass-cost-update.md
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getProductBaseCost } from './priceListService';
import { parseSearchQuery } from '@/lib/utils/searchQueryParser';
import { calculateFinalPrice } from '@/lib/utils/rounding';

// ============================================================================
// Types
// ============================================================================

export type AdjustmentType = 'PERCENTAGE_INC' | 'PERCENTAGE_DEC' | 'FIXED_INC' | 'FIXED_DEC';

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
 * Build Prisma where clause from filters
 */
function buildWhereClause(filters: CostUpdateFilters): Prisma.productWhereInput {
  const where: Prisma.productWhereInput = { isActive: true };

  if (filters.productIds && filters.productIds.length > 0) {
    where.id = { in: filters.productIds };
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.supplierId) {
    where.supplierId = filters.supplierId;
  }

  if (filters.search) {
    const terms = parseSearchQuery(filters.search);

    // Group required conditions - all must match
    const requiredAndPhrases = [
      ...terms.phrases.map(phrase => ({
        OR: [
          { name: { contains: phrase, mode: 'insensitive' as const } },
          { sku: { contains: phrase, mode: 'insensitive' as const } },
          { barcode: { contains: phrase, mode: 'insensitive' as const } },
        ],
      })),
      ...terms.required.map(term => ({
        OR: [
          { name: { contains: term, mode: 'insensitive' as const } },
          { sku: { contains: term, mode: 'insensitive' as const } },
          { barcode: { contains: term, mode: 'insensitive' as const } },
        ],
      })),
    ];

    if (requiredAndPhrases.length > 0) {
      where.AND = requiredAndPhrases;

      if (terms.optional.length > 0) {
        where.OR = [
          { name: { contains: terms.optional.join(' '), mode: 'insensitive' as const } },
          { sku: { contains: terms.optional.join(' '), mode: 'insensitive' as const } },
          { barcode: { contains: terms.optional.join(' '), mode: 'insensitive' as const } },
        ];
      }
    } else if (terms.optional.length > 0) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' as const } },
        { sku: { contains: filters.search, mode: 'insensitive' as const } },
        { barcode: { contains: filters.search, mode: 'insensitive' as const } },
      ];
    }
  }

  return where;
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
  const totalItems = await prisma.product.count({ where });

  // Get target price list if specified
  let targetPriceList = null;
  if (filters.priceListId) {
    targetPriceList = await prisma.price_list.findUnique({
      where: { id: filters.priceListId }
    });
  }

  // Get paginated products
  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      sku: true,
      name: true,
      replacementCost: true,
      costPrice: true,
      price_list_item: filters.priceListId ? {
        where: { priceListId: filters.priceListId }
      } : false,
    },
    orderBy: { name: 'asc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  let hasNegativeCosts = false;
  let negativeCount = 0;

  const items: CostUpdatePreviewItem[] = products.map((product: any) => {
    let currentValue: number;

    if (targetPriceList) {
      // If updating a price list, the "current value" is the current price in that list
      const baseCost = getProductBaseCost(product.replacementCost, product.costPrice);
      const exception = product.price_list_item?.[0];

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
      currentValue = getProductBaseCost(product.replacementCost, product.costPrice);
    }

    const newValue = calculateNewCost(currentValue, adjustment);
    const variationPercent = calculateVariationPercent(currentValue, newValue);
    const warningFlag = isWarningVariation(variationPercent);

    if (newValue < 0) {
      hasNegativeCosts = true;
      negativeCount++;
    }

    return {
      id: product.id,
      sku: product.sku || '',
      name: product.name,
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
  let targetPriceList = null;
  if (filters.priceListId) {
    targetPriceList = await prisma.price_list.findUnique({
      where: { id: filters.priceListId }
    });
    if (!targetPriceList) throw new Error('Target price list not found');
  }

  // Get all product IDs that will be affected (for count)
  const productsToUpdate = await prisma.product.findMany({
    where,
    select: {
      id: true,
      replacementCost: true,
      costPrice: true,
      price_list_item: filters.priceListId ? {
        where: { priceListId: filters.priceListId }
      } : false,
    },
  });

  if (productsToUpdate.length === 0) {
    throw new Error('No products found matching the specified filters');
  }

  const itemsAffected = productsToUpdate.length;

  if (!targetPriceList) {
    // Updating replacement cost - old behavior
    const costGroups = new Map<number, string[]>();

    for (const product of productsToUpdate) {
      const currentCost = getProductBaseCost(product.replacementCost, product.costPrice);
      const newCost = Number(calculateNewCost(currentCost, adjustment).toFixed(2));

      const group = costGroups.get(newCost) || [];
      group.push(product.id);
      costGroups.set(newCost, group);
    }

    await prisma.$transaction(async (tx) => {
      const updatePromises = Array.from(costGroups.entries()).map(([newCost, productIds]) =>
        tx.product.updateMany({
          where: { id: { in: productIds } },
          data: { replacementCost: newCost },
        })
      );
      await Promise.all(updatePromises);
    });
  } else {
    // Updating a specific price list - new behavior
    const priceListId = targetPriceList.id;
    const roundingRule = targetPriceList.roundingRule as any;
    const baseMargin = Number(targetPriceList.baseMarginPercentage);

    await prisma.$transaction(async (tx) => {
      for (const product of productsToUpdate) {
        const baseCost = getProductBaseCost(product.replacementCost, product.costPrice);
        const exception = (product as any).price_list_item?.[0];

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
        await tx.price_list_item.upsert({
          where: {
            priceListId_productId: {
              priceListId,
              productId: product.id,
            },
          },
          create: {
            id: crypto.randomUUID(),
            priceListId,
            productId: product.id,
            fixedPrice: newValue,
            updatedAt: new Date(),
          },
          update: {
            fixedPrice: newValue,
            overrideMarginPercentage: null, // If we set a fixed price, we should probably clear the override margin
            updatedAt: new Date(),
          },
        });
      }
    });
  }

  // Create audit record outside transaction (using main prisma client)
  await prisma.cost_update_batch.create({
    data: {
      userId,
      userName,
      filtersApplied: filters as unknown as Prisma.InputJsonValue,
      adjustmentType: adjustment.type,
      adjustmentValue: adjustment.value,
      itemsAffected,
    },
  });

  // Return the created batch (most recent for this user)
  const batch = await prisma.cost_update_batch.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
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
    createdAt: batch.createdAt,
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
  const [batches, total] = await Promise.all([
    prisma.cost_update_batch.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cost_update_batch.count(),
  ]);

  // Get all categories and suppliers for name resolution
  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true }
    }),
    prisma.supplier.findMany({
      select: { id: true, name: true }
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
      createdAt: batch.createdAt,
    })),
    total,
  };
}
