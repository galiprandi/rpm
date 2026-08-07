import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSalesReport } from "../../lib/services/salesReportService";
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

describe("salesReportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should correctly calculate sales metrics for current and previous periods", async () => {
    // Current period metrics (2 select calls via Promise.all):
    // 1. workOrders (completedAt in range): sum(total), count(id) -> 12000, 3
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 12000, idCount: 3 }]) as any,
    );
    // 2. directSales (createdAt in range): sum(total), count(id) -> 4000, 2
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 4000, idCount: 2 }]) as any,
    );

    // Previous period metrics (2 select calls via Promise.all):
    // 3. workOrders (prev): 6000, 2
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 6000, idCount: 2 }]) as any,
    );
    // 4. directSales (prev): 2000, 1
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 2000, idCount: 1 }]) as any,
    );

    // Evolution raw data selects (2 select calls via Promise.all):
    // 5. workOrders evolution list (completedAt in range)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { total: 5000, completedAt: "2026-06-15T15:00:00.000Z" }, // 12:00 ARG
        { total: 7000, completedAt: "2026-06-15T18:00:00.000Z" }, // 15:00 ARG
      ]) as any,
    );
    // 6. directSales evolution list (createdAt in range)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { total: 4000, createdAt: "2026-06-15T21:00:00.000Z" }, // 18:00 ARG
      ]) as any,
    );

    // Detailed items selects for distributions and top products (2 select calls via Promise.all):
    // 7. woItems
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          subtotal: 5000,
          productId: "prod-led",
          serviceId: null,
          quantity: 2,
          productName: "Kit Led Creed",
          productCategoryId: "cat-luz",
          categoryName: "Iluminación",
          categoryColor: "#ff0000",
          serviceName: null,
        },
        {
          subtotal: 7000,
          productId: null,
          serviceId: "srv-ppf",
          quantity: 1,
          productName: null,
          productCategoryId: null,
          categoryName: null,
          categoryColor: null,
          serviceName: "Aplicación PPF Capot",
        },
      ]) as any,
    );
    // 8. dsItems
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          totalPrice: 4000,
          productId: "prod-led",
          serviceId: null,
          quantity: 1,
          productName: "Kit Led Creed",
          productCategoryId: "cat-luz",
          categoryName: "Iluminación",
          categoryColor: "#ff0000",
          serviceName: null,
        },
      ]) as any,
    );

    const report = await getSalesReport({
      startDate: new Date("2026-06-15T03:00:00Z"), // 00:00 ARG
      endDate: new Date("2026-06-15T23:59:59Z"),
      comparisonStartDate: new Date("2026-06-14T03:00:00Z"),
      comparisonEndDate: new Date("2026-06-14T23:59:59Z"),
      groupBy: "day",
    });

    // 1. Current Period Calculations
    // Total = 12000 (WO) + 4000 (DS) = 16000
    expect(report.totalSales.current).toBe(16000);
    // Order Count = 3 (WO) + 2 (DS) = 5
    expect(report.orderCount.current).toBe(5);
    // Ticket Average = 16000 / 5 = 3200
    expect(report.ticketAverage.current).toBe(3200);

    // 2. Previous Period Calculations
    // Total (prev) = 6000 (WO) + 2000 (DS) = 8000
    expect(report.totalSales.previous).toBe(8000);
    // Order Count (prev) = 2 (WO) + 1 (DS) = 3
    expect(report.orderCount.previous).toBe(3);
    // Ticket Average (prev) = 8000 / 3 = 2666.67
    expect(report.ticketAverage.previous).toBeCloseTo(2666.67, 1);

    // 3. Percentage Changes
    // Total sales change: ((16000 - 8000) / 8000) * 100 = 100%
    expect(report.totalSales.change).toBe(100);
    // Order count change: ((5 - 3) / 3) * 100 = 66.67%
    expect(report.orderCount.change).toBeCloseTo(66.67, 1);
    // Ticket average change: ((3200 - 2666.67) / 2666.67) * 100 = 20%
    expect(report.ticketAverage.change).toBeCloseTo(20, 1);

    // 4. Evolution / Buckets Check
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].total).toBe(16000);
    expect(report.evolution[0].count).toBe(3);

    // 5. Top Products Verification
    expect(report.topProducts).toHaveLength(2);
    // 'prod-led' (Kit Led Creed) -> 5000 (from WO) + 4000 (from DS) = 9000 total, qty: 3
    expect(report.topProducts[0].id).toBe("prod-led");
    expect(report.topProducts[0].name).toBe("Kit Led Creed");
    expect(report.topProducts[0].total).toBe(9000);
    expect(report.topProducts[0].quantity).toBe(3);

    // 'srv-ppf' (Aplicación PPF Capot) -> 7000 total, qty: 1
    expect(report.topProducts[1].id).toBe("srv-ppf");
    expect(report.topProducts[1].name).toBe("Aplicación PPF Capot");
    expect(report.topProducts[1].total).toBe(7000);
    expect(report.topProducts[1].quantity).toBe(1);

    // 6. Category Distribution Verification
    expect(report.categoryDistribution).toHaveLength(2);
    // 'Iluminación' (cat-luz) -> 9000 total
    const catLuz = report.categoryDistribution.find((c) => c.id === "cat-luz");
    expect(catLuz).toBeDefined();
    expect(catLuz?.name).toBe("Iluminación");
    expect(catLuz?.total).toBe(9000);
    expect(catLuz?.color).toBe("#ff0000");

    // 'Servicios' (services-cat) -> 7000 total
    const catSrv = report.categoryDistribution.find(
      (c) => c.id === "services-cat",
    );
    expect(catSrv).toBeDefined();
    expect(catSrv?.name).toBe("Servicios");
    expect(catSrv?.total).toBe(7000);
    expect(catSrv?.color).toBe("#6366f1");
  });

  it("should handle zero or null values gracefully without division by zero", async () => {
    // Current period metrics (zero/null results)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: null, idCount: 0 }]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: null, idCount: 0 }]) as any,
    );

    // Detailed current items and evolution
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getSalesReport({
      startDate: new Date("2026-06-15T03:00:00Z"),
      endDate: new Date("2026-06-15T23:59:59Z"),
      groupBy: "day",
    });

    expect(report.totalSales.current).toBe(0);
    expect(report.orderCount.current).toBe(0);
    expect(report.ticketAverage.current).toBe(0);
    expect(report.totalSales.change).toBe(0);
    expect(report.orderCount.change).toBe(0);
    expect(report.ticketAverage.change).toBe(0);
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].total).toBe(0);
    expect(report.evolution[0].count).toBe(0);
    expect(report.topProducts).toHaveLength(0);
    expect(report.categoryDistribution).toHaveLength(0);
  });

  it("should correctly initialize buckets and labels for monthly groupBy", async () => {
    // Current period metrics (Calls 1-2)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 0, idCount: 0 }]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 0, idCount: 0 }]) as any,
    );

    // Evolution (Calls 3-4)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Items (Calls 5-6)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getSalesReport({
      startDate: new Date("2026-01-01T03:00:00Z"), // 00:00 Ene 1st ARG
      endDate: new Date("2026-03-31T23:59:59Z"),
      groupBy: "month",
    });

    // Ene, Feb, Mar 2026 buckets should exist
    expect(report.evolution).toHaveLength(3);
    expect(report.evolution[0].label).toBe("Ene");
    expect(report.evolution[1].label).toBe("Feb");
    expect(report.evolution[2].label).toBe("Mar");
  });

  it("should correctly initialize buckets and labels for hourly groupBy", async () => {
    // Current period metrics (Calls 1-2)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 0, idCount: 0 }]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 0, idCount: 0 }]) as any,
    );

    // Evolution (Calls 3-4)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Items (Calls 5-6)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getSalesReport({
      startDate: new Date("2026-06-15T03:00:00Z"), // 00:00 ARG
      endDate: new Date("2026-06-15T05:59:59Z"), // 02:59 ARG
      groupBy: "hour",
    });

    // 00:00 to 02:00 buckets should exist
    expect(report.evolution).toHaveLength(3);
    expect(report.evolution[0].label).toBe("00:00");
    expect(report.evolution[1].label).toBe("01:00");
    expect(report.evolution[2].label).toBe("02:00");
  });
});
