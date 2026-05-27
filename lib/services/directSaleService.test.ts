/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDirectSale, getDirectSalesSummaryForDate } from './directSaleService';
import { createCashMovement } from './cashMovementService';
import { prisma } from '@/lib/prisma';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    stock_movement: {
      create: vi.fn(),
    },
    direct_sale: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    direct_sale_item: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    direct_sale_payment: {
      create: vi.fn(),
    },
    payment_method: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('./cashMovementService', () => ({
  createCashMovement: vi.fn(),
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

      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.product.update).mockResolvedValue({} as any);
      vi.mocked(prisma.stock_movement.create).mockResolvedValue({} as any);
      vi.mocked(prisma.direct_sale.create).mockResolvedValue(mockDirectSale as any);
      vi.mocked(prisma.direct_sale_item.createMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.direct_sale_payment.create).mockResolvedValue({ id: 'payment-id' } as any);
      vi.mocked(prisma.payment_method.findMany).mockResolvedValue([{ id: 'payment-method-id', code: 'EFECTIVO' }] as any);
      vi.mocked(createCashMovement).mockResolvedValue({} as any);

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
      expect(prisma.direct_sale.create).toHaveBeenCalled();
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

      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
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

      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.product.update).mockResolvedValue({} as any);
      vi.mocked(prisma.stock_movement.create).mockResolvedValue({} as any);
      vi.mocked(prisma.direct_sale.create).mockResolvedValue(mockDirectSale as any);
      vi.mocked(prisma.direct_sale_item.createMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.direct_sale_payment.create).mockResolvedValue({ id: 'payment-id' } as any);
      vi.mocked(prisma.payment_method.findMany).mockResolvedValue([{ id: 'payment-method-id', code: 'EFECTIVO' }] as any);
      vi.mocked(createCashMovement).mockResolvedValue({} as any);

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

    it('should optimize heavy sales with many items', async () => {
      const itemCount = 50;
      const items = Array.from({ length: itemCount }).map((_, i) => ({
        productId: `product-${i}`,
        name: `Product ${i}`,
        quantity: 1,
        unitPrice: 10,
        totalPrice: 10,
      }));

      const mockProducts = items.map(item => ({
        id: item.productId,
        name: item.name,
        stock: 100,
      }));

      vi.mocked(prisma.$transaction).mockImplementation(async (callback, options: any) => {
        expect(options).toEqual({ timeout: 15000 });
        return await callback(prisma as any);
      });

      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.product.findUnique).mockImplementation(({ where }: any) => {
        const product = mockProducts.find(p => p.id === where.id);
        return Promise.resolve(product ? { ...product, credit_note_items: [], direct_sale_items: [], price_list_item: [], inventory_count_items: [] } : null) as any;
      });
      vi.mocked(prisma.direct_sale.create).mockResolvedValue({ id: 'sale-id' } as any);
      vi.mocked(prisma.payment_method.findMany).mockResolvedValue([{ id: 'pm-1', code: 'CASH' }] as any);

      await createDirectSale({
        customerName: 'Test Load',
        items,
        payments: [{ paymentMethodId: 'pm-1', amount: itemCount * 10 }],
        createdBy: 'user-id',
      });

      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.direct_sale_item.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Product 0' }),
          expect.objectContaining({ name: 'Product 49' }),
        ]),
      });
      expect(prisma.product.update).toHaveBeenCalledTimes(itemCount);
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

      vi.mocked(prisma.direct_sale.findMany).mockResolvedValue(mockSales as any);

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
      vi.mocked(prisma.direct_sale.findMany).mockResolvedValue([]);

      const result = await getDirectSalesSummaryForDate(new Date());

      expect(result).toEqual({
        total: 0,
        count: 0,
        paymentsByMethod: {},
      });
    });
  });
});
