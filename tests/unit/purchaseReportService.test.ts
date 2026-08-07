import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPurchaseReport } from "../../lib/services/purchaseReportService";
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

describe("purchaseReportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should correctly calculate purchase metrics for current and previous periods", async () => {
    // 1. Current period metrics: sum(totalAmount), count(id) -> 15000, 3
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 15000, idCount: 3 }]) as any,
    );

    // 2. Previous period metrics: sum(totalAmount), count(id) -> 10000, 2
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 10000, idCount: 2 }]) as any,
    );

    // 3. Current period vouchers (for evolution and suppliers)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          id: "v1",
          supplierId: "sup-a",
          totalAmount: 5000,
          date: "2026-06-15T10:00:00.000Z", // 07:00 ARG
          supplierName: "Supplier A",
        },
        {
          id: "v2",
          supplierId: "sup-b",
          totalAmount: 7000,
          date: "2026-06-15T15:00:00.000Z", // 12:00 ARG
          supplierName: "Supplier B",
        },
        {
          id: "v3",
          supplierId: "sup-a",
          totalAmount: 3000,
          date: "2026-06-15T18:00:00.000Z", // 15:00 ARG
          supplierName: "Supplier A",
        },
      ]) as any,
    );

    const report = await getPurchaseReport({
      startDate: new Date("2026-06-15T03:00:00Z"), // 00:00 ARG
      endDate: new Date("2026-06-15T23:59:59Z"),
      comparisonStartDate: new Date("2026-06-14T03:00:00Z"),
      comparisonEndDate: new Date("2026-06-14T23:59:59Z"),
      groupBy: "day",
    });

    // Verify current metrics
    expect(report.totalPurchases.current).toBe(15000);
    expect(report.voucherCount.current).toBe(3);
    expect(report.averageVoucher.current).toBe(5000);

    // Verify previous metrics
    expect(report.totalPurchases.previous).toBe(10000);
    expect(report.voucherCount.previous).toBe(2);
    expect(report.averageVoucher.previous).toBe(5000);

    // Verify changes
    // ((15000 - 10000) / 10000) * 100 = 50%
    expect(report.totalPurchases.change).toBe(50);
    // ((3 - 2) / 2) * 100 = 50%
    expect(report.voucherCount.change).toBe(50);
    expect(report.averageVoucher.change).toBe(0);

    // Supplier Distribution Verification
    expect(report.supplierDistribution).toHaveLength(2);
    expect(report.supplierDistribution[0].supplierId).toBe("sup-a");
    expect(report.supplierDistribution[0].total).toBe(8000);
    expect(report.supplierDistribution[0].count).toBe(2);
    expect(report.supplierDistribution[1].supplierId).toBe("sup-b");
    expect(report.supplierDistribution[1].total).toBe(7000);
    expect(report.supplierDistribution[1].count).toBe(1);

    // Evolution Check
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].total).toBe(15000);
    expect(report.evolution[0].count).toBe(3);
  });

  it("should handle empty or null metrics gracefully without division by zero", async () => {
    // Current period metrics (zero/null)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: null, idCount: 0 }]) as any,
    );

    // Current period vouchers (empty)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getPurchaseReport({
      startDate: new Date("2026-06-15T03:00:00Z"),
      endDate: new Date("2026-06-15T23:59:59Z"),
      groupBy: "day",
    });

    expect(report.totalPurchases.current).toBe(0);
    expect(report.voucherCount.current).toBe(0);
    expect(report.averageVoucher.current).toBe(0);
    expect(report.totalPurchases.change).toBe(0);
    expect(report.voucherCount.change).toBe(0);
    expect(report.averageVoucher.change).toBe(0);
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].total).toBe(0);
    expect(report.evolution[0].count).toBe(0);
    expect(report.supplierDistribution).toHaveLength(0);
  });

  it("should correctly handle monthly grouping and bucket initialization", async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 12000, idCount: 3 }]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          id: "v1",
          supplierId: "sup-a",
          totalAmount: 12000,
          date: "2026-02-15T10:00:00.000Z",
          supplierName: "Supplier A",
        },
      ]) as any,
    );

    const report = await getPurchaseReport({
      startDate: new Date("2026-01-01T03:00:00Z"),
      endDate: new Date("2026-03-31T23:59:59Z"),
      groupBy: "month",
    });

    expect(report.evolution).toHaveLength(3);
    expect(report.evolution[0].label).toBe("Ene");
    expect(report.evolution[1].label).toBe("Feb");
    expect(report.evolution[2].label).toBe("Mar");

    // Feb should have total 12000 and count 1
    const feb = report.evolution.find((e) => e.label === "Feb");
    expect(feb?.total).toBe(12000);
    expect(feb?.count).toBe(1);
  });

  it("should correctly handle hourly grouping and bucket initialization", async () => {
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 100, idCount: 1 }]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          id: "v1",
          supplierId: "sup-a",
          totalAmount: 100,
          date: "2026-06-15T04:30:00.000Z", // 01:30 ARG
          supplierName: "Supplier A",
        },
      ]) as any,
    );

    const report = await getPurchaseReport({
      startDate: new Date("2026-06-15T03:00:00Z"), // 00:00 ARG
      endDate: new Date("2026-06-15T05:59:59Z"), // 02:59 ARG
      groupBy: "hour",
    });

    expect(report.evolution).toHaveLength(3);
    expect(report.evolution[0].label).toBe("00:00");
    expect(report.evolution[1].label).toBe("01:00");
    expect(report.evolution[2].label).toBe("02:00");

    const h1 = report.evolution.find((e) => e.label === "01:00");
    expect(h1?.total).toBe(100);
    expect(h1?.count).toBe(1);
  });
});
