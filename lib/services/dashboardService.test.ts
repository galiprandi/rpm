/**
 * Dashboard Service Tests
 *
 * Tests for getDashboardData() function
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardData } from "./dashboardService";
import { db } from "@/lib/db";

// vi.hoisted runs before vi.mock factory
const { createChainable, createDbMockObj } = vi.hoisted(() => {
  function createChainable(resolveValue: unknown = []): any {
    const target = () => {};
    return new Proxy(target, {
      get(_t: any, prop: string) {
        if (prop === "then") {
          return (resolve: any, reject: any) =>
            Promise.resolve(resolveValue).then(resolve, reject);
        }
        if (prop === "catch") {
          return (onRejected: any) =>
            Promise.resolve(resolveValue).catch(onRejected);
        }
        return vi.fn(() => createChainable(resolveValue));
      },
      apply() {
        return createChainable(resolveValue);
      },
    });
  }

  function createDbMockObj() {
    const query = {
      workOrder: { findMany: vi.fn(), findFirst: vi.fn() },
      directSale: { findMany: vi.fn(), findFirst: vi.fn() },
      cashMovement: { findMany: vi.fn(), findFirst: vi.fn() },
      customer: { findMany: vi.fn(), findFirst: vi.fn() },
      paymentMethod: { findMany: vi.fn(), findFirst: vi.fn() },
    };
    return {
      select: vi.fn(() => createChainable()),
      query,
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{}])),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
          returning: vi.fn(() => Promise.resolve([{}])),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
      transaction: vi.fn(async (callback: any) => {
        const tx = {
          select: vi.fn(() => createChainable()),
          query,
          insert: vi.fn(() => ({
            values: vi.fn(() => ({
              returning: vi.fn(() => Promise.resolve([{}])),
            })),
          })),
          update: vi.fn(() => ({
            set: vi.fn(() => ({
              where: vi.fn(() => Promise.resolve()),
              returning: vi.fn(() => Promise.resolve([{}])),
            })),
          })),
          delete: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve()),
          })),
        };
        return callback(tx);
      }),
    };
  }

  return { createChainable, createDbMockObj };
});

vi.mock("@/lib/db", () => ({
  db: createDbMockObj(),
}));

describe("Dashboard Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks to return empty results
    vi.mocked(db.select).mockReturnValue(createChainable());
    vi.mocked(db.query.workOrder.findMany).mockResolvedValue([] as any);
    vi.mocked(db.query.workOrder.findFirst).mockResolvedValue(null as any);
    vi.mocked(db.query.directSale.findMany).mockResolvedValue([] as any);
    vi.mocked(db.query.cashMovement.findMany).mockResolvedValue([] as any);
    vi.mocked(db.query.cashMovement.findFirst).mockResolvedValue(null as any);
    vi.mocked(db.query.customer.findMany).mockResolvedValue([] as any);
    vi.mocked(db.query.paymentMethod.findMany).mockResolvedValue([] as any);
  });

  describe("getDashboardData", () => {
    it("should return dashboard data structure", async () => {
      const result = await getDashboardData();

      expect(result).toBeDefined();
      expect(result.sales).toBeDefined();
      expect(result.workOrders).toBeDefined();
      expect(result.stock).toBeDefined();
      expect(result.readyForDelivery).toBeInstanceOf(Array);
      expect(result.topProducts).toBeInstanceOf(Array);
      expect(result.debtors).toBeDefined();
      expect(result.cashStatus).toBeDefined();
      expect(result.paymentsByMethod).toBeInstanceOf(Array);
      expect(result.cashMovements).toBeInstanceOf(Array);
      expect(result.generatedAt).toBeDefined();
    });

    it("should include sales metrics", async () => {
      const result = await getDashboardData();

      expect(result.sales.today).toBeDefined();
      expect(typeof result.sales.today.total).toBe("number");
      expect(typeof result.sales.today.workOrderCount).toBe("number");
      expect(typeof result.sales.today.vsYesterday).toBe("number");
      expect(typeof result.sales.ticketAverage).toBe("number");
    });

    it("should include work orders metrics", async () => {
      const result = await getDashboardData();

      expect(result.workOrders.active).toBeDefined();
      expect(typeof result.workOrders.active.total).toBe("number");
      expect(result.workOrders.active.byStatus).toBeDefined();
      expect(typeof result.workOrders.active.byStatus.pending).toBe("number");
      expect(typeof result.workOrders.active.byStatus.inProgress).toBe(
        "number",
      );
      expect(typeof result.workOrders.active.byStatus.ready).toBe("number");
      expect(typeof result.workOrders.active.newToday).toBe("number");
      expect(Array.isArray(result.workOrders.active.oldestPending)).toBe(true);
    });

    it("should include stock metrics", async () => {
      const result = await getDashboardData();

      expect(result.stock).toBeDefined();
      expect(typeof result.stock.lowStockCount).toBe("number");
      expect(Array.isArray(result.stock.lowStockItems)).toBe(true);
    });

    it("should group payments by method", async () => {
      const result = await getDashboardData();

      expect(Array.isArray(result.paymentsByMethod)).toBe(true);

      if (result.paymentsByMethod && result.paymentsByMethod.length > 0) {
        const firstPayment = result.paymentsByMethod[0];
        expect(firstPayment).toHaveProperty("code");
        expect(firstPayment).toHaveProperty("name");
        expect(firstPayment).toHaveProperty("total");
        expect(typeof firstPayment.total).toBe("number");
      }
    });

    it("should include cash movements", async () => {
      const result = await getDashboardData();

      expect(Array.isArray(result.cashMovements)).toBe(true);

      if (result.cashMovements && result.cashMovements.length > 0) {
        const firstMovement = result.cashMovements[0];
        expect(firstMovement).toHaveProperty("id");
        expect(firstMovement).toHaveProperty("type");
        expect(firstMovement).toHaveProperty("amount");
        expect(firstMovement).toHaveProperty("method");
        expect(firstMovement).toHaveProperty("createdAt");
      }
    });

    it("should include top products sold today", async () => {
      const result = await getDashboardData();

      expect(Array.isArray(result.topProducts)).toBe(true);

      if (result.topProducts.length > 0) {
        const firstProduct = result.topProducts[0];
        expect(firstProduct).toHaveProperty("name");
        expect(firstProduct).toHaveProperty("quantity");
        expect(firstProduct).toHaveProperty("revenue");
      }
    });

    it("should include debtors summary", async () => {
      const result = await getDashboardData();

      expect(result.debtors).toBeDefined();
      expect(typeof result.debtors.totalDebt).toBe("number");
      expect(typeof result.debtors.count).toBe("number");
      expect(Array.isArray(result.debtors.topDebtors)).toBe(true);
    });

    it("should include cash register status", async () => {
      const result = await getDashboardData();

      expect(result.cashStatus).toBeDefined();
      expect(typeof result.cashStatus.isOpen).toBe("boolean");
      expect(typeof result.cashStatus.balance).toBe("number");
    });

    it("should have valid timestamp", async () => {
      const result = await getDashboardData();
      const generatedAt = new Date(result.generatedAt);

      expect(generatedAt).toBeInstanceOf(Date);
      expect(generatedAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(generatedAt.getTime()).toBeGreaterThan(Date.now() - 60000); // Within last minute
    });

    it("should handle empty data gracefully", async () => {
      // This test verifies that the service doesn't crash with empty data
      // The actual data depends on the database state
      const result = await getDashboardData();

      expect(result).toBeDefined();
      expect(result.sales.today.total).toBeGreaterThanOrEqual(0);
      expect(result.workOrders.active.total).toBeGreaterThanOrEqual(0);
      expect(result.stock.lowStockCount).toBeGreaterThanOrEqual(0);
    });
  });
});
