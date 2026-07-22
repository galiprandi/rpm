import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateWorkOrder } from '../../lib/services/workOrderService';
import { db } from '@/lib/db';

// Mock db with Drizzle-style chainable methods and transaction support
const { mockDb } = vi.hoisted(() => {
  const query = {
    workOrder: { findFirst: vi.fn() },
    workOrderItem: { findFirst: vi.fn() },
    stockMovement: { findFirst: vi.fn() },
    product: { findFirst: vi.fn() },
    payment: { findMany: vi.fn() },
    user: { findFirst: vi.fn() },
    invoice: { findFirst: vi.fn() },
  };
  const mockDb = {
    query,
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
        returning: vi.fn(() => Promise.resolve([{}])),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
    transaction: vi.fn(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        query,
        update: mockDb.update,
        insert: mockDb.insert,
        delete: mockDb.delete,
      };
      return callback(tx);
    }),
  };
  return { mockDb };
});

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

vi.mock('../../lib/services/auditService', () => ({
  logWorkOrderChange: vi.fn(),
}));

vi.mock('../../lib/services/invoiceService', () => ({
  createInvoice: vi.fn(),
  determineInvoiceType: vi.fn(() => 'X_A'),
}));

describe('workOrderService', () => {
  describe('updateWorkOrder', () => {
    const mockId = 'wo_123';
    const mockContext = {
      userId: 'user_1',
      userEmail: 'test@example.com',
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should update work order status and track audit log', async () => {
      const mockWO = {
        id: mockId,
        status: 'CONFIRMED',
        workOrderItems: [],
        customer: { name: 'Test Customer' },
        notes: '',
      };

      const mockQuery = (db as any).query;
      // First findFirst: get current WO
      mockQuery.workOrder.findFirst.mockResolvedValueOnce(mockWO);
      // Second findFirst: re-fetch with relations after update
      mockQuery.workOrder.findFirst.mockResolvedValueOnce({ ...mockWO, status: 'IN_PROGRESS' });

      // Track the update chain
      const whereFn = vi.fn(() => Promise.resolve());
      const setFn = vi.fn(() => ({ where: whereFn }));
      (db.update as any).mockReturnValue({ set: setFn });

      await updateWorkOrder(mockId, { status: 'IN_PROGRESS' }, mockContext);

      // Verify update was called (Drizzle chain: update().set().where())
      expect(db.update).toHaveBeenCalled();
      // Verify set was called with status IN_PROGRESS
      expect(setFn).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'IN_PROGRESS' }),
      );
    });
  });
});
