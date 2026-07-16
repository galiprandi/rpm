import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOverviewReport } from '../../lib/services/overviewReportService';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    work_order: {
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    direct_sale: {
      aggregate: vi.fn(),
    },
    work_order_item: {
      findMany: vi.fn(),
    },
    direct_sale_item: {
      findMany: vi.fn(),
    },
    customer: {
      count: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      fields: {
        minStock: 'minStock',
      },
    },
  },
}));

describe('overviewReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should correctly calculate current and previous period metrics and stock status', async () => {
    // 1. Mock aggregations for current period (aggregate of work_order and direct_sale)
    vi.mocked(prisma.work_order.aggregate)
      .mockResolvedValueOnce({ _sum: { total: 5000 } } as any) // current work order total
      .mockResolvedValueOnce({ _sum: { total: 2500 } } as any); // previous work order total

    vi.mocked(prisma.direct_sale.aggregate)
      .mockResolvedValueOnce({ _sum: { total: 1500 } } as any) // current direct sale total
      .mockResolvedValueOnce({ _sum: { total: 500 } } as any); // previous direct sale total

    // 2. Mock item lists for cost calculations (current vs previous)
    vi.mocked(prisma.work_order_item.findMany)
      .mockResolvedValueOnce([
        { productId: 'p1', quantity: 2, product: { costPrice: 1000 }, service: null },
        { productId: null, serviceId: 's1', quantity: 1, product: null, service: { baseCost: 500 } },
      ] as any) // current WO items (cost = 2*1000 + 1*500 = 2500)
      .mockResolvedValueOnce([
        { productId: 'p1', quantity: 1, product: { costPrice: 1000 }, service: null },
      ] as any); // previous WO items (cost = 1*1000 = 1000)

    vi.mocked(prisma.direct_sale_item.findMany)
      .mockResolvedValueOnce([
        { productId: 'p2', quantity: 3, product: { costPrice: 500 }, service: null },
      ] as any) // current DS items (cost = 3*500 = 1500)
      .mockResolvedValueOnce([]); // previous DS items (cost = 0)

    // Current metrics summary:
    // Revenue = 5000 (WO) + 1500 (DS) = 6500
    // Cost = 2500 (WO items) + 1500 (DS items) = 4000
    // Profit = 6500 - 4000 = 2500

    // Previous metrics summary:
    // Revenue = 2500 (WO) + 500 (DS) = 3000
    // Cost = 1000 (WO items) + 0 (DS items) = 1000
    // Profit = 3000 - 1000 = 2000

    // 3. Mock counts
    vi.mocked(prisma.work_order.count)
      .mockResolvedValueOnce(10) // current completed orders
      .mockResolvedValueOnce(5); // previous completed orders

    vi.mocked(prisma.customer.count)
      .mockResolvedValueOnce(4) // current new customers
      .mockResolvedValueOnce(2); // previous new customers

    // 4. Mock current stock status queries (only called once, current state only)
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { stock: 10, costPrice: 100 },
      { stock: 5, costPrice: 200 },
    ] as any); // total stock value = 10*100 + 5*200 = 2000

    vi.mocked(prisma.product.count).mockResolvedValue(3); // low stock count

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
    vi.mocked(prisma.work_order.aggregate).mockResolvedValueOnce({ _sum: { total: 100 } } as any);
    vi.mocked(prisma.direct_sale.aggregate).mockResolvedValueOnce({ _sum: { total: 50 } } as any);
    vi.mocked(prisma.work_order_item.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.direct_sale_item.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.work_order.count).mockResolvedValueOnce(3);
    vi.mocked(prisma.customer.count).mockResolvedValueOnce(1);

    // Previous period metrics (all zero/null)
    vi.mocked(prisma.work_order.aggregate).mockResolvedValueOnce({ _sum: { total: null } } as any);
    vi.mocked(prisma.direct_sale.aggregate).mockResolvedValueOnce({ _sum: { total: null } } as any);
    vi.mocked(prisma.work_order_item.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.direct_sale_item.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.work_order.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.customer.count).mockResolvedValueOnce(0);

    // Stock Status
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

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
