/**
 * Price Calculation Service - Centralized price calculation for price lists
 *
 * Single source of truth for computing product prices across the system.
 * Resolves the chain of price lists (basePriceListId) recursively, applies
 * per-product exceptions (fixedPrice > overrideMargin > baseMargin), rounding
 * rules, and minimum-margin validation.
 *
 * Especificaciones relacionadas:
 * - /specs/features/price-lists.md
 *
 * Alcance del test:
 * - Lista sin base (comportamiento actual)
 * - Lista basada en otra lista (1 nivel)
 * - Cadena de 3 niveles (A→B→C→costo)
 * - Detección de ciclo (A→B→A)
 * - Excepciones (fixedPrice, overrideMargin) en cualquier nivel
 * - isBelowMinimum siempre contra costo real
 * - Batch con múltiples productos y listas
 * - PriceCalcContext evita queries duplicadas
 */

import { db } from '@/lib/db';
import { priceList, priceListItem, product } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import {
  calculateFinalPrice,
  calculateMarginPercentage,
  applyRounding,
  type RoundingRule,
  type PriceException,
} from '@/lib/utils/rounding';
import { getProductBaseCost } from './priceListService';
import { getMinimumMargin } from './settingsService';

// ============================================================================
// Types
// ============================================================================

export interface CalculatedPrice {
  /** Final price after exceptions + rounding (or fixed price). */
  finalPrice: number;
  /** Base price used for the margin calculation (cost or parent list final price). */
  basePrice: number;
  /** Real product cost (replacementCost/costPrice) — used for actualMargin. */
  realCost: number;
  /** Margin applied (override or base). */
  appliedMargin: number;
  /** Actual margin against real cost. */
  actualMargin: number;
  /** True when actualMargin < minimumMargin. */
  isBelowMinimum: boolean;
  /** True when a fixedPrice exception was used. */
  isFixed: boolean;
  /** Override margin if an exception was applied, null otherwise. */
  overrideMargin: number | null;
  /** Rounding rule of the list. */
  roundingRule: RoundingRule;
}

export class CircularReferenceError extends Error {
  constructor(public readonly cyclePath: string[]) {
    super(`Circular reference detected in price list chain: ${cyclePath.join(' → ')}`);
    this.name = 'CircularReferenceError';
  }
}

// ============================================================================
// PriceCalcContext - per-request cache
// ============================================================================

interface ListRecord {
  id: string;
  baseMarginPercentage: number;
  roundingRule: RoundingRule;
  basePriceListId: string | null;
  isActive: boolean;
}

interface ExceptionRecord {
  overrideMarginPercentage: number | null;
  fixedPrice: number | null;
}

interface ProductCostRecord {
  id: string;
  replacementCost: number;
  costPrice: number;
}

/**
 * Per-request cache shared across all calculations within a single operation.
 * Avoids redundant DB queries when resolving chains of price lists.
 *
 * Built once by `buildPriceCalcContext` (batch preload) and reused by
 * `resolveBasePrice` / `calculateListItemPrice` / `calculateBatchPrices`.
 */
export class PriceCalcContext {
  readonly lists = new Map<string, ListRecord>();
  readonly exceptions = new Map<string, Map<string, ExceptionRecord>>();
  readonly products = new Map<string, ProductCostRecord>();
  minimumMargin: number | null = null;

  /** Get a loaded list or throw if not present. */
  getList(id: string): ListRecord {
    const l = this.lists.get(id);
    if (!l) throw new Error(`Price list ${id} not loaded in context`);
    return l;
  }

  /** Get exceptions map for a list (empty map if none loaded). */
  getExceptions(listId: string): Map<string, ExceptionRecord> {
    return this.exceptions.get(listId) ?? new Map();
  }

  /** Get a product cost record or throw if not present. */
  getProduct(id: string): ProductCostRecord {
    const p = this.products.get(id);
    if (!p) throw new Error(`Product ${id} not loaded in context`);
    return p;
  }

  /** Real cost (replacementCost > 0 ? replacementCost : costPrice). */
  getRealCost(productId: string): number {
    const p = this.getProduct(productId);
    return getProductBaseCost(p.replacementCost, p.costPrice);
  }

  /** Cached minimum margin (loaded lazily). */
  async getMinMargin(): Promise<number> {
    if (this.minimumMargin === null) {
      this.minimumMargin = await getMinimumMargin();
    }
    return this.minimumMargin;
  }
}

// ============================================================================
// Context builders
// ============================================================================

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Build a PriceCalcContext by preloading all relevant lists, exceptions and
 * product costs in batch queries. This is the recommended entry point for
 * multi-product / multi-list calculations (search, catalog, batch endpoints).
 *
 * The `listIds` set is expanded to include all transitive `basePriceListId`
 * references so the full chain is available without extra queries.
 */
export async function buildPriceCalcContext(
  productIds: string[],
  listIds: string[],
): Promise<PriceCalcContext> {
  const ctx = new PriceCalcContext();

  if (productIds.length === 0 || listIds.length === 0) {
    return ctx;
  }

  // Load lists iteratively, following basePriceListId references until no new
  // ids appear. Bounded by the number of lists in the system.
  const pendingListIds = new Set<string>(listIds);
  const visited = new Set<string>();

  while (pendingListIds.size > 0) {
    const batch = Array.from(pendingListIds).filter((id) => !visited.has(id));
    if (batch.length === 0) break;

    const lists = await db.query.priceList.findMany({
      where: inArray(priceList.id, batch),
      columns: {
        id: true,
        baseMarginPercentage: true,
        roundingRule: true,
        basePriceListId: true,
        isActive: true,
      },
    });

    for (const l of lists) {
      ctx.lists.set(l.id, {
        id: l.id,
        baseMarginPercentage: toNumber(l.baseMarginPercentage, 0),
        roundingRule: (l.roundingRule as RoundingRule) || 'SMART_HUNDREDS',
        basePriceListId: l.basePriceListId ?? null,
        isActive: l.isActive,
      });
      visited.add(l.id);
      if (l.basePriceListId && !visited.has(l.basePriceListId)) {
        pendingListIds.add(l.basePriceListId);
      }
    }

    // Mark any ids that returned no rows as visited to avoid infinite loop.
    for (const id of batch) visited.add(id);
  }

  // Load products
  if (productIds.length > 0) {
    const products = await db.query.product.findMany({
      where: inArray(product.id, productIds),
      columns: {
        id: true,
        replacementCost: true,
        costPrice: true,
      },
    });

    for (const p of products) {
      ctx.products.set(p.id, {
        id: p.id,
        replacementCost: toNumber(p.replacementCost, 0),
        costPrice: toNumber(p.costPrice, 0),
      });
    }
  }

  // Load exceptions for all loaded lists
  const allListIds = Array.from(ctx.lists.keys());
  if (allListIds.length > 0 && productIds.length > 0) {
    const exceptions = await db.query.priceListItem.findMany({
      where: inArray(priceListItem.priceListId, allListIds),
      columns: {
        priceListId: true,
        productId: true,
        overrideMarginPercentage: true,
        fixedPrice: true,
      },
    });

    for (const ex of exceptions) {
      if (!ex.productId) continue;
      if (!ctx.exceptions.has(ex.priceListId)) {
        ctx.exceptions.set(ex.priceListId, new Map());
      }
      ctx.exceptions.get(ex.priceListId)!.set(ex.productId, {
        overrideMarginPercentage:
          ex.overrideMarginPercentage !== null ? toNumber(ex.overrideMarginPercentage, 0) : null,
        fixedPrice: ex.fixedPrice !== null ? toNumber(ex.fixedPrice, 0) : null,
      });
    }
  }

  return ctx;
}

// ============================================================================
// Core calculation (pure, uses context)
// ============================================================================

/**
 * Resolve the base price for a product in a given list, following the
 * basePriceListId chain recursively. Throws CircularReferenceError on cycles.
 *
 * - If the list has no base → returns the product's real cost.
 * - If the list has a base → returns the final price of the product in the
 *   base list (recursively resolved).
 */
export function resolveBasePrice(
  productId: string,
  listId: string,
  ctx: PriceCalcContext,
  visited: string[] = [],
): number {
  const list = ctx.getList(listId);

  if (visited.includes(listId)) {
    throw new CircularReferenceError([...visited, listId]);
  }

  if (list.basePriceListId === null) {
    return ctx.getRealCost(productId);
  }

  // Recurse: base is the final price in the parent list
  const parentPrice = calculateListItemPriceSync(
    productId,
    list.basePriceListId,
    ctx,
    [...visited, listId],
  );

  return parentPrice.finalPrice;
}

/**
 * Synchronous price calculation for a single product in a single list,
 * using a pre-built context. Pure function — no DB access.
 */
export function calculateListItemPriceSync(
  productId: string,
  listId: string,
  ctx: PriceCalcContext,
  visited: string[] = [],
): CalculatedPrice {
  const list = ctx.getList(listId);

  if (visited.includes(listId)) {
    throw new CircularReferenceError([...visited, listId]);
  }

  const realCost = ctx.getRealCost(productId);
  const basePrice = resolveBasePrice(productId, listId, ctx, visited);

  const exception = ctx.getExceptions(listId).get(productId) ?? null;

  let finalPrice: number;
  let isFixed = false;
  let overrideMargin: number | null = null;
  let appliedMargin: number;

  if (exception?.fixedPrice !== null && exception?.fixedPrice !== undefined) {
    finalPrice = exception.fixedPrice;
    isFixed = true;
    appliedMargin = 0;
  } else {
    if (
      exception?.overrideMarginPercentage !== null &&
      exception?.overrideMarginPercentage !== undefined
    ) {
      overrideMargin = exception.overrideMarginPercentage;
    }
    appliedMargin = overrideMargin !== null ? overrideMargin : list.baseMarginPercentage;

    const exc: PriceException | undefined =
      overrideMargin !== null ? { overrideMarginPercentage: overrideMargin } : undefined;

    finalPrice = calculateFinalPrice(basePrice, list.baseMarginPercentage, list.roundingRule, exc);
  }

  const actualMargin = calculateMarginPercentage(realCost, finalPrice);
  // Note: isBelowMinimum is computed lazily via getMinMargin in the async wrapper.
  // Here we default to false; the async path overrides it.
  const isBelowMinimum = false;

  return {
    finalPrice,
    basePrice,
    realCost,
    appliedMargin,
    actualMargin,
    isBelowMinimum,
    isFixed,
    overrideMargin,
    roundingRule: list.roundingRule,
  };
}

// ============================================================================
// Async public API (loads context + applies minimum margin)
// ============================================================================

/**
 * Calculate the price of a single product in a single price list.
 * Loads a context on demand. For batch operations prefer `calculateBatchPrices`.
 */
export async function calculateListItemPrice(
  productId: string,
  listId: string,
): Promise<CalculatedPrice> {
  const ctx = await buildPriceCalcContext([productId], [listId]);
  return calculateListItemPriceAsync(productId, listId, ctx);
}

/** Internal async helper that applies the minimum margin check. */
async function calculateListItemPriceAsync(
  productId: string,
  listId: string,
  ctx: PriceCalcContext,
): Promise<CalculatedPrice> {
  const result = calculateListItemPriceSync(productId, listId, ctx);
  const minMargin = await ctx.getMinMargin();
  return {
    ...result,
    isBelowMinimum: result.actualMargin < minMargin,
  };
}

/**
 * Batch calculation: compute prices for multiple products across multiple
 * price lists in a single set of batch queries. Returns a map keyed by
 * productId → listId → CalculatedPrice.
 *
 * This is the recommended entry point for search, catalog and batch endpoints.
 */
export async function calculateBatchPrices(
  productIds: string[],
  listIds: string[],
): Promise<Map<string, Map<string, CalculatedPrice>>> {
  const ctx = await buildPriceCalcContext(productIds, listIds);
  const minMargin = await ctx.getMinMargin();

  const result = new Map<string, Map<string, CalculatedPrice>>();

  for (const productId of productIds) {
    if (!ctx.products.has(productId)) continue;
    const productPrices = new Map<string, CalculatedPrice>();
    for (const listId of listIds) {
      if (!ctx.lists.has(listId)) continue;
      const calc = calculateListItemPriceSync(productId, listId, ctx);
      productPrices.set(listId, {
        ...calc,
        isBelowMinimum: calc.actualMargin < minMargin,
      });
    }
    result.set(productId, productPrices);
  }

  return result;
}

// ============================================================================
// Validation helpers (used by priceListService on create/update)
// ============================================================================

/**
 * Validate that setting `basePriceListId` on list `listId` does not create a
 * cycle. Walks the chain from the proposed base upwards.
 *
 * @param listId - The list being created/updated.
 * @param proposedBasePriceListId - The proposed base (null is always valid).
 * @throws CircularReferenceError if a cycle is detected.
 */
export async function validateNoCycle(
  listId: string,
  proposedBasePriceListId: string | null,
): Promise<void> {
  if (proposedBasePriceListId === null) return;
  if (proposedBasePriceListId === listId) {
    throw new CircularReferenceError([listId, proposedBasePriceListId]);
  }

  const visited: string[] = [listId];
  let currentId: string | null = proposedBasePriceListId;

  while (currentId !== null) {
    if (visited.includes(currentId)) {
      throw new CircularReferenceError([...visited, currentId]);
    }
    visited.push(currentId);

    const current: { id: string; basePriceListId: string | null } | undefined = await db.query.priceList.findFirst({
      where: eq(priceList.id, currentId),
      columns: { id: true, basePriceListId: true },
    });

    if (!current) {
      // Base references a non-existent list — FK will reject, but no cycle.
      break;
    }

    currentId = current.basePriceListId ?? null;
  }
}
