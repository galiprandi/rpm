import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCustomerReport } from "../../lib/services/customerReportService";
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

describe("customerReportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should correctly calculate customer metrics, recurrence rates, and top customers", async () => {
    // 1-10: Initial parallel queries inside metrics Promise.all
    // 1. getNewCustomersCount(current)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ count: 10 }]) as any);
    // 2. getActiveCustomersMetrics(current) - WO
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ customerId: "cust-1" }, { customerId: "cust-2" }]) as any);
    // 3. getActiveCustomersMetrics(current) - DS
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ customerId: "cust-2" }, { customerId: "cust-3" }]) as any);
    // 4. getRecurrenceMetrics(current) - WO
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ customerId: "cust-1" }, { customerId: "cust-2" }]) as any);
    // 5. getRecurrenceMetrics(current) - DS
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ customerId: "cust-2" }, { customerId: "cust-3" }]) as any);
    // 6. getNewCustomersCount(prev)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ count: 5 }]) as any);
    // 7. getActiveCustomersMetrics(prev) - WO
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ customerId: "cust-1" }]) as any);
    // 8. getActiveCustomersMetrics(prev) - DS
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    // 9. getRecurrenceMetrics(prev) - WO
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ customerId: "cust-1" }]) as any);
    // 10. getRecurrenceMetrics(prev) - DS
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // 11-14: Subsequent count queries executed after activeCustomerIds are resolved
    // 11. getRecurrenceMetrics(current) - WO count selects
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { customerId: "cust-1", count: 2 },
        { customerId: "cust-2", count: 1 },
      ]) as any,
    );
    // 12. getRecurrenceMetrics(current) - DS count selects
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { customerId: "cust-2", count: 1 },
        { customerId: "cust-3", count: 2 },
      ]) as any,
    );
    // 13. getRecurrenceMetrics(prev) - WO count selects
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ customerId: "cust-1", count: 3 }]) as any);
    // 14. getRecurrenceMetrics(prev) - DS count selects
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // 15: New customers evolution list
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { createdAt: "2026-06-15T04:00:00.000Z" }, // 01:00 ARG
        { createdAt: "2026-06-15T18:00:00.000Z" }, // 15:00 ARG
      ]) as any,
    );

    // 16-17: Top Customers Billing (Promise.all - 2 selects)
    // 16. woBilling
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { customerId: "cust-1", totalSum: 8000, idCount: 2, completedAtMax: "2026-06-15T12:00:00.000Z" },
        { customerId: "cust-2", totalSum: 3000, idCount: 1, completedAtMax: "2026-06-15T14:00:00.000Z" },
      ]) as any,
    );
    // 17. dsBilling
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { customerId: "cust-2", totalSum: 2000, idCount: 1, createdAtMax: "2026-06-15T15:00:00.000Z" },
        { customerId: "cust-3", totalSum: 12000, idCount: 2, createdAtMax: "2026-06-15T16:00:00.000Z" },
      ]) as any,
    );

    // 18. Customer names select (for top customers)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { id: "cust-1", name: "Customer One" },
        { id: "cust-2", name: "Customer Two" },
        { id: "cust-3", name: "Customer Three" },
      ]) as any,
    );

    const report = await getCustomerReport({
      startDate: new Date("2026-06-15T03:00:00Z"), // 00:00 ARG
      endDate: new Date("2026-06-15T23:59:59Z"),
      comparisonStartDate: new Date("2026-06-14T03:00:00Z"),
      comparisonEndDate: new Date("2026-06-14T23:59:59Z"),
      groupBy: "day",
    });

    // New Customers: current 10, previous 5, change 100%
    expect(report.newCustomers.current).toBe(10);
    expect(report.newCustomers.previous).toBe(5);
    expect(report.newCustomers.change).toBe(100);

    // Active Customers: cust-1, cust-2, cust-3 -> 3 current; cust-1 -> 1 previous
    expect(report.activeCustomers.current).toBe(3);
    expect(report.activeCustomers.previous).toBe(1);
    expect(report.activeCustomers.change).toBe(200);

    // Recurrence Rate:
    // Current active: cust-1 (wo count 2, ds 0 -> total 2 > 1 -> recur), cust-2 (wo 1, ds 1 -> total 2 > 1 -> recur), cust-3 (wo 0, ds 2 -> total 2 > 1 -> recur)
    // All 3 of 3 active have total count > 1 -> 100%
    expect(report.recurrenceRate.current).toBe(100);
    // Previous active: cust-1 has total count 3 > 1 -> recur. 1 of 1 active -> 100%
    expect(report.recurrenceRate.previous).toBe(100);
    expect(report.recurrenceRate.change).toBe(0);

    // Evolution
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].count).toBe(2);

    // Top Customers:
    // cust-3 total billing: 12000, orders: 2
    // cust-1 total billing: 8000, orders: 2
    // cust-2 total billing: 3000 + 2000 = 5000, orders: 2
    // Sorted by billing descending: cust-3 (12000), cust-1 (8000), cust-2 (5000)
    expect(report.topCustomers).toHaveLength(3);
    expect(report.topCustomers[0].id).toBe("cust-3");
    expect(report.topCustomers[0].name).toBe("Customer Three");
    expect(report.topCustomers[0].totalBilling).toBe(12000);
    expect(report.topCustomers[0].ordersCount).toBe(2);

    expect(report.topCustomers[1].id).toBe("cust-1");
    expect(report.topCustomers[1].name).toBe("Customer One");
    expect(report.topCustomers[1].totalBilling).toBe(8000);
    expect(report.topCustomers[1].ordersCount).toBe(2);

    expect(report.topCustomers[2].id).toBe("cust-2");
    expect(report.topCustomers[2].name).toBe("Customer Two");
    expect(report.topCustomers[2].totalBilling).toBe(5000);
    expect(report.topCustomers[2].ordersCount).toBe(2);
  });

  it("should handle empty or null values gracefully without division by zero", async () => {
    // Current Period Metrics
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ count: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Evolution raw list
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Top Customers Billing
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getCustomerReport({
      startDate: new Date("2026-06-15T03:00:00Z"),
      endDate: new Date("2026-06-15T23:59:59Z"),
      groupBy: "day",
    });

    expect(report.newCustomers.current).toBe(0);
    expect(report.activeCustomers.current).toBe(0);
    expect(report.recurrenceRate.current).toBe(0);
    expect(report.newCustomers.change).toBe(0);
    expect(report.activeCustomers.change).toBe(0);
    expect(report.recurrenceRate.change).toBe(0);
    expect(report.evolution).toHaveLength(1);
    expect(report.evolution[0].count).toBe(0);
    expect(report.topCustomers).toHaveLength(0);
  });

  it("should correctly handle monthly grouping and bucket initialization", async () => {
    // Current Period Metrics
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ count: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Evolution
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Top Customers Billing
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getCustomerReport({
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
    // Current Period Metrics
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ count: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Evolution
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Top Customers Billing
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getCustomerReport({
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
