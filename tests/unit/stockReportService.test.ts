import { describe, it, expect, vi, beforeEach } from "vitest";
import { getInventoryReport } from "../../lib/services/stockReportService";
import { db } from "@/lib/db";

// Helper to create a chainable that resolves to a specific value
const { createChainable } = vi.hoisted(() => {
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
  return { createChainable };
});

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => createChainable()),
  },
}));

describe("stockReportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should correctly calculate inventory metrics, dead stock, and turnover", async () => {
    const recentDate = new Date().toISOString();
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    const oldDateStr = oldDate.toISOString();

    // 1. Products query: db.select().from(product).leftJoin(category).where()
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          id: "p1",
          name: "Product 1",
          stock: 10,
          costPrice: 100,
          minStock: 5,
          categoryId: "cat-a",
          isActive: true,
          categoryName: "Category A",
          createdAt: recentDate,
          lastMovementAt: recentDate,
        },
        {
          id: "p2",
          name: "Product 2",
          stock: 2,
          costPrice: 50,
          minStock: 5,
          categoryId: "cat-a",
          isActive: true,
          categoryName: "Category A",
          createdAt: recentDate,
          lastMovementAt: recentDate,
        },
        {
          id: "p3",
          name: "Product 3",
          stock: 5,
          costPrice: 200,
          minStock: 1,
          categoryId: "cat-b",
          isActive: true,
          categoryName: "Category B",
          createdAt: oldDateStr,
          lastMovementAt: oldDateStr,
        },
      ]) as any,
    );

    // 2. WO items query: db.select().from(workOrderItem).innerJoin(workOrder).leftJoin(product).where()
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { quantity: 5, productCostPrice: 100 },
      ]) as any,
    );

    // 3. DS items query: db.select().from(directSaleItem).innerJoin(directSale).leftJoin(product).where()
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { quantity: 2, productCostPrice: 50 },
      ]) as any,
    );

    const report = await getInventoryReport();

    // Total Value: (10 * 100) + (2 * 50) + (5 * 200) = 2100
    expect(report.totalValue).toBe(2100);

    // Total Products (Sum of stock): 10 + 2 + 5 = 17
    expect(report.totalProducts).toBe(17);

    // Active Products count: 3
    expect(report.activeProducts).toBe(3);

    // Low Stock Count: stock <= minStock (only p2: 2 <= 5)
    expect(report.lowStockCount).toBe(1);

    // Dead stock check: stock > 0 and lastMovementAt < 90 days ago (p3)
    expect(report.deadStockCount).toBe(1);
    expect(report.deadStockValue).toBe(1000);
    expect(report.deadStockProducts).toHaveLength(1);
    expect(report.deadStockProducts[0].id).toBe("p3");
    expect(report.deadStockProducts[0].value).toBe(1000);

    // Inventory Turnover:
    // (cogs30d * 12) / totalValue = (600 * 12) / 2100 = 7200 / 2100 = 3.428...
    expect(report.inventoryTurnover).toBeCloseTo(3.43, 2);

    // Category Distribution:
    // Category A: count = 12, value = 1100
    // Category B: count = 5, value = 1000
    expect(report.categoryDistribution).toHaveLength(2);
    expect(report.categoryDistribution[0].id).toBe("cat-a");
    expect(report.categoryDistribution[0].count).toBe(12);
    expect(report.categoryDistribution[0].value).toBe(1100);
    expect(report.categoryDistribution[1].id).toBe("cat-b");
    expect(report.categoryDistribution[1].count).toBe(5);
    expect(report.categoryDistribution[1].value).toBe(1000);

    // Top Valued Products:
    // p1: value = 1000, p3: value = 1000, p2: value = 100
    expect(report.topValuedProducts).toHaveLength(3);
    expect(report.topValuedProducts[0].id).toBe("p1");
    expect(report.topValuedProducts[1].id).toBe("p3");
    expect(report.topValuedProducts[2].id).toBe("p2");
  });

  it("should handle empty product list cleanly", async () => {
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getInventoryReport();

    expect(report.totalValue).toBe(0);
    expect(report.totalProducts).toBe(0);
    expect(report.activeProducts).toBe(0);
    expect(report.lowStockCount).toBe(0);
    expect(report.deadStockCount).toBe(0);
    expect(report.deadStockValue).toBe(0);
    expect(report.inventoryTurnover).toBe(0);
    expect(report.categoryDistribution).toHaveLength(0);
    expect(report.topValuedProducts).toHaveLength(0);
    expect(report.deadStockProducts).toHaveLength(0);
  });
});
