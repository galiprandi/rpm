/**
 * Cache utilities for Next.js unstable_cache
 * Provides cache keys and revalidation functions
 */

import { revalidateTag } from 'next/cache';

// Cache tags
export const CACHE_TAGS = {
  CASH_STATUS: 'cash-status',
  DASHBOARD: 'dashboard-data',
} as const;

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  CASH_STATUS: 300, // 5 minutes - caja no cambia tan frecuentemente
  DASHBOARD: 60,    // 1 minute - dashboard más dinámico
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
