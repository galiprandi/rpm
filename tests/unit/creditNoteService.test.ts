/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test suite para CreditNoteService
 * 
 * Especificaciones relacionadas:
 * - /specs/spec-credit-notes.md
 * - /specs/customer-credit.md
 * - /specs/inventory-sales.md
 * 
 * Alcance: Listado y detalle de NC (funciones de lectura).
 * Nota: createCreditNote y cancelCreditNote se validan mejor con tests de integración/E2E
 * debido a la complejidad de las transacciones de Prisma y dependencias externas.
 * Métricas: Cobertura de casos felices para funciones de lectura.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCreditNotes, getCreditNoteById } from '@/lib/services/creditNoteService';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    credit_note: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('CreditNoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCreditNotes', () => {
    const mockCreditNotes = [
      {
        id: 'cn-1',
        customerId: 'customer-1',
        total: 100,
        status: 'ISSUED',
        createdAt: new Date(),
        customer: { id: 'customer-1', name: 'Test Customer', phone: '123456' },
        _count: { items: 2 },
      },
    ];

    it('should return all credit notes without filters', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.credit_note.findMany).mockResolvedValue(mockCreditNotes as any);

      const result = await getCreditNotes({});

      expect(result).toEqual(mockCreditNotes);
      expect(prisma.credit_note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should filter by customerId', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.credit_note.findMany).mockResolvedValue(mockCreditNotes as any);

      const result = await getCreditNotes({ customerId: 'customer-1' });

      expect(result).toEqual(mockCreditNotes);
      expect(prisma.credit_note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerId: 'customer-1',
          }),
        })
      );
    });

    it('should filter by status', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.credit_note.findMany).mockResolvedValue(mockCreditNotes as any);

      const result = await getCreditNotes({ status: 'ISSUED' });

      expect(result).toEqual(mockCreditNotes);
      expect(prisma.credit_note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ISSUED',
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.credit_note.findMany).mockResolvedValue(mockCreditNotes as any);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await getCreditNotes({ startDate, endDate });

      expect(result).toEqual(mockCreditNotes);
      expect(prisma.credit_note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      );
    });

    it('should filter by originalSaleId', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.credit_note.findMany).mockResolvedValue(mockCreditNotes as any);

      const result = await getCreditNotes({ originalSaleId: 'sale-123' });

      expect(result).toEqual(mockCreditNotes);
      expect(prisma.credit_note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            originalSaleId: 'sale-123',
          }),
        })
      );
    });
  });

  describe('getCreditNoteById', () => {
    const mockCreditNote = {
      id: 'cn-1',
      customerId: 'customer-1',
      total: 100,
      status: 'ISSUED',
      customer: {
        id: 'customer-1',
        name: 'Test Customer',
        phone: '123456',
        email: 'test@example.com',
        balance: 500,
      },
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          serviceId: null,
          name: 'Product 1',
          quantity: 2,
          unitPrice: 50,
          totalPrice: 100,
          product: { id: 'product-1', name: 'Product 1' },
          service: null,
        },
      ],
      paymentMethod: { id: 'payment-1', name: 'Efectivo', code: 'EFECTIVO' },
    };

    it('should return credit note by id', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.credit_note.findUnique).mockResolvedValue(mockCreditNote as any);

      const result = await getCreditNoteById('cn-1');

      expect(result).toEqual(mockCreditNote);
      expect(prisma.credit_note.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cn-1' },
        })
      );
    });

    it('should return null if credit note not found', async () => {
      const { prisma } = await import('@/lib/prisma');
      vi.mocked(prisma.credit_note.findUnique).mockResolvedValue(null);

      const result = await getCreditNoteById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
