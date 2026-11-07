/**
 * Builds the POST /api/cost-updates/apply payload.
 * Sends the original filters plus `excludedProductIds` so the server
 * applies the update to the FULL filtered set — never capped by the
 * preview page size. `productIds` is only sent for manual selections.
 */

interface ApplyFilters {
  supplierId?: string;
  categoryId?: string;
  search?: string;
  priceListId?: string;
  productIds?: string[];
  excludedProductIds?: string[];
}

export function buildApplyBody(args: {
  filters: ApplyFilters;
  adjustment: { type: string; value: number };
  excludedProductIds: Set<string>;
  previewItems?: Array<{ id: string }>;
}) {
  const { filters, adjustment, excludedProductIds } = args;

  const excluded =
    excludedProductIds.size > 0 ? Array.from(excludedProductIds) : undefined;

  return {
    filters: {
      ...filters,
      excludedProductIds: excluded,
    },
    adjustment,
  };
}
