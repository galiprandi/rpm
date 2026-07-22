import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOverviewReport } from '../../lib/services/overviewReportService';
import { db } from '@/lib/db';

// Helper to create a chainable that resolves to a specific value
const { createChainable } = vi.hoisted(() => {
  function createChainable(resolveValue: unknown = []): any {
    const target = () => {};
    return new Proxy(target, {
      get(_t: any, prop: string) {
        if (prop === 'then') {
          return (resolve: any, reject: any) =>
            Promise.resolve(resolveValue).then(resolve, reject);
        }
        if (prop === 'catch') {
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

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => createChainable()),
  },
}));

describe('overviewReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should correctly calculate current and previous period metrics and stock status', async () => {
    // Current period metrics (6 db.select calls in order):
    // 1. WO revenue: db.select({ totalSum: sum(workOrder.total) }).from(workOrder).where(...)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 5000 }]) as any,
    );
    // 2. DS revenue: db.select({ totalSum: sum(directSale.total) }).from(directSale).where(...)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 1500 }]) as any,
    );
    // 3. WO items for cost: db.select({...}).from(workOrderItem).innerJoin().leftJoin().where(...)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { productId: 'p1', quantity: 2, productCostPrice: 1000, serviceBaseCost: null },
        { productId: null, quantity: 1, productCostPrice: null, serviceBaseCost: 500 },
      ]) as any,
    );
    // 4. DS items for cost: db.select({...}).from(directSaleItem).innerJoin().leftJoin().where(...)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { productId: 'p2', quantity: 3, productCostPrice: 500, serviceBaseCost: null },
      ]) as any,
    );
    // 5. Completed orders count: db.select({ count: count(workOrder.id) }).from(workOrder).where(...)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ count: 10 }]) as any,
    );
    // 6. New customers count: db.select({ count: count(customer.id) }).from(customer).where(...)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ count: 4 }]) as any,
    );

    // Previous period metrics (6 db.select calls in same order):
    // 7. WO revenue (previous)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 2500 }]) as any,
    );
    // 8. DS revenue (previous)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 500 }]) as any,
    );
    // 9. WO items (previous)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { productId: 'p1', quantity: 1, productCostPrice: 1000, serviceBaseCost: null },
      ]) as any,
    );
    // 10. DS items (previous)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([]) as any,
    );
    // 11. Completed orders (previous)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ count: 5 }]) as any,
    );
    // 12. New customers (previous)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ count: 2 }]) as any,
    );

    // Stock status (2 db.select calls via Promise.all):
    // 13. Stock products: db.select({ stock, costPrice }).from(product).where(...)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { stock: 10, costPrice: 100 },
        { stock: 5, costPrice: 200 },
      ]) as any,
    );
    // 14. Low stock count: db.select({ count }).from(product).where(...)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ count: 3 }]) as any,
    );

    const report = await getOverviewReport({
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      comparisonStartDate: new Date('2024-01-14T00:00:00Z'),
      comparisonEndDate: new Date('2024-01-14T23:59:59Z'),
    });

    // Verify Revenue Metrics
    expect(report.revenue.current).toBe(6500);
    expect(report.revenue.previous).toBe(3000);
    expect(report.revenue.change).toBeCloseTo(116.67, 1); // ((6500 - 3000) / 3000) * 100 = 116.67%

    // Verify Profit Metrics
    expect(report.estimatedProfit.current).toBe(2500);
    expect(report.estimatedProfit.previous).toBe(2000);
    expect(report.estimatedProfit.change).toBeCloseTo(25, 1); // ((2500 - 2000) / 2000) * 100 = 25%

    // Verify Completed Orders Metrics
    expect(report.completedOrders.current).toBe(10);
    expect(report.completedOrders.previous).toBe(5);
    expect(report.completedOrders.change).toBe(100); // ((10 - 5) / 5) * 100 = 100%

    // Verify New Customers Metrics
    expect(report.newCustomers.current).toBe(4);
    expect(report.newCustomers.previous).toBe(2);
    expect(report.newCustomers.change).toBe(100); // ((4 - 2) / 2) * 100 = 100%

    // Verify Stock Status
    expect(report.stockStatus.totalValue).toBe(2000);
    expect(report.stockStatus.lowStockCount).toBe(3);
  });

  it('should handle zero previous period metrics cleanly without dividing by zero', async () => {
    // Current period metrics
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 100 }]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: 50 }]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ count: 3 }]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ count: 1 }]) as any,
    );

    // Previous period metrics (all zero/null)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: null }]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ totalSum: null }]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ count: 0 }]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ count: 0 }]) as any,
    );

    // Stock Status
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([]) as any,
    );
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([{ count: 0 }]) as any,
    );

    const report = await getOverviewReport({
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-15T23:59:59Z'),
      comparisonStartDate: new Date('2024-01-14T00:00:00Z'),
      comparisonEndDate: new Date('2024-01-14T23:59:59Z'),
    });

    expect(report.revenue.current).toBe(150);
    expect(report.revenue.previous).toBe(0);
    expect(report.revenue.change).toBe(100); // 100% since prev was 0 and current > 0

    expect(report.completedOrders.current).toBe(3);
    expect(report.completedOrders.previous).toBe(0);
    expect(report.completedOrders.change).toBe(100);
  });
});
