/**
 * Recursive serialization utilities for Drizzle→API responses.
 *
 * Drizzle returns `numeric` columns as strings and `timestamp(mode: 'string')`
 * columns as raw PG timestamps (space-separated, no Z). This module provides
 * a recursive walker that converts known decimal fields to numbers and
 * known timestamp fields to ISO 8601, regardless of nesting depth.
 */

import { toISODate } from "./date";

/** Field names that are `numeric`/`decimal` in the DB schema. */
const DECIMAL_FIELDS = new Set([
  "total",
  "totalProducts",
  "totalServices",
  "totalAmount",
  "unitPrice",
  "totalPrice",
  "unitCost",
  "subtotal",
  "amount",
  "balance",
  "baseCost",
  "vehicleFactor",
  "costPrice",
  "replacementCost",
  "cashAmount",
  "accountCreditAmount",
  "tax",
  "iva21",
  "iva105",
  "margin",
  "defaultMarginPercent",
  "overrideMarginPercentage",
  "baseMarginPercentage",
  "fixedPrice",
  "openingAmount",
  "closingAmount",
  "expectedAmount",
  "totalSum",
  "balanceSum",
  "subtotalSum",
  "totalPriceSum",
  "costPriceSum",
  "baseCostSum",
  "opening",
  "income",
  "expense",
  "expected",
  "minStock",
  "stock",
  "quantity",
]);

/** Field names that are `timestamp` in the DB schema. */
const TIMESTAMP_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "scheduledDate",
  "startedAt",
  "completedAt",
  "deliveredAt",
  "finishedAt",
  "approvedAt",
  "reportedAt",
  "issuedAt",
  "finalizedAt",
  "date",
  "lastMovementAt",
  "completedAt",
  "openedAt",
  "closedAt",
  "generatedAt",
]);

/**
 * Recursively serialize a Drizzle result object/array for API output.
 * Converts known decimal fields from string→number and timestamp fields
 * from raw PG format→ISO 8601. Idempotent: already-converted values pass through.
 */
export function serializeDrizzleResult<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data === "number" || typeof data === "boolean") return data;
  if (typeof data === "string") return data;

  if (Array.isArray(data)) {
    return data.map(serializeDrizzleResult) as unknown as T;
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (DECIMAL_FIELDS.has(key) && typeof value === "string" && value !== "") {
        const num = Number(value);
        result[key] = isNaN(num) ? value : num;
      } else if (TIMESTAMP_FIELDS.has(key) && typeof value === "string" && value !== "") {
        result[key] = toISODate(value);
      } else if (TIMESTAMP_FIELDS.has(key) && value instanceof Date) {
        result[key] = toISODate(value);
      } else {
        result[key] = serializeDrizzleResult(value);
      }
    }
    return result as unknown as T;
  }

  return data;
}
