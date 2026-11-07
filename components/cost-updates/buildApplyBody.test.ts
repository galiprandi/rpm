/**
 * Regression test for the "partial massive update" bug:
 * the apply payload used to build `productIds` from preview.items
 * (page 1, max 100 rows), silently applying the update to only the
 * first page of results. The correct payload sends the original filters
 * plus `excludedProductIds` so the server applies to the full filtered set.
 */
import { describe, it, expect } from "vitest";
import { buildApplyBody } from "./buildApplyBody";

const baseFilters = {
  categoryId: "cat-deflectores",
  priceListId: undefined,
  productIds: undefined,
};

const adjustment = { type: "PERCENTAGE_INC", value: 10 };

describe("buildApplyBody — partial massive update regression", () => {
  it("sends the original filters without page-capped productIds when nothing is excluded", () => {
    const body = buildApplyBody({
      filters: baseFilters,
      adjustment,
      excludedProductIds: new Set(),
      previewItems: Array.from({ length: 100 }, (_, i) => ({ id: `p${i}` })),
    });

    // Must NOT restrict to the 100 visible items
    expect(body.filters.productIds).toBeUndefined();
    expect(body.filters.categoryId).toBe("cat-deflectores");
  });

  it("sends excludedProductIds (not productIds) when the user excludes items", () => {
    const body = buildApplyBody({
      filters: baseFilters,
      adjustment,
      excludedProductIds: new Set(["p3", "p7"]),
      previewItems: [{ id: "p3" }, { id: "p7" }, { id: "p9" }],
    });

    expect(body.filters.excludedProductIds).toEqual(["p3", "p7"]);
    expect(body.filters.productIds).toBeUndefined();
  });

  it("keeps explicit manual productIds when the user selected products by hand", () => {
    const body = buildApplyBody({
      filters: { ...baseFilters, productIds: ["a", "b"] },
      adjustment,
      excludedProductIds: new Set(["b"]),
      previewItems: [{ id: "a" }, { id: "b" }],
    });

    // Manual selection still scopes the update, exclusions apply within it
    expect(body.filters.productIds).toEqual(["a", "b"]);
    expect(body.filters.excludedProductIds).toEqual(["b"]);
  });
});
