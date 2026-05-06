import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dashboardService from './dashboardService';
import { prisma } from '@/lib/prisma';
import { getArgentinaDate } from '@/lib/utils/date';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cash_movement: {
      findMany: vi.fn(),
    },
    direct_sale: {
      findUnique: vi.fn(),
    },
    work_order: {
      findUnique: vi.fn(),
    },
    work_order_payment: {
      findUnique: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Daily Operations Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and enrich daily operations', async () => {
    const mockDate = getArgentinaDate();

    const mockMovements = [
      {
        id: '1',
        type: 'INCOME',
        amount: 1000,
        method: 'CASH',
        referenceId: 'sale-1',
        referenceType: 'direct_sale_payment',
        createdAt: mockDate,
      },
    ];

    const mockSale = {
      id: 'sale-1',
      customer: { name: 'John Doe' },
    };

    vi.mocked(prisma.cash_movement.findMany).mockResolvedValue(mockMovements as unknown);
    vi.mocked(prisma.direct_sale.findUnique).mockResolvedValue(mockSale as unknown);

    const result = await dashboardService.getDailyOperations(mockDate);

    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].customerName).toBe('John Doe');
    expect(result.metrics.income).toBe(1000);
  });

  it('should handle customer payments correctly', async () => {
    const mockDate = getArgentinaDate();

    const mockMovements = [
      {
        id: '2',
        type: 'INCOME',
        amount: 500,
        method: 'TRANSFER',
        referenceId: 'cust-1',
        referenceType: 'customer_payment',
        createdAt: mockDate,
      },
    ];

    const mockCustomer = { name: 'Jane Smith' };

    vi.mocked(prisma.cash_movement.findMany).mockResolvedValue(mockMovements as unknown);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as unknown);

    const result = await dashboardService.getDailyOperations(mockDate);

    expect(result.movements[0].customerName).toBe('Jane Smith');
    expect(result.metrics.income).toBe(500);
  });
});
