import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFinanceReport } from './financeReportService';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      cashMovement: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe('financeReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate total income and expenses correctly', async () => {
    const mockMovements = [
      { type: 'INCOME', amount: '1000', method: 'CASH', createdAt: '2024-01-01 10:00:00.000' },
      { type: 'INCOME', amount: '500', method: 'TRANSFER', createdAt: '2024-01-01 11:00:00.000' },
      { type: 'EXPENSE', amount: '200', method: 'CASH', createdAt: '2024-01-01 12:00:00.000' },
      { type: 'PURCHASE_VOUCHER', amount: '300', method: 'PURCHASE', createdAt: '2024-01-01 13:00:00.000' },
    ];

    vi.mocked(db.query.cashMovement.findMany).mockResolvedValue(mockMovements as any);

    const report = await getFinanceReport({
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-01T23:59:59Z'),
    });

    expect(report.totalIncome.current).toBe(1500);
    expect(report.totalExpense.current).toBe(500);
    expect(report.netFlow.current).toBe(1000);

    expect(report.methodDistribution).toContainEqual({
      method: 'CASH',
      income: 1000,
      expense: 200,
      net: 800,
    });
  });

  it('should handle period comparison', async () => {
    // Mock current period
    vi.mocked(db.query.cashMovement.findMany)
      .mockResolvedValueOnce([
        { type: 'INCOME', amount: '100', method: 'CASH', createdAt: new Date().toISOString() }
      ] as any) // for current metrics
      .mockResolvedValueOnce([
        { type: 'INCOME', amount: '50', method: 'CASH', createdAt: new Date().toISOString() }
      ] as any) // for previous metrics
      .mockResolvedValueOnce([
        { type: 'INCOME', amount: '100', method: 'CASH', createdAt: new Date().toISOString() }
      ] as any); // for evolution

    const report = await getFinanceReport({
      startDate: new Date(),
      endDate: new Date(),
      comparisonStartDate: new Date(),
      comparisonEndDate: new Date(),
    });

    expect(report.totalIncome.current).toBe(100);
    expect(report.totalIncome.previous).toBe(50);
    expect(report.totalIncome.change).toBe(100); // (100-50)/50 * 100
  });
});
