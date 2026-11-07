/**
 * The preview API caps pageSize at 100 but a filtered set can be larger
 * (e.g. Deflectores: 287). fetchAllPreviewItems must request every page
 * and merge the items so the UI can show and exclude across the full set.
 */
import { describe, it, expect, vi } from "vitest";
import { fetchAllPreviewItems } from "./fetchAllPreviewItems";

function stubFetch(pages: Record<number, { items: { id: string }[]; totalItems: number }>) {
  return vi.fn(async (body: { page: number }) => pages[body.page]);
}

describe("fetchAllPreviewItems — multi-page preview", () => {
  it("merges all pages when totalItems exceeds one page", async () => {
    const request = stubFetch({
      1: { items: Array.from({ length: 100 }, (_, i) => ({ id: `p${i}` })), totalItems: 287 },
      2: { items: Array.from({ length: 100 }, (_, i) => ({ id: `p${100 + i}` })), totalItems: 287 },
      3: { items: Array.from({ length: 87 }, (_, i) => ({ id: `p${200 + i}` })), totalItems: 287 },
    });

    const result = await fetchAllPreviewItems(request, { pageSize: 100 });

    expect(result.items).toHaveLength(287);
    expect(result.totalItems).toBe(287);
    expect(request).toHaveBeenCalledTimes(3);
    expect(new Set(result.items.map((i) => i.id)).size).toBe(287);
  });

  it("does a single request when everything fits in one page", async () => {
    const request = stubFetch({
      1: { items: [{ id: "a" }, { id: "b" }], totalItems: 2 },
    });

    const result = await fetchAllPreviewItems(request, { pageSize: 100 });

    expect(result.items).toHaveLength(2);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("stops when the API returns fewer items than pageSize", async () => {
    const request = stubFetch({
      1: { items: Array.from({ length: 60 }, (_, i) => ({ id: `p${i}` })), totalItems: 500 },
    });

    const result = await fetchAllPreviewItems(request, { pageSize: 100 });

    expect(result.items).toHaveLength(60);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("caps at a safety limit to avoid unbounded fetching", async () => {
    const request = vi.fn(async () => ({
      items: Array.from({ length: 100 }, (_, i) => ({ id: `p${i}` })),
      totalItems: 100000,
    }));

    const result = await fetchAllPreviewItems(request, { pageSize: 100, maxPages: 5 });

    expect(result.items).toHaveLength(500);
    expect(request).toHaveBeenCalledTimes(5);
  });
});
