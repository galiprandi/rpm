import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWorkshopReport } from "../../lib/services/workshopReportService";
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

describe("workshopReportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should correctly calculate workshop metrics, status distributions, and technician performance", async () => {
    // 1. Current period metrics queries (3 queries in Promise.all):
    // - totalOrdersResult
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ idCount: 5 }]) as any);
    // - completedOrdersResult
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ idCount: 3 }]) as any);
    // - resolutionTimes
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          createdAt: "2026-06-15T10:00:00.000Z",
          completedAt: "2026-06-15T12:00:00.000Z", // 2 hours
        },
        {
          createdAt: "2026-06-15T11:00:00.000Z",
          completedAt: "2026-06-15T15:00:00.000Z", // 4 hours
        },
      ]) as any,
    );

    // 2. Previous period metrics queries (3 queries in Promise.all):
    // - totalOrdersResult
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ idCount: 4 }]) as any);
    // - completedOrdersResult
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ idCount: 2 }]) as any);
    // - resolutionTimes
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          createdAt: "2026-06-14T10:00:00.000Z",
          completedAt: "2026-06-14T15:00:00.000Z", // 5 hours
        },
      ]) as any,
    );

    // 3. Status Distribution query
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { status: "READY", idCount: 2 },
        { status: "IN_PROGRESS", idCount: 3 },
      ]) as any,
    );

    // 4. Technician assigned counts query
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { technicianId: "tech-1", idCount: 3 },
        { technicianId: "tech-2", idCount: 2 },
      ]) as any,
    );

    // 5. Users query (for tech names)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { id: "tech-1", name: "Technician One", role: "STAFF" },
        { id: "tech-2", name: "Technician Two", role: "ADMIN" },
      ]) as any,
    );

    // 6. Completed counts per technician
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { technicianId: "tech-1", idCount: 2 },
        { technicianId: "tech-2", idCount: 1 },
      ]) as any,
    );

    // 7. Evolution queries (2 queries in Promise.all):
    // - createdEvolution
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { createdAt: "2026-06-15T04:00:00.000Z" }, // 01:00 ARG
        { createdAt: "2026-06-15T05:00:00.000Z" }, // 02:00 ARG
      ]) as any,
    );
    // - completedEvolution
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { completedAt: "2026-06-15T05:30:00.000Z" }, // 02:30 ARG
      ]) as any,
    );

    const report = await getWorkshopReport({
      startDate: new Date("2026-06-15T03:00:00Z"), // 00:00 ARG
      endDate: new Date("2026-06-15T23:59:59Z"),
      comparisonStartDate: new Date("2026-06-14T03:00:00Z"),
      comparisonEndDate: new Date("2026-06-14T23:59:59Z"),
      groupBy: "day",
    });

    // Current Metrics
    expect(report.totalOrders.current).toBe(5);
    expect(report.completedOrders.current).toBe(3);
    // (2 + 4) / 2 = 3 hours
    expect(report.avgResolutionTime.current).toBe(3);

    // Previous Metrics
    expect(report.totalOrders.previous).toBe(4);
    expect(report.completedOrders.previous).toBe(2);
    expect(report.avgResolutionTime.previous).toBe(5);

    // Changes
    // ((5 - 4) / 4) * 100 = 25%
    expect(report.totalOrders.change).toBe(25);
    // ((3 - 2) / 2) * 100 = 50%
    expect(report.completedOrders.change).toBe(50);
    // ((3 - 5) / 5) * 100 = -40%
    expect(report.avgResolutionTime.change).toBe(-40);

    // Status Distribution
    expect(report.statusDistribution).toHaveLength(2);
    expect(report.statusDistribution[0].status).toBe("IN_PROGRESS");
    expect(report.statusDistribution[0].label).toBe("En Proceso");
    expect(report.statusDistribution[0].count).toBe(3);
    expect(report.statusDistribution[1].status).toBe("READY");
    expect(report.statusDistribution[1].label).toBe("Listo");
    expect(report.statusDistribution[1].count).toBe(2);

    // Technician Performance
    expect(report.technicianPerformance).toHaveLength(2);
    expect(report.technicianPerformance[0].technicianId).toBe("tech-1");
    expect(report.technicianPerformance[0].technicianName).toBe("Technician One");
    expect(report.technicianPerformance[0].assignedCount).toBe(3);
    expect(report.technicianPerformance[0].completedCount).toBe(2);

    expect(report.technicianPerformance[1].technicianId).toBe("tech-2");
    expect(report.technicianPerformance[1].technicianName).toBe("Technician Two");
    expect(report.technicianPerformance[1].assignedCount).toBe(2);
    expect(report.technicianPerformance[1].completedCount).toBe(1);

    // Evolution
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].created).toBe(2);
    expect(report.evolution[0].completed).toBe(1);
  });

  it("should handle empty or null values gracefully without division by zero", async () => {
    // Current period metrics queries (3 queries in Promise.all):
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ idCount: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ idCount: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Status Distribution
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Technician assigned counts
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Completed counts per technician
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Evolution queries (2 queries in Promise.all):
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getWorkshopReport({
      startDate: new Date("2026-06-15T03:00:00Z"),
      endDate: new Date("2026-06-15T23:59:59Z"),
      groupBy: "day",
    });

    expect(report.totalOrders.current).toBe(0);
    expect(report.completedOrders.current).toBe(0);
    expect(report.avgResolutionTime.current).toBe(0);
    expect(report.statusDistribution).toHaveLength(0);
    expect(report.technicianPerformance).toHaveLength(0);
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].created).toBe(0);
    expect(report.evolution[0].completed).toBe(0);
  });

  it("should correctly handle monthly grouping and bucket initialization", async () => {
    // Current period metrics
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ idCount: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ idCount: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Status Distribution
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Technician assigned counts
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Completed counts per technician
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Evolution
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getWorkshopReport({
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
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ idCount: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ idCount: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Status Distribution
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Technician assigned counts
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Completed counts per technician
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Evolution
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getWorkshopReport({
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
