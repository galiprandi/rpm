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
  VEHICLE: 300,     // 5 minutes - vehicle data fallback
  CUSTOMER: 300,    // 5 minutes - customer data fallback
} as const;

/**
 * Generate a vehicle-specific cache tag.
 * Used by unstable_cache on /api/vehicles/[id] to allow targeted invalidation.
 */
export function vehicleCacheTag(vehicleId: string): string {
  return `vehicle-${vehicleId}`;
}

/**
 * Generate a customer-specific cache tag.
 * Used by unstable_cache on customer/vehicle routes to allow targeted invalidation
 * after payments, work orders, direct sales, or credit notes.
 */
export function customerCacheTag(customerId: string): string {
  return `customer-${customerId}`;
}

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

/**
 * Invalidate cache for a specific vehicle.
 * Call this after any mutation that affects a vehicle's data
 * (work order created/updated, payment registered, etc.).
 */
export function invalidateVehicle(vehicleId: string): void {
  revalidateTag(vehicleCacheTag(vehicleId), 'default');
}

/**
 * Invalidate cache for a specific customer.
 * Call this after any mutation that affects a customer's balance or data
 * (payment, work order, direct sale, credit note, etc.).
 */
export function invalidateCustomer(customerId: string): void {
  revalidateTag(customerCacheTag(customerId), 'default');
}
