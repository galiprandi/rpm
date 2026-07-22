/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dashboardService from './dashboardService';
import { db } from '@/lib/db';
import { getArgentinaNow } from '@/lib/utils/date';

// vi.hoisted runs before vi.mock factory
const { createChainable, mockFns } = vi.hoisted(() => {
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

  return {
    createChainable,
    mockFns: {
      cashMovementFindMany: vi.fn(),
      directSalePaymentFindFirst: vi.fn(),
      customerFindFirst: vi.fn(),
      paymentFindFirst: vi.fn(),
    },
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => createChainable([])),
    query: {
      cashMovement: { findMany: mockFns.cashMovementFindMany },
      directSalePayment: { findFirst: mockFns.directSalePaymentFindFirst },
      customer: { findFirst: mockFns.customerFindFirst },
      payment: { findFirst: mockFns.paymentFindFirst },
    },
  },
}));

describe('Daily Operations Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // db.select returns empty array for payment methods by default
    vi.mocked(db.select).mockReturnValue(createChainable([]));
  });

  it('should fetch and enrich daily operations', async () => {
    const mockDate = getArgentinaNow();

    const mockMovements = [
      {
        id: '1',
        type: 'INCOME',
        amount: '1000',
        method: 'CASH',
        referenceId: 'sale-1',
        referenceType: 'direct_sale_payment',
        createdAt: mockDate.toISOString(),
        createdBy: 'user-1',
      },
    ];

    const mockSalePayment = {
      id: 'sale-1',
      directSale: {
        id: 'ds-1',
        customer: { id: 'c-1', name: 'John Doe' },
      },
    };

    mockFns.cashMovementFindMany.mockResolvedValue(mockMovements as any);
    mockFns.directSalePaymentFindFirst.mockResolvedValue(mockSalePayment as any);

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
        amount: '500',
        method: 'TRANSFER',
        referenceId: 'cust-1',
        referenceType: 'customer_payment',
        createdAt: mockDate.toISOString(),
        createdBy: 'user-1',
      },
    ];

    const mockCustomer = { id: 'cust-1', name: 'Jane Smith' };

    mockFns.cashMovementFindMany.mockResolvedValue(mockMovements as any);
    mockFns.customerFindFirst.mockResolvedValue(mockCustomer as any);

    const result = await dashboardService.getDailyOperations(mockDate);

    expect(result.movements[0].customer?.name).toBe('Jane Smith');
    expect(result.summary.totalIncome).toBe(500);
  });
});
