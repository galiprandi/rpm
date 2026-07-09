import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateWorkOrder } from '../../lib/services/workOrderService';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(prisma)),
    work_order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    stock_movement: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      findFirst: vi.fn(),
    },
    work_order_audit_log: {
      create: vi.fn(),
    }
  },
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
        work_order_item: [],
        customer: { name: 'Test Customer' },
        notes: '',
      };

      (prisma.work_order.findUnique as any).mockResolvedValue(mockWO);
      (prisma.work_order.update as any).mockResolvedValue({ ...mockWO, status: 'IN_PROGRESS' });

      await updateWorkOrder(mockId, { status: 'IN_PROGRESS' }, mockContext);

      expect(prisma.work_order.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockId },
        data: expect.objectContaining({ status: 'IN_PROGRESS' }),
      }));
    });
  });
});
