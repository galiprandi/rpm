import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDirectSale, getDirectSalesSummaryForDate } from './directSaleService';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    stock_movement: {
      create: vi.fn(),
    },
    directSale: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    directSaleItem: {
      create: vi.fn(),
    },
    directSalePayment: {
      create: vi.fn(),
    },
  },
}));

describe('directSaleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDirectSale', () => {
    it('should create a direct sale with items and payments', async () => {
      const mockDirectSale = {
        id: 'test-id',
        customerName: 'Consumidor final',
        total: 100,
      };

      const mockProduct = {
        id: 'product-id',
        name: 'Test Product',
        stock: 10,
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return await callback(prisma as any);
      });

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.product.update).mockResolvedValue({} as any);
      vi.mocked(prisma.stock_movement.create).mockResolvedValue({} as any);
      vi.mocked(prisma.directSale.create).mockResolvedValue(mockDirectSale as any);
      vi.mocked(prisma.directSaleItem.create).mockResolvedValue({} as any);
      vi.mocked(prisma.directSalePayment.create).mockResolvedValue({} as any);

      const result = await createDirectSale({
        customerName: 'Consumidor final',
        items: [
          {
            productId: 'product-id',
            name: 'Test Product',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
          },
        ],
        payments: [
          {
            paymentMethodId: 'payment-method-id',
            amount: 100,
          },
        ],
        createdBy: 'user-id',
      });

      expect(result).toEqual(mockDirectSale);
      expect(prisma.directSale.create).toHaveBeenCalled();
    });

    it('should throw error if payments total does not match sale total', async () => {
      await expect(
        createDirectSale({
          customerName: 'Consumidor final',
          items: [
            {
              productId: 'product-id',
              name: 'Test Product',
              quantity: 1,
              unitPrice: 100,
              totalPrice: 100,
            },
          ],
          payments: [
            {
              paymentMethodId: 'payment-method-id',
              amount: 50,
            },
          ],
          createdBy: 'user-id',
        })
      ).rejects.toThrow('El total de pagos no coincide con el total de la venta');
    });

    it('should throw error if stock is insufficient', async () => {
      const mockProduct = {
        id: 'product-id',
        name: 'Test Product',
        stock: 1,
      };

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);

      await expect(
        createDirectSale({
          customerName: 'Consumidor final',
          items: [
            {
              productId: 'product-id',
              name: 'Test Product',
              quantity: 5,
              unitPrice: 100,
              totalPrice: 500,
            },
          ],
          payments: [
            {
              paymentMethodId: 'payment-method-id',
              amount: 500,
            },
          ],
          createdBy: 'user-id',
        })
      ).rejects.toThrow('Stock insuficiente');
    });

    it('should create stock movement for each product item', async () => {
      const mockDirectSale = {
        id: 'test-id',
        customerName: 'Consumidor final',
        total: 100,
      };

      const mockProduct = {
        id: 'product-id',
        name: 'Test Product',
        stock: 10,
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return await callback(prisma as any);
      });

      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.product.update).mockResolvedValue({} as any);
      vi.mocked(prisma.stock_movement.create).mockResolvedValue({} as any);
      vi.mocked(prisma.directSale.create).mockResolvedValue(mockDirectSale as any);
      vi.mocked(prisma.directSaleItem.create).mockResolvedValue({} as any);
      vi.mocked(prisma.directSalePayment.create).mockResolvedValue({} as any);

      await createDirectSale({
        customerName: 'Consumidor final',
        items: [
          {
            productId: 'product-id',
            name: 'Test Product',
            quantity: 2,
            unitPrice: 50,
            totalPrice: 100,
          },
        ],
        payments: [
          {
            paymentMethodId: 'payment-method-id',
            amount: 100,
          },
        ],
        createdBy: 'user-id',
      });

      expect(prisma.stock_movement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: -2,
            type: 'OUT',
            previousStock: 10,
            newStock: 8,
          }),
        })
      );
    });
  });

  describe('getDirectSalesSummaryForDate', () => {
    it('should return summary of direct sales for a date', async () => {
      const mockSales = [
        {
          total: 100,
          payments: [
            {
              paymentMethod: { code: 'EFECTIVO' },
              amount: 100,
            },
          ],
        },
        {
          total: 200,
          payments: [
            {
              paymentMethod: { code: 'MERCADOPAGO' },
              amount: 200,
            },
          ],
        },
      ];

      vi.mocked(prisma.directSale.findMany).mockResolvedValue(mockSales as any);

      const result = await getDirectSalesSummaryForDate(new Date());

      expect(result).toEqual({
        total: 300,
        count: 2,
        paymentsByMethod: {
          EFECTIVO: 100,
          MERCADOPAGO: 200,
        },
      });
    });

    it('should return empty summary if no sales', async () => {
      vi.mocked(prisma.directSale.findMany).mockResolvedValue([]);

      const result = await getDirectSalesSummaryForDate(new Date());

      expect(result).toEqual({
        total: 0,
        count: 0,
        paymentsByMethod: {},
      });
    });
  });
});
