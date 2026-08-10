import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFinanceReport } from "../../lib/services/financeReportService";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      cashMovement: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe("financeReportService", () => {
  beforeEach(() => {
    vi.mocked(db.query.cashMovement.findMany).mockReset();
  });

  it("should calculate finance metrics correctly for current and previous periods", async () => {
    const mockCurrentMovements = [
      { type: "INCOME", amount: "1000", method: "CASH", createdAt: "2026-06-15T15:00:00.000Z", reason: null },
      { type: "INCOME", amount: "500", method: "TRANSFER", createdAt: "2026-06-15T16:00:00.000Z", reason: null },
      { type: "EXPENSE", amount: "200", method: "CASH", createdAt: "2026-06-15T17:00:00.000Z", reason: null },
      { type: "PURCHASE_VOUCHER", amount: "300", method: "TRANSFER", createdAt: "2026-06-15T18:00:00.000Z", reason: null },
      { type: "ADJUSTMENT", amount: "100", method: "CASH", createdAt: "2026-06-15T19:00:00.000Z", reason: "Sobrante de caja" },
      { type: "ADJUSTMENT", amount: "50", method: "TRANSFER", createdAt: "2026-06-15T20:00:00.000Z", reason: "Faltante de caja" },
    ];

    const mockPreviousMovements = [
      { type: "INCOME", amount: "800", method: "CASH", createdAt: "2026-06-14T15:00:00.000Z", reason: null },
      { type: "EXPENSE", amount: "100", method: "CASH", createdAt: "2026-06-14T17:00:00.000Z", reason: null },
    ];

    // db.query.cashMovement.findMany is called 3 times in getFinanceReport:
    // 1. in getFinancePeriodMetrics for current period
    // 2. in getFinancePeriodMetrics for previous period
    // 3. in getFinanceReport for evolution/methodDistribution
    vi.mocked(db.query.cashMovement.findMany)
      .mockResolvedValueOnce(mockCurrentMovements as any)
      .mockResolvedValueOnce(mockPreviousMovements as any)
      .mockResolvedValueOnce(mockCurrentMovements as any);

    const report = await getFinanceReport({
      startDate: new Date("2026-06-15T03:00:00Z"), // 00:00 ARG
      endDate: new Date("2026-06-15T23:59:59Z"),
      comparisonStartDate: new Date("2026-06-14T03:00:00Z"),
      comparisonEndDate: new Date("2026-06-14T23:59:59Z"),
      groupBy: "day",
    });

    // Current period metrics calculations:
    // Income: 1000 (INCOME) + 500 (INCOME) + 100 (ADJUSTMENT Sobrante) = 1600
    // Expense: 200 (EXPENSE) + 300 (PURCHASE_VOUCHER) + 50 (ADJUSTMENT Faltante) = 550
    // Net Flow: 1600 - 550 = 1050
    expect(report.totalIncome.current).toBe(1600);
    expect(report.totalExpense.current).toBe(550);
    expect(report.netFlow.current).toBe(1050);

    // Previous period metrics calculations:
    // Income: 800
    // Expense: 100
    // Net Flow: 700
    expect(report.totalIncome.previous).toBe(800);
    expect(report.totalExpense.previous).toBe(100);
    expect(report.netFlow.previous).toBe(700);

    // Percentage changes calculations:
    // Total income change: ((1600 - 800) / 800) * 100 = 100%
    expect(report.totalIncome.change).toBe(100);
    // Total expense change: ((550 - 100) / 100) * 100 = 450%
    expect(report.totalExpense.change).toBe(450);
    // Net flow change: ((1050 - 700) / 700) * 100 = 50%
    expect(report.netFlow.change).toBe(50);

    // Payment method distribution check:
    // CASH:
    //   Income: 1000 (INCOME) + 100 (ADJUSTMENT Sobrante) = 1100
    //   Expense: 200 (EXPENSE) = 200
    //   Net: 1100 - 200 = 900
    // TRANSFER:
    //   Income: 500 (INCOME) = 500
    //   Expense: 300 (PURCHASE_VOUCHER) + 50 (ADJUSTMENT Faltante) = 350
    //   Net: 500 - 350 = 150
    // Method list should be sorted by net descending: [CASH, TRANSFER]
    expect(report.methodDistribution).toHaveLength(2);
    expect(report.methodDistribution[0]).toEqual({
      method: "CASH",
      income: 1100,
      expense: 200,
      net: 900,
    });
    expect(report.methodDistribution[1]).toEqual({
      method: "TRANSFER",
      income: 500,
      expense: 350,
      net: 150,
    });

    // Evolution verification
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].income).toBe(1600);
    expect(report.evolution[0].expense).toBe(550);
  });

  it("should handle zero or null values gracefully without division by zero", async () => {
    vi.mocked(db.query.cashMovement.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const report = await getFinanceReport({
      startDate: new Date("2026-06-15T03:00:00Z"),
      endDate: new Date("2026-06-15T23:59:59Z"),
      groupBy: "day",
    });

    expect(report.totalIncome.current).toBe(0);
    expect(report.totalIncome.previous).toBe(0);
    expect(report.totalIncome.change).toBe(0);

    expect(report.totalExpense.current).toBe(0);
    expect(report.totalExpense.previous).toBe(0);
    expect(report.totalExpense.change).toBe(0);

    expect(report.netFlow.current).toBe(0);
    expect(report.netFlow.previous).toBe(0);
    expect(report.netFlow.change).toBe(0);

    expect(report.methodDistribution).toHaveLength(0);
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].income).toBe(0);
    expect(report.evolution[0].expense).toBe(0);
  });

  it("should correctly initialize buckets and labels for monthly groupBy", async () => {
    vi.mocked(db.query.cashMovement.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const report = await getFinanceReport({
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
    vi.mocked(db.query.cashMovement.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const report = await getFinanceReport({
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

  it("should correctly align with America/Argentina/Buenos_Aires (UTC-3) timezone", async () => {
    // Movement at 2026-06-15T02:00:00.000Z is 2026-06-14 23:00 in Argentina.
    // So grouping by day, it should be bucketed under "14/06" (the day before).
    const mockMovements = [
      { type: "INCOME", amount: "1000", method: "CASH", createdAt: "2026-06-15T02:00:00.000Z", reason: null },
    ];

    vi.mocked(db.query.cashMovement.findMany)
      .mockResolvedValueOnce(mockMovements as any)
      .mockResolvedValueOnce(mockMovements as any);

    const report = await getFinanceReport({
      startDate: new Date("2026-06-14T03:00:00Z"), // 2026-06-14 00:00 ARG
      endDate: new Date("2026-06-15T23:59:59Z"),
      groupBy: "day",
    });

    // The start range has 2 days: 14/06 and 15/06.
    expect(report.evolution).toHaveLength(2);
    expect(report.evolution[0].label).toBe("14/06");
    expect(report.evolution[1].label).toBe("15/06");

    // Income must land under 14/06, and 15/06 has 0.
    expect(report.evolution[0].income).toBe(1000);
    expect(report.evolution[1].income).toBe(0);
  });
});
