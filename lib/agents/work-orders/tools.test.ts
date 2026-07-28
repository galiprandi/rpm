import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerWorkOrderPaymentTool } from './tools';
import { db } from '@/lib/db';

const {
  mockDb,
  mockIsCashRegisterOpen,
  mockCreateCashMovement,
  mockAdjustBalanceAtomically,
} = vi.hoisted(() => {
  const query = {
    workOrder: { findFirst: vi.fn() },
    paymentMethod: { findFirst: vi.fn(), findMany: vi.fn() },
  };

  const mockDb = {
    query,
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    transaction: vi.fn(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        query,
        insert: mockDb.insert,
        update: mockDb.update,
      };
      return callback(tx);
    }),
  };

  const mockIsCashRegisterOpen = vi.fn();
  const mockCreateCashMovement = vi.fn();
  const mockAdjustBalanceAtomically = vi.fn();

  return {
    mockDb,
    mockIsCashRegisterOpen,
    mockCreateCashMovement,
    mockAdjustBalanceAtomically,
  };
});

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

vi.mock('@/lib/services/cashMovementService', () => ({
  isCashRegisterOpen: mockIsCashRegisterOpen,
  createCashMovement: mockCreateCashMovement,
}));

vi.mock('@/lib/services/balanceService', () => ({
  adjustBalanceAtomically: mockAdjustBalanceAtomically,
}));

vi.mock('@/lib/cache', () => ({
  invalidateCashStatus: vi.fn(),
}));

describe('registerWorkOrderPaymentTool', () => {
  const mockInput = {
    workOrderId: 'wo-123',
    amount: 500,
    paymentMethod: 'contado',
    notes: 'Pago parcial',
    userId: 'user-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return warning when cash register is closed', async () => {
    mockIsCashRegisterOpen.mockResolvedValueOnce(false);

    const result = await registerWorkOrderPaymentTool.execute(mockInput, {} as any);

    expect(result).toContain('La caja está cerrada');
    expect(mockIsCashRegisterOpen).toHaveBeenCalled();
    expect(mockDb.query.workOrder.findFirst).not.toHaveBeenCalled();
  });

  it('should return warning when work order is not found', async () => {
    mockIsCashRegisterOpen.mockResolvedValueOnce(true);
    mockDb.query.workOrder.findFirst.mockResolvedValueOnce(null);

    const result = await registerWorkOrderPaymentTool.execute(mockInput, {} as any);

    expect(result).toContain('Orden de trabajo no encontrada');
    expect(mockDb.query.workOrder.findFirst).toHaveBeenCalled();
  });

  it('should return warning when payment method is not found', async () => {
    mockIsCashRegisterOpen.mockResolvedValueOnce(true);
    mockDb.query.workOrder.findFirst.mockResolvedValueOnce({
      id: 'wo-123',
      total: '1000.00',
      customerId: 'cust-99',
      status: 'IN_PROGRESS',
      customer: { name: 'Aliprandi' },
      payments: [],
    });
    mockDb.query.paymentMethod.findFirst.mockResolvedValueOnce(null);
    mockDb.query.paymentMethod.findMany.mockResolvedValueOnce([
      { id: 'pm-1', name: 'Tarjeta Visa', isActive: true },
    ]);

    const result = await registerWorkOrderPaymentTool.execute(mockInput, {} as any);

    expect(result).toContain('Método de pago "contado" no encontrado');
    expect(mockDb.query.paymentMethod.findMany).toHaveBeenCalled();
  });

  it('should return warning when payment method is inactive', async () => {
    mockIsCashRegisterOpen.mockResolvedValueOnce(true);
    mockDb.query.workOrder.findFirst.mockResolvedValueOnce({
      id: 'wo-123',
      total: '1000.00',
      customerId: 'cust-99',
      status: 'IN_PROGRESS',
      customer: { name: 'Aliprandi' },
      payments: [],
    });
    mockDb.query.paymentMethod.findFirst.mockResolvedValueOnce({
      id: 'pm-1',
      name: 'Contado',
      code: 'CASH',
      isActive: false,
    });

    const result = await registerWorkOrderPaymentTool.execute(mockInput, {} as any);

    expect(result).toContain('no está activo');
  });

  it('should register partial payment successfully and keep status pending', async () => {
    mockIsCashRegisterOpen.mockResolvedValueOnce(true);
    mockDb.query.workOrder.findFirst.mockResolvedValueOnce({
      id: 'wo-123',
      total: '1000.00',
      customerId: 'cust-99',
      status: 'IN_PROGRESS',
      customer: { name: 'Aliprandi' },
      payments: [],
    });
    mockDb.query.paymentMethod.findFirst.mockResolvedValueOnce({
      id: 'pm-1',
      name: 'Efectivo Contado',
      code: 'CASH',
      isActive: true,
    });

    const result = await registerWorkOrderPaymentTool.execute(mockInput, {} as any);

    expect(result).toContain('Pago registrado exitosamente');
    expect(result).toContain('Pendiente ($500.00 restantes)');
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockCreateCashMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'INCOME',
        amount: 500,
        method: 'CASH',
        reason: 'Pago OT #wo-123',
      }),
      expect.anything(),
    );
    expect(mockAdjustBalanceAtomically).toHaveBeenCalledWith(
      'cust-99',
      -500,
      'payment',
      expect.anything(),
    );
    expect(mockDb.update).not.toHaveBeenCalled(); // No status update because not fully paid
  });

  it('should register payment and transition status to PAID if fully paid', async () => {
    mockIsCashRegisterOpen.mockResolvedValueOnce(true);
    // OT total 1000, already paid 500, new payment 500
    mockDb.query.workOrder.findFirst.mockResolvedValueOnce({
      id: 'wo-123',
      total: '1000.00',
      customerId: 'cust-99',
      status: 'IN_PROGRESS',
      customer: { name: 'Aliprandi' },
      payments: [{ amount: '500.00' }],
    });
    mockDb.query.paymentMethod.findFirst.mockResolvedValueOnce({
      id: 'pm-1',
      name: 'Efectivo Contado',
      code: 'CASH',
      isActive: true,
    });

    // Track the update chain mock
    const whereFn = vi.fn(() => Promise.resolve());
    const setFn = vi.fn(() => ({ where: whereFn }));
    mockDb.update.mockReturnValue({ set: setFn });

    const result = await registerWorkOrderPaymentTool.execute(mockInput, {} as any);

    expect(result).toContain('Pago registrado exitosamente');
    expect(result).toContain('PAID (Totalmente pagada)');
    expect(mockDb.update).toHaveBeenCalled();
    expect(setFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PAID' }),
    );
  });
});
