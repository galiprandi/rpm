/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dashboardService from './dashboardService';
import { prisma } from '@/lib/prisma';
import { getArgentinaNow } from '@/lib/utils/date';

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
    payment: {
      findUnique: vi.fn(),
    },
    direct_sale_payment: {
        findUnique: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
    },
    payment_method: {
      findMany: vi.fn(),
    },
  },
}));

describe('Daily Operations Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.payment_method.findMany).mockResolvedValue([]);
  });

  it('should fetch and enrich daily operations', async () => {
    const mockDate = getArgentinaNow();

    const mockMovements = [
      {
        id: '1',
        type: 'INCOME',
        amount: { toNumber: () => 1000 },
        method: 'CASH',
        referenceId: 'sale-1',
        referenceType: 'direct_sale_payment',
        createdAt: mockDate,
        createdBy: 'user-1',
      },
    ];

    const mockSalePayment = {
      id: 'sale-1',
      directSale: {
          id: 'ds-1',
          customer: { id: 'c-1', name: 'John Doe' }
      },
    };

    vi.mocked(prisma.cash_movement.findMany).mockResolvedValue(mockMovements as any);
    vi.mocked(prisma.direct_sale_payment.findUnique).mockResolvedValue(mockSalePayment as any);

    const result = await dashboardService.getDailyOperations(mockDate);

    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].customer?.name).toBe('John Doe');
    expect(result.summary.totalIncome).toBe(1000);
  });

  it('should handle customer payments correctly', async () => {
    const mockDate = getArgentinaNow();

    const mockMovements = [
      {
        id: '2',
        type: 'INCOME',
        amount: { toNumber: () => 500 },
        method: 'TRANSFER',
        referenceId: 'cust-1',
        referenceType: 'customer_payment',
        createdAt: mockDate,
        createdBy: 'user-1',
      },
    ];

    const mockCustomer = { id: 'cust-1', name: 'Jane Smith' };

    vi.mocked(prisma.cash_movement.findMany).mockResolvedValue(mockMovements as any);
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer as any);

    const result = await dashboardService.getDailyOperations(mockDate);

    expect(result.movements[0].customer?.name).toBe('Jane Smith');
    expect(result.summary.totalIncome).toBe(500);
  });
});
