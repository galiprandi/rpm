/**
 * Cache utilities for Next.js unstable_cache
 * Provides cache keys and revalidation functions
 */

import { revalidateTag } from 'next/cache';

// Cache tags
export const CACHE_TAGS = {
  CASH_STATUS: 'cash-status',
  DASHBOARD: 'dashboard-data',
  PRICE_LISTS: 'price-lists',
} as const;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  CASH_STATUS: 300, // 5 minutes - caja no cambia tan frecuentemente
  DASHBOARD: 60,    // 1 minute - dashboard más dinámico
  PRICE_LISTS: 60,  // 1 minute - prices revalidate on mutation via tag
} as const;

/**
 * Invalidate cash status cache
 * Call this after any cash movement (open, close, income, expense)
 */
export function invalidateCashStatus(): void {
  revalidateTag(CACHE_TAGS.CASH_STATUS, 'default');
}

/**
 * Invalidate dashboard cache
 * Call this after data changes that affect dashboard metrics
 */
export function invalidateDashboard(): void {
  revalidateTag(CACHE_TAGS.DASHBOARD, 'default');
}

/**
 * Invalidate price lists cache.
 * Call this after any price list / item mutation (create, update, delete,
 * cost update). Uses a single global tag so dependent lists (e.g. Tarjetas
 * based on Contado) are also invalidated when their base changes.
 */
export function invalidatePriceLists(): void {
  revalidateTag(CACHE_TAGS.PRICE_LISTS, 'default');
}
