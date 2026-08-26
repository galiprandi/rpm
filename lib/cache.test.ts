import { describe, it, expect, vi, beforeEach } from "vitest";
import { revalidateTag } from "next/cache";

// Use the real cache module, not the global mock from vitest.setup.ts
vi.mock("@/lib/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./cache")>();
  return { ...actual };
});

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

const {
  invalidateCashStatus,
  invalidateDashboard,
  invalidatePriceLists,
  invalidateVehicle,
  invalidateCustomer,
  CACHE_TAGS,
  vehicleCacheTag,
  customerCacheTag,
} = await import("./cache");

describe("Cache invalidation helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("invalidateCashStatus", () => {
    it("should revalidate the cash-status tag", () => {
      invalidateCashStatus();
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.CASH_STATUS, "default");
    });
  });

  describe("invalidateDashboard", () => {
    it("should revalidate the dashboard-data tag", () => {
      invalidateDashboard();
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.DASHBOARD, "default");
    });
  });

  describe("invalidatePriceLists", () => {
    it("should revalidate the price-lists tag", () => {
      invalidatePriceLists();
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.PRICE_LISTS, "default");
    });
  });

  describe("vehicleCacheTag", () => {
    it("should generate a vehicle-specific cache tag", () => {
      expect(vehicleCacheTag("abc-123")).toBe("vehicle-abc-123");
    });
  });

  describe("customerCacheTag", () => {
    it("should generate a customer-specific cache tag", () => {
      expect(customerCacheTag("xyz-456")).toBe("customer-xyz-456");
    });
  });

  describe("invalidateVehicle", () => {
    it("should revalidate the vehicle-specific tag", () => {
      invalidateVehicle("abc-123");
      expect(revalidateTag).toHaveBeenCalledWith("vehicle-abc-123", "default");
    });

    it("should handle UUIDs", () => {
      const uuid = "b32ccecb-46b7-4729-88f6-c646d8361bb0";
      invalidateVehicle(uuid);
      expect(revalidateTag).toHaveBeenCalledWith(`vehicle-${uuid}`, "default");
    });
  });

  describe("invalidateCustomer", () => {
    it("should revalidate the customer-specific tag", () => {
      invalidateCustomer("xyz-456");
      expect(revalidateTag).toHaveBeenCalledWith("customer-xyz-456", "default");
    });

    it("should handle UUIDs", () => {
      const uuid = "5850e9b0-d3bb-4023-9554-77a81fa1eed0";
      invalidateCustomer(uuid);
      expect(revalidateTag).toHaveBeenCalledWith(`customer-${uuid}`, "default");
    });
  });
});
