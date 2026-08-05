import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProfitabilityReport } from '../../lib/services/profitabilityReportService';
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

describe('profitabilityReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should correctly calculate profitability metrics for current and previous periods', async () => {
    // Current period (Calls 1-4)
    // 1. WO sales sum: 10000
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalSum: 10000 }]) as any);
    // 2. DS sales sum: 5000
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalSum: 5000 }]) as any);
    // 3. WO items for cost: 1 product (cost 3000 * 2) = 6000
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { productId: 'p1', quantity: 2, productCostPrice: 3000, serviceBaseCost: null },
      ]) as any
    );
    // 4. DS items for cost: 1 service (cost 1000 * 3) = 3000
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { productId: null, quantity: 3, productCostPrice: null, serviceBaseCost: 1000 },
      ]) as any
    );

    // Previous period (Calls 5-8)
    // 5. WO sales sum (prev): 8000
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalSum: 8000 }]) as any);
    // 6. DS sales sum (prev): 2000
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalSum: 2000 }]) as any);
    // 7. WO items for cost (prev): 1 product (cost 2000 * 2) = 4000
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { productId: 'p1', quantity: 2, productCostPrice: 2000, serviceBaseCost: null },
      ]) as any
    );
    // 8. DS items for cost (prev): 1 service (cost 500 * 2) = 1000
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        { productId: null, quantity: 2, productCostPrice: null, serviceBaseCost: 500 },
      ]) as any
    );

    // Detailed current period items for distributions/evolution (Calls 9-10)
    // 9. Detailed WO items (Revenue 11000, cost 6000)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          subtotal: 11000,
          productId: 'p1',
          serviceId: null,
          quantity: 2,
          productName: 'Super LED',
          productCostPrice: 3000,
          productCategoryId: 'cat-1',
          categoryName: 'Iluminación',
          serviceName: null,
          serviceBaseCost: null,
          technicianId: 'tech-1',
          technicianName: 'Carlos Gómez',
          completedAt: '2024-06-15T15:00:00.000Z', // 12:00 in ARG timezone (UTC-3)
        },
      ]) as any
    );
    // 10. Detailed DS items (Revenue 4000, cost 3000)
    vi.mocked(db.select).mockReturnValueOnce(
      createChainable([
        {
          totalPrice: 4000,
          productId: null,
          serviceId: 's1',
          quantity: 3,
          itemName: 'Detailing Service',
          productName: null,
          productCostPrice: null,
          productCategoryId: null,
          categoryName: null,
          serviceName: 'Detailing',
          serviceBaseCost: 1000,
          createdAt: '2024-06-15T17:00:00.000Z', // 14:00 in ARG timezone (UTC-3)
        },
      ]) as any
    );

    const report = await getProfitabilityReport({
      startDate: new Date('2024-06-01T03:00:00Z'), // 00:00 ARG
      endDate: new Date('2024-06-30T23:59:59Z'),
      comparisonStartDate: new Date('2024-05-01T03:00:00Z'), // 00:00 ARG
      comparisonEndDate: new Date('2024-05-31T23:59:59Z'),
      groupBy: 'day',
    });

    // 1. Current Period Calculations
    // Revenue = 10000 (WO) + 5000 (DS) = 15000
    expect(report.revenue.current).toBe(15000);
    // Cost = 6000 (WO) + 3000 (DS) = 9000
    expect(report.totalCost.current).toBe(9000);
    // Gross Profit = 15000 - 9000 = 6000
    expect(report.grossProfit.current).toBe(6000);
    // Gross Margin = (6000 / 15000) * 100 = 40%
    expect(report.grossMargin.current).toBe(40);

    // 2. Previous Period Calculations
    // Revenue = 8000 (WO) + 2000 (DS) = 10000
    expect(report.revenue.previous).toBe(10000);
    // Cost = 4000 (WO) + 1000 (DS) = 5000
    expect(report.totalCost.previous).toBe(5000);
    // Gross Profit = 10000 - 5000 = 5000
    expect(report.grossProfit.previous).toBe(5000);
    // Gross Margin = (5000 / 10000) * 100 = 50%
    expect(report.grossMargin.previous).toBe(50);

    // 3. Trends / Changes
    // Revenue Change: ((15000 - 10000) / 10000) * 100 = 50%
    expect(report.revenue.change).toBe(50);
    // Cost Change: ((9000 - 5000) / 5000) * 100 = 80%
    expect(report.totalCost.change).toBe(80);
    // Gross Profit Change: ((6000 - 5000) / 5000) * 100 = 20%
    expect(report.grossProfit.change).toBe(20);
    // Gross Margin Change: 40 - 50 = -10 (p.p. absolute difference)
    expect(report.grossMargin.change).toBe(-10);

    // 4. Category Profitability Breakdown
    // Category 1: 'cat-1' (Iluminación) -> Revenue: 11000, Profit: 11000 - 6000 = 5000, Margin: (5000 / 11000) * 100 = 45.45%
    const cat1 = report.categoryProfitability.find((c) => c.id === 'cat-1');
    expect(cat1).toBeDefined();
    expect(cat1?.name).toBe('Iluminación');
    expect(cat1?.revenue).toBe(11000);
    expect(cat1?.profit).toBe(5000);
    expect(cat1?.margin).toBeCloseTo(45.45, 1);

    // Category 2: services-cat -> Revenue: 4000, Profit: 4000 - 3000 = 1000, Margin: (1000 / 4000) * 100 = 25%
    const catServices = report.categoryProfitability.find((c) => c.id === 'services-cat');
    expect(catServices).toBeDefined();
    expect(catServices?.name).toBe('Servicios (Venta Directa)');
    expect(catServices?.revenue).toBe(4000);
    expect(catServices?.profit).toBe(1000);
    expect(catServices?.margin).toBe(25);

    // 5. Top Profitable Items
    expect(report.topProfitableItems).toHaveLength(2);
    expect(report.topProfitableItems[0].name).toBe('Super LED');
    expect(report.topProfitableItems[0].profit).toBe(5000);
    expect(report.topProfitableItems[0].margin).toBeCloseTo(45.45, 1);
    expect(report.topProfitableItems[0].quantity).toBe(2);

    expect(report.topProfitableItems[1].name).toBe('Detailing');
    expect(report.topProfitableItems[1].profit).toBe(1000);
    expect(report.topProfitableItems[1].margin).toBe(25);
    expect(report.topProfitableItems[1].quantity).toBe(3);

    // 6. Technician Profitability
    expect(report.technicianProfitability).toHaveLength(1);
    expect(report.technicianProfitability[0].technicianName).toBe('Carlos Gómez');
    expect(report.technicianProfitability[0].revenue).toBe(11000);
    expect(report.technicianProfitability[0].profit).toBe(5000);
    expect(report.technicianProfitability[0].margin).toBeCloseTo(45.45, 1);
  });

  it('should handle zero or null values gracefully without dividing by zero', async () => {
    // Current period (Calls 1-4)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalSum: null }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalSum: null }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Detailed current period items (Calls 5-6)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getProfitabilityReport({
      startDate: new Date('2024-06-01T03:00:00Z'),
      endDate: new Date('2024-06-30T23:59:59Z'),
      groupBy: 'day',
    });

    expect(report.revenue.current).toBe(0);
    expect(report.totalCost.current).toBe(0);
    expect(report.grossProfit.current).toBe(0);
    expect(report.grossMargin.current).toBe(0);
    expect(report.revenue.change).toBe(0);
    expect(report.grossMargin.change).toBe(0);
    expect(report.categoryProfitability).toHaveLength(0);
    expect(report.topProfitableItems).toHaveLength(0);
    expect(report.technicianProfitability).toHaveLength(0);
  });

  it('should correctly initialize buckets and labels for monthly groupBy', async () => {
    // Mock minimal selects for 1 current month (Calls 1-4)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalSum: 100 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalSum: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Mock detailed current period items (Calls 5-6)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getProfitabilityReport({
      startDate: new Date('2024-01-01T03:00:00Z'), // 00:00 Jan 1st ARG
      endDate: new Date('2024-03-31T23:59:59Z'),
      groupBy: 'month',
    });

    // Jan, Feb, Mar 2024 buckets should exist
    expect(report.evolution).toHaveLength(3);
    expect(report.evolution[0].label).toBe('Ene');
    expect(report.evolution[1].label).toBe('Feb');
    expect(report.evolution[2].label).toBe('Mar');
  });

  it('should correctly initialize buckets and labels for hourly groupBy', async () => {
    // Mock minimal selects (Calls 1-4)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalSum: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([{ totalSum: 0 }]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    // Mock detailed current period items (Calls 5-6)
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);
    vi.mocked(db.select).mockReturnValueOnce(createChainable([]) as any);

    const report = await getProfitabilityReport({
      startDate: new Date('2024-06-01T03:00:00Z'), // 00:00 ARG
      endDate: new Date('2024-06-01T06:59:59Z'), // 03:59 ARG
      groupBy: 'hour',
    });

    // 00:00 to 03:00 buckets should exist
    expect(report.evolution).toHaveLength(4);
    expect(report.evolution[0].label).toBe('00:00');
    expect(report.evolution[1].label).toBe('01:00');
    expect(report.evolution[2].label).toBe('02:00');
    expect(report.evolution[3].label).toBe('03:00');
  });
});
