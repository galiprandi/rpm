import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServiceReport } from "../../lib/services/serviceReportService";
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

describe("serviceReportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should correctly calculate service metrics, distributions, and technician performance", async () => {
    // 1. Current period metrics (Promise.all - 2 selects)
    // - woItems: subtotalSum, idCount -> 20000, 4
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ subtotalSum: 20000, idCount: 4 }]) as any);
    // - dsItems: totalPriceSum, idCount -> 5000, 1
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalPriceSum: 5000, idCount: 1 }]) as any);

    // 2. Previous period metrics (Promise.all - 2 selects)
    // - woItems (prev): 10000, 2
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ subtotalSum: 10000, idCount: 2 }]) as any);
    // - dsItems (prev): 5000, 1
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalPriceSum: 5000, idCount: 1 }]) as any);

    // 3. Detailed Work Order items for distributions and evolution
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          subtotal: 12000,
          serviceId: "srv-align",
          quantity: 1,
          serviceName: "Alineación y Balanceo",
          technicianId: "tech-1",
          technicianName: "Technician One",
          vehicleCategory: "SUV",
          completedAt: "2026-06-15T10:00:00.000Z", // 07:00 ARG
        },
        {
          subtotal: 8000,
          serviceId: "srv-wash",
          quantity: 3,
          serviceName: "Lavado Detallado",
          technicianId: "tech-2",
          technicianName: "Technician Two",
          vehicleCategory: "Auto",
          completedAt: "2026-06-15T15:00:00.000Z", // 12:00 ARG
        },
      ]) as any,
    );

    // 4. Detailed Direct Sale items for distributions and evolution
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          totalPrice: 5000,
          serviceId: "srv-align",
          quantity: 1,
          itemName: "Alineación y Balanceo",
          serviceName: "Alineación y Balanceo",
          createdAt: "2026-06-15T18:00:00.000Z", // 15:00 ARG
        },
      ]) as any,
    );

    const report = await getServiceReport({
      startDate: new Date("2026-06-15T03:00:00Z"), // 00:00 ARG
      endDate: new Date("2026-06-15T23:59:59Z"),
      comparisonStartDate: new Date("2026-06-14T03:00:00Z"),
      comparisonEndDate: new Date("2026-06-14T23:59:59Z"),
      groupBy: "day",
    });

    // Current Metrics
    // Total: 20000 + 5000 = 25000
    // Count: 4 + 1 = 5
    // Average: 25000 / 5 = 5000
    expect(report.totalServiceRevenue.current).toBe(25000);
    expect(report.serviceCount.current).toBe(5);
    expect(report.averageServicePrice.current).toBe(5000);

    // Previous Metrics
    // Total (prev): 10000 + 5000 = 15000
    // Count (prev): 2 + 1 = 3
    // Average (prev): 15000 / 3 = 5000
    expect(report.totalServiceRevenue.previous).toBe(15000);
    expect(report.serviceCount.previous).toBe(3);
    expect(report.averageServicePrice.previous).toBe(5000);

    // Changes
    // ((25000 - 15000) / 15000) * 100 = 66.67%
    expect(report.totalServiceRevenue.change).toBeCloseTo(66.67, 1);
    // ((5 - 3) / 3) * 100 = 66.67%
    expect(report.serviceCount.change).toBeCloseTo(66.67, 1);
    expect(report.averageServicePrice.change).toBe(0);

    // Top Services Verification
    // srv-align: 12000 (from WO) + 5000 (from DS) = 17000, quantity 2
    // srv-wash: 8000, quantity 3
    expect(report.topServices).toHaveLength(2);
    expect(report.topServices[0].id).toBe("srv-align");
    expect(report.topServices[0].name).toBe("Alineación y Balanceo");
    expect(report.topServices[0].total).toBe(17000);
    expect(report.topServices[0].quantity).toBe(2);

    expect(report.topServices[1].id).toBe("srv-wash");
    expect(report.topServices[1].name).toBe("Lavado Detallado");
    expect(report.topServices[1].total).toBe(8000);
    expect(report.topServices[1].quantity).toBe(3);

    // Vehicle Category Distribution
    // SUV: total 12000, count 1
    // Lavado: Auto: total 8000, count 3
    // Direct Sale: Venta Directa: total 5000, count 1
    expect(report.vehicleCategoryDistribution).toHaveLength(3);
    expect(report.vehicleCategoryDistribution[0].category).toBe("SUV");
    expect(report.vehicleCategoryDistribution[0].total).toBe(12000);
    expect(report.vehicleCategoryDistribution[1].category).toBe("Auto");
    expect(report.vehicleCategoryDistribution[1].total).toBe(8000);
    expect(report.vehicleCategoryDistribution[2].category).toBe("Venta Directa");
    expect(report.vehicleCategoryDistribution[2].total).toBe(5000);

    // Technician Performance
    expect(report.technicianPerformance).toHaveLength(2);
    expect(report.technicianPerformance[0].technicianId).toBe("tech-1");
    expect(report.technicianPerformance[0].technicianName).toBe("Technician One");
    expect(report.technicianPerformance[0].totalRevenue).toBe(12000);
    expect(report.technicianPerformance[0].serviceCount).toBe(1);

    expect(report.technicianPerformance[1].technicianId).toBe("tech-2");
    expect(report.technicianPerformance[1].technicianName).toBe("Technician Two");
    expect(report.technicianPerformance[1].totalRevenue).toBe(8000);
    expect(report.technicianPerformance[1].serviceCount).toBe(3);

    // Evolution
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].total).toBe(25000);
    expect(report.evolution[0].count).toBe(5);
  });

  it("should handle empty or null values gracefully without division by zero", async () => {
    // Current period metrics (Promise.all - 2 selects)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ subtotalSum: null, idCount: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalPriceSum: null, idCount: 0 }]) as any);

    // Detailed Work Order and Direct Sale items
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getServiceReport({
      startDate: new Date("2026-06-15T03:00:00Z"),
      endDate: new Date("2026-06-15T23:59:59Z"),
      groupBy: "day",
    });

    expect(report.totalServiceRevenue.current).toBe(0);
    expect(report.serviceCount.current).toBe(0);
    expect(report.averageServicePrice.current).toBe(0);
    expect(report.totalServiceRevenue.change).toBe(0);
    expect(report.serviceCount.change).toBe(0);
    expect(report.averageServicePrice.change).toBe(0);
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].total).toBe(0);
    expect(report.evolution[0].count).toBe(0);
    expect(report.topServices).toHaveLength(0);
    expect(report.vehicleCategoryDistribution).toHaveLength(0);
    expect(report.technicianPerformance).toHaveLength(0);
  });

  it("should correctly handle monthly grouping and bucket initialization", async () => {
    // Current period metrics
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ subtotalSum: null, idCount: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalPriceSum: null, idCount: 0 }]) as any);

    // Detailed Work Order and Direct Sale items
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getServiceReport({
      startDate: new Date("2026-01-01T03:00:00Z"),
      endDate: new Date("2026-03-31T23:59:59Z"),
      groupBy: "month",
    });

    expect(report.evolution).toHaveLength(3);
    expect(report.evolution[0].label).toBe("Ene");
    expect(report.evolution[1].label).toBe("Feb");
    expect(report.evolution[2].label).toBe("Mar");
  });

  it("should correctly handle hourly grouping and bucket initialization", async () => {
    // Current period metrics
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ subtotalSum: null, idCount: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalPriceSum: null, idCount: 0 }]) as any);

    // Detailed Work Order and Direct Sale items
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getServiceReport({
      startDate: new Date("2026-06-15T03:00:00Z"), // 00:00 ARG
      endDate: new Date("2026-06-15T05:59:59Z"), // 02:59 ARG
      groupBy: "hour",
    });

    expect(report.evolution).toHaveLength(3);
    expect(report.evolution[0].label).toBe("00:00");
    expect(report.evolution[1].label).toBe("01:00");
    expect(report.evolution[2].label).toBe("02:00");
  });
});
