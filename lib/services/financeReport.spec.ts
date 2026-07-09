import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFinanceReport } from './financeReportService';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cash_movement: {
      findMany: vi.fn(),
    },
  },
}));

describe('financeReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate total income and expenses correctly', async () => {
    const mockMovements = [
      { type: 'INCOME', amount: 1000, method: 'CASH', createdAt: new Date('2024-01-01T10:00:00Z') },
      { type: 'INCOME', amount: 500, method: 'TRANSFER', createdAt: new Date('2024-01-01T11:00:00Z') },
      { type: 'EXPENSE', amount: 200, method: 'CASH', createdAt: new Date('2024-01-01T12:00:00Z') },
      { type: 'PURCHASE_VOUCHER', amount: 300, method: 'PURCHASE', createdAt: new Date('2024-01-01T13:00:00Z') },
    ];

    vi.mocked(prisma.cash_movement.findMany).mockResolvedValue(mockMovements as any);

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
    vi.mocked(prisma.cash_movement.findMany)
      .mockResolvedValueOnce([
        { type: 'INCOME', amount: 100, method: 'CASH', createdAt: new Date() }
      ] as any) // for current metrics
      .mockResolvedValueOnce([
        { type: 'INCOME', amount: 50, method: 'CASH', createdAt: new Date() }
      ] as any) // for previous metrics
      .mockResolvedValueOnce([
        { type: 'INCOME', amount: 100, method: 'CASH', createdAt: new Date() }
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
