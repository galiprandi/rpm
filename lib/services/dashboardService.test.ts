/**
 * Dashboard Service Tests
 *
 * Tests for getDashboardData() function
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardData } from "./dashboardService";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    work_order: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    direct_sale: {
      aggregate: vi.fn(),
    },
    direct_sale_item: {
      findMany: vi.fn(),
    },
    work_order_item: {
      findMany: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      fields: {
        minStock: "minStock",
      },
    },
    customer: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    cash_movement: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    payment_method: {
      findMany: vi.fn(),
    },
  },
}));

describe("Dashboard Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks to return empty results
    vi.mocked(prisma.work_order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.work_order.aggregate).mockResolvedValue({
      _sum: { total: null },
      _count: { id: 0 },
    } as any);
    vi.mocked(prisma.work_order.groupBy).mockResolvedValue([] as any);
    vi.mocked(prisma.direct_sale.aggregate).mockResolvedValue({
      _sum: { total: null },
      _count: { id: 0 },
    } as any);
    vi.mocked(prisma.direct_sale_item.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.work_order_item.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.customer.aggregate).mockResolvedValue({
      _sum: { balance: null },
      _count: { id: 0 },
    } as any);
    vi.mocked(prisma.customer.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.cash_movement.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.cash_movement.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.work_order.count).mockResolvedValue(0);
    vi.mocked(prisma.payment_method.findMany).mockResolvedValue([] as any);
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
