import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDailyOperations } from './dashboardService';
import { prisma } from '@/lib/prisma';
import { getArgentinaStartOfDay } from '@/lib/utils/date';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    cash_movement: {
      findMany: vi.fn(),
    },
    payment_method: {
      findMany: vi.fn(),
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
  },
}));

describe('Dashboard Service - getDailyOperations', () => {
  const mockDate = new Date('2026-03-20T12:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return enriched daily operations', async () => {
    const mockMovements = [
      {
        id: '1',
        type: 'INCOME',
        amount: 1000,
        method: 'CASH',
        referenceType: 'work_order_payment',
        referenceId: 'pay1',
        createdAt: new Date('2026-03-20T10:00:00Z'),
        createdBy: 'user1',
      },
      {
        id: '2',
        type: 'EXPENSE',
        amount: 500,
        method: 'CASH',
        reason: 'Limpieza',
        createdAt: new Date('2026-03-20T11:00:00Z'),
        createdBy: 'user1',
      }
    ];

    const mockPaymentMethods = [
      { code: 'CASH', name: 'Efectivo' }
    ];

    (prisma.cash_movement.findMany as any).mockResolvedValue(mockMovements);
    (prisma.payment_method.findMany as any).mockResolvedValue(mockPaymentMethods);
    (prisma.payment.findUnique as any).mockResolvedValue({
      id: 'pay1',
      workOrder: {
        id: 'wo1',
        customer: { id: 'cust1', name: 'Juan Perez' }
      }
    });

    const result = await getDailyOperations(mockDate);

    expect(result.summary.totalIncome).toBe(1000);
    expect(result.summary.totalExpense).toBe(500);
    expect(result.summary.netAmount).toBe(500);
    expect(result.movements).toHaveLength(2);
    expect(result.movements[0].customer?.name).toBe('Juan Perez');
    expect(result.movements[0].methodName).toBe('Efectivo');
  });

  it('should handle direct sale payments', async () => {
    const mockMovements = [
      {
        id: '3',
        type: 'INCOME',
        amount: 2000,
        method: 'TRANSFER',
        referenceType: 'direct_sale_payment',
        referenceId: 'dsp1',
        createdAt: new Date('2026-03-20T14:00:00Z'),
        createdBy: 'user1',
      }
    ];

    (prisma.cash_movement.findMany as any).mockResolvedValue(mockMovements);
    (prisma.payment_method.findMany as any).mockResolvedValue([{ code: 'TRANSFER', name: 'Transferencia' }]);
    (prisma.direct_sale_payment.findUnique as any).mockResolvedValue({
      directSale: {
        id: 'ds1',
        customerName: 'Consumidor Final',
        customer: null
      }
    });

    const result = await getDailyOperations(mockDate);

    expect(result.movements[0].customer?.name).toBe('Consumidor Final');
    expect(result.movements[0].relatedType).toBe('direct_sale');
  });
});
