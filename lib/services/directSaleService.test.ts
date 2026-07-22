/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDirectSale, getDirectSalesSummaryForDate } from './directSaleService';
import { createCashMovement } from './cashMovementService';
import { db } from '@/lib/db';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  invalidateCashStatus: vi.fn(),
}));

vi.mock('./balanceService', () => ({
  adjustBalanceAtomically: vi.fn(),
}));

// vi.hoisted runs before vi.mock factory
const { mockFns } = vi.hoisted(() => ({
  mockFns: {
    productFindMany: vi.fn(),
    productFindFirst: vi.fn(),
    paymentMethodFindMany: vi.fn(),
    customerFindFirst: vi.fn(),
    invoiceFindFirst: vi.fn(),
    directSaleFindMany: vi.fn(),
    insertValues: vi.fn(),
    insertReturning: vi.fn(),
    updateSet: vi.fn(),
    updateWhere: vi.fn(),
  },
}));

// Shared insert/update builders so tx and db share the same mock fns
function makeInsertBuilder() {
  return vi.fn(() => ({
    values: mockFns.insertValues.mockReturnValue({
      returning: mockFns.insertReturning,
    }),
  }));
}

function makeUpdateBuilder() {
  return vi.fn(() => ({
    set: mockFns.updateSet.mockReturnValue({
      where: mockFns.updateWhere,
      returning: vi.fn(() => Promise.resolve([{}])),
    }),
  }));
}

vi.mock('@/lib/db', () => {
  const insertBuilder = makeInsertBuilder();
  const updateBuilder = makeUpdateBuilder();
  const queryObj = {
    product: { findMany: mockFns.productFindMany, findFirst: mockFns.productFindFirst },
    paymentMethod: { findMany: mockFns.paymentMethodFindMany },
    customer: { findFirst: mockFns.customerFindFirst },
    invoice: { findFirst: mockFns.invoiceFindFirst },
    directSale: { findMany: mockFns.directSaleFindMany },
  };
  return {
    db: {
      select: vi.fn(),
      query: queryObj,
      insert: insertBuilder,
      update: updateBuilder,
      delete: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
      transaction: vi.fn(async (callback: any) => {
        // tx shares the same insert/update/query as db
        const tx = {
          select: vi.fn(),
          query: queryObj,
          insert: insertBuilder,
          update: updateBuilder,
          delete: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
        };
        return callback(tx);
      }),
    },
  };
});

vi.mock('./cashMovementService', () => ({
  createCashMovement: vi.fn(),
}));

// Also mock invoiceService since createDirectSale calls createInvoice internally
vi.mock('./invoiceService', () => ({
  createInvoice: vi.fn(() => Promise.resolve({ id: 'invoice-id' })),
  determineInvoiceType: vi.fn(() => 'X_B'),
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
        total: '100',
      };

      const mockProduct = {
        id: 'product-id',
        name: 'Test Product',
        stock: 10,
      };

      mockFns.productFindMany.mockResolvedValue([mockProduct]);
      mockFns.productFindFirst.mockResolvedValue(mockProduct);
      mockFns.paymentMethodFindMany.mockResolvedValue([{ id: 'payment-method-id', code: 'EFECTIVO' }]);
      mockFns.insertReturning.mockResolvedValue([mockDirectSale]);
      mockFns.insertValues.mockReturnValue({ returning: mockFns.insertReturning });
      mockFns.updateWhere.mockResolvedValue(undefined);
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
      expect(db.transaction).toHaveBeenCalled();
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

      mockFns.productFindMany.mockResolvedValue([mockProduct]);
      mockFns.paymentMethodFindMany.mockResolvedValue([{ id: 'payment-method-id', code: 'EFECTIVO' }]);

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
        total: '100',
      };

      const mockProduct = {
        id: 'product-id',
        name: 'Test Product',
        stock: 10,
      };

      mockFns.productFindMany.mockResolvedValue([mockProduct]);
      mockFns.productFindFirst.mockResolvedValue(mockProduct);
      mockFns.paymentMethodFindMany.mockResolvedValue([{ id: 'payment-method-id', code: 'EFECTIVO' }]);
      mockFns.insertReturning.mockResolvedValue([mockDirectSale]);
      mockFns.insertValues.mockReturnValue({ returning: mockFns.insertReturning });
      mockFns.updateWhere.mockResolvedValue(undefined);
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

      // Verify that insert.values was called with stock movement data
      // The stock movement insert has quantity: -2, type: 'OUT', previousStock: 10, newStock: 8
      expect(mockFns.insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: -2,
          type: 'OUT',
          previousStock: 10,
          newStock: 8,
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

      mockFns.productFindMany.mockResolvedValue(mockProducts);
      mockFns.productFindFirst.mockImplementation(({ where }: any) => {
        // Drizzle where is a SQL object; we can't easily inspect it.
        // Just return a product with sufficient stock.
        return Promise.resolve({ stock: 100, name: 'Product' });
      });
      mockFns.paymentMethodFindMany.mockResolvedValue([{ id: 'pm-1', code: 'CASH' }]);
      mockFns.insertReturning.mockResolvedValue([{ id: 'sale-id' }]);
      mockFns.insertValues.mockReturnValue({ returning: mockFns.insertReturning });
      mockFns.updateWhere.mockResolvedValue(undefined);
      vi.mocked(createCashMovement).mockResolvedValue({} as any);

      await createDirectSale({
        customerName: 'Test Load',
        items,
        payments: [{ paymentMethodId: 'pm-1', amount: itemCount * 10 }],
        createdBy: 'user-id',
      });

      // Pre-fetch products should be called once
      expect(mockFns.productFindMany).toHaveBeenCalledTimes(1);
      // Product update should be called for each item (inside transaction)
      expect(mockFns.updateWhere).toHaveBeenCalledTimes(itemCount);
    });
  });

  describe('getDirectSalesSummaryForDate', () => {
    it('should return summary of direct sales for a date', async () => {
      const mockSales = [
        {
          total: '100',
          directSalePayments: [
            {
              paymentMethod: { code: 'EFECTIVO' },
              amount: '100',
            },
          ],
        },
        {
          total: '200',
          directSalePayments: [
            {
              paymentMethod: { code: 'MERCADOPAGO' },
              amount: '200',
            },
          ],
        },
      ];

      mockFns.directSaleFindMany.mockResolvedValue(mockSales as any);

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
      mockFns.directSaleFindMany.mockResolvedValue([]);

      const result = await getDirectSalesSummaryForDate(new Date());

      expect(result).toEqual({
        total: 0,
        count: 0,
        paymentsByMethod: {},
      });
    });
  });
});
