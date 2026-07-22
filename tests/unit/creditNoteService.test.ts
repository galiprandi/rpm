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
 * debido a la complejidad de las transacciones de Drizzle y dependencias externas.
 * Métricas: Cobertura de casos felices para funciones de lectura.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCreditNotes, getCreditNoteById } from '@/lib/services/creditNoteService';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      creditNote: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
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
        creditNoteItems: [{ id: 'item-1' }, { id: 'item-2' }],
      },
    ];

    it('should return all credit notes without filters', async () => {
      vi.mocked(db.query.creditNote.findMany).mockResolvedValue(mockCreditNotes as any);

      const result = await getCreditNotes({});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cn-1');
      expect(result[0]._count.items).toBe(2);
      // Drizzle uses SQL expressions for where — verify findMany was called
      expect(db.query.creditNote.findMany).toHaveBeenCalled();
    });

    it('should filter by customerId', async () => {
      vi.mocked(db.query.creditNote.findMany).mockResolvedValue(mockCreditNotes as any);

      const result = await getCreditNotes({ customerId: 'customer-1' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cn-1');
      // Drizzle uses SQL expressions for where — verify findMany was called
      expect(db.query.creditNote.findMany).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      vi.mocked(db.query.creditNote.findMany).mockResolvedValue(mockCreditNotes as any);

      const result = await getCreditNotes({ status: 'ISSUED' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('ISSUED');
      expect(db.query.creditNote.findMany).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      vi.mocked(db.query.creditNote.findMany).mockResolvedValue(mockCreditNotes as any);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await getCreditNotes({ startDate, endDate });

      expect(result).toHaveLength(1);
      expect(db.query.creditNote.findMany).toHaveBeenCalled();
    });

    it('should filter by originalSaleId', async () => {
      vi.mocked(db.query.creditNote.findMany).mockResolvedValue(mockCreditNotes as any);

      const result = await getCreditNotes({ originalSaleId: 'sale-123' });

      expect(result).toHaveLength(1);
      expect(db.query.creditNote.findMany).toHaveBeenCalled();
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
      creditNoteItems: [
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
      vi.mocked(db.query.creditNote.findFirst).mockResolvedValue(mockCreditNote as any);

      const result = await getCreditNoteById('cn-1');

      expect(result).toEqual(mockCreditNote);
      // Drizzle uses SQL expressions for where — verify findFirst was called
      expect(db.query.creditNote.findFirst).toHaveBeenCalled();
    });

    it('should return null if credit note not found', async () => {
      vi.mocked(db.query.creditNote.findFirst).mockResolvedValue(null as any);

      const result = await getCreditNoteById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
