/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test suite para CreditNoteValidationService
 * 
 * Especificaciones relacionadas:
 * - /specs/spec-credit-notes.md
 * - /specs/customer-credit.md
 * - /specs/inventory-sales.md
 * 
 * Alcance: Validación de input, venta original, items, cantidades, caja abierta, método de pago
 * Métricas: Cobertura de casos felices y casos de error para todas las funciones de validación
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock functions factory
const mockFns = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    direct_sale: {
      findUnique: mockFns.findUnique,
    },
    work_order: {
      findUnique: mockFns.findUnique,
    },
    payment_method: {
      findUnique: mockFns.findUnique,
    },
    credit_note: {
      findMany: mockFns.findMany,
    },
  },
}));

vi.mock('@/lib/services/cashMovementService', () => ({
  isCashRegisterOpen: vi.fn(),
}));

import {
  validateCreditNoteInput,
  validateOriginalSaleExists,
  validateCashRegisterOpen,
  validatePaymentMethodForCash,
  validateItemsInOriginalSale,
  validateReturnQuantities,
  validateCreditNoteCreation,
  getAlreadyReturnedQuantities,
  type CreditNoteItemInput,
  type CreateCreditNoteInput,
} from '@/lib/services/creditNoteValidationService';
import { isCashRegisterOpen } from '@/lib/services/cashMovementService';

describe('CreditNoteValidationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCreditNoteInput', () => {
    it('should validate correct input', async () => {
      const input: CreateCreditNoteInput = {
        originalSaleId: 'sale-123',
        originalSaleType: 'direct_sale',
        items: [{ productId: 'product-1', quantity: 1 }],
        refundMethod: 'CASH',
        paymentMethodId: 'payment-1',
        createdBy: 'user-1',
      };

      const result = await validateCreditNoteInput(input);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing originalSaleId', async () => {
      const input = {
        originalSaleId: '',
        originalSaleType: 'direct_sale' as const,
        items: [{ productId: 'product-1', quantity: 1 }],
        refundMethod: 'CASH' as const,
        createdBy: 'user-1',
      };

      const result = await validateCreditNoteInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('originalSaleId es requerido');
    });

    it('should reject missing originalSaleType', async () => {
      const input = {
        originalSaleId: 'sale-123',
        originalSaleType: '' as any,
        items: [{ productId: 'product-1', quantity: 1 }],
        refundMethod: 'CASH' as const,
        createdBy: 'user-1',
      };

      const result = await validateCreditNoteInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('originalSaleType es requerido');
    });

    it('should reject invalid originalSaleType', async () => {
      const input = {
        originalSaleId: 'sale-123',
        originalSaleType: 'invalid' as any,
        items: [{ productId: 'product-1', quantity: 1 }],
        refundMethod: 'CASH' as const,
        createdBy: 'user-1',
      };

      const result = await validateCreditNoteInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('originalSaleType debe ser direct_sale o work_order');
    });

    it('should reject empty items', async () => {
      const input = {
        originalSaleId: 'sale-123',
        originalSaleType: 'direct_sale' as const,
        items: [],
        refundMethod: 'CASH' as const,
        createdBy: 'user-1',
      };

      const result = await validateCreditNoteInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('items es requerido y debe tener al menos un item');
    });

    it('should reject invalid refundMethod', async () => {
      const input = {
        originalSaleId: 'sale-123',
        originalSaleType: 'direct_sale' as const,
        items: [{ productId: 'product-1', quantity: 1 }],
        refundMethod: 'invalid' as any,
        createdBy: 'user-1',
      };

      const result = await validateCreditNoteInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('refundMethod debe ser CASH o ACCOUNT_CREDIT');
    });

    it('should reject item without productId or serviceId', async () => {
      const input = {
        originalSaleId: 'sale-123',
        originalSaleType: 'direct_sale' as const,
        items: [{ quantity: 1 }] as any,
        refundMethod: 'CASH' as const,
        createdBy: 'user-1',
      };

      const result = await validateCreditNoteInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Item 1: debe tener productId o serviceId');
    });

    it('should reject item with zero quantity', async () => {
      const input = {
        originalSaleId: 'sale-123',
        originalSaleType: 'direct_sale' as const,
        items: [{ productId: 'product-1', quantity: 0 }],
        refundMethod: 'CASH' as const,
        createdBy: 'user-1',
      };

      const result = await validateCreditNoteInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Item 1: quantity debe ser mayor a 0');
    });

    it('should reject item with negative quantity', async () => {
      const input = {
        originalSaleId: 'sale-123',
        originalSaleType: 'direct_sale' as const,
        items: [{ productId: 'product-1', quantity: -1 }],
        refundMethod: 'CASH' as const,
        createdBy: 'user-1',
      };

      const result = await validateCreditNoteInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Item 1: quantity debe ser mayor a 0');
    });

    it('should accept ACCOUNT_CREDIT without paymentMethodId', async () => {
      const input: CreateCreditNoteInput = {
        originalSaleId: 'sale-123',
        originalSaleType: 'direct_sale',
        items: [{ productId: 'product-1', quantity: 1 }],
        refundMethod: 'ACCOUNT_CREDIT',
        createdBy: 'user-1',
      };

      const result = await validateCreditNoteInput(input);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateOriginalSaleExists', () => {
    it('should find direct sale', async () => {
      const mockSale = {
        id: 'sale-123',
        customerId: 'customer-1',
        items: [],
        customer: { id: 'customer-1', name: 'Test Customer' },
      };

      mockFns.findUnique.mockResolvedValue(mockSale);

      const result = await validateOriginalSaleExists('sale-123', 'direct_sale');

      expect(result.exists).toBe(true);
      expect(result.customerId).toBe('customer-1');
      expect(result.sale).toEqual(mockSale);
    });

    it('should find work order', async () => {
      const mockSale = {
        id: 'wo-123',
        customerId: 'customer-1',
        work_order_item: [],
        customer: { id: 'customer-1', name: 'Test Customer' },
      };

      mockFns.findUnique.mockResolvedValue(mockSale);

      const result = await validateOriginalSaleExists('wo-123', 'work_order');

      expect(result.exists).toBe(true);
      expect(result.customerId).toBe('customer-1');
      expect(result.sale).toEqual(mockSale);
    });

    it('should return not found for non-existent direct sale', async () => {
      mockFns.findUnique.mockResolvedValue(null);

      const result = await validateOriginalSaleExists('nonexistent', 'direct_sale');

      expect(result.exists).toBe(false);
      expect(result.customerId).toBeUndefined();
      expect(result.sale).toBeUndefined();
    });

    it('should return not found for non-existent work order', async () => {
      mockFns.findUnique.mockResolvedValue(null);

      const result = await validateOriginalSaleExists('nonexistent', 'work_order');

      expect(result.exists).toBe(false);
      expect(result.customerId).toBeUndefined();
      expect(result.sale).toBeUndefined();
    });
  });

  describe('validateCashRegisterOpen', () => {
    it('should pass when cash register is open', async () => {
      vi.mocked(isCashRegisterOpen).mockResolvedValue(true);

      const result = await validateCashRegisterOpen();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when cash register is closed', async () => {
      vi.mocked(isCashRegisterOpen).mockResolvedValue(false);

      const result = await validateCashRegisterOpen();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('La caja está cerrada. Debe abrir la caja para realizar reintegros en efectivo.');
    });
  });

  describe('validatePaymentMethodForCash', () => {
    it('should reject missing paymentMethodId', async () => {
      const result = await validatePaymentMethodForCash(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Debe especificar el método de pago para reintegro en efectivo');
    });

    it('should reject non-existent payment method', async () => {
      mockFns.findUnique.mockResolvedValue(null);

      const result = await validatePaymentMethodForCash('nonexistent');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Método de pago no encontrado');
    });

    it('should accept valid payment method', async () => {
      mockFns.findUnique.mockResolvedValue({ id: 'payment-1', code: 'EFECTIVO' });

      const result = await validatePaymentMethodForCash('payment-1');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateItemsInOriginalSale', () => {
    const mockDirectSale = {
      id: 'sale-123',
      customerId: 'customer-1',
      items: [
        { id: 'item-1', productId: 'product-1', serviceId: null, quantity: 5, name: 'Product 1' },
        { id: 'item-2', productId: 'product-2', serviceId: null, quantity: 3, name: 'Product 2' },
      ],
    };

    const mockWorkOrder = {
      id: 'wo-123',
      customerId: 'customer-1',
      work_order_item: [
        { id: 'item-1', productId: 'product-1', serviceId: null, quantity: 5, product: { name: 'Product 1' } },
        { id: 'item-2', productId: 'product-2', serviceId: null, quantity: 3, product: { name: 'Product 2' } },
      ],
    };

    it('should validate items in direct sale', async () => {
      const items: CreditNoteItemInput[] = [
        { productId: 'product-1', quantity: 2 },
        { productId: 'product-2', quantity: 1 },
      ];

      const result = await validateItemsInOriginalSale(items, 'direct_sale', mockDirectSale);

      expect(result.valid).toBe(true);
    });

    it('should validate items in work order', async () => {
      const items: CreditNoteItemInput[] = [
        { productId: 'product-1', quantity: 2 },
        { productId: 'product-2', quantity: 1 },
      ];

      const result = await validateItemsInOriginalSale(items, 'work_order', mockWorkOrder);

      expect(result.valid).toBe(true);
    });

    it('should reject item not in original sale', async () => {
      const items: CreditNoteItemInput[] = [
        { productId: 'product-999', quantity: 1 },
      ];

      const result = await validateItemsInOriginalSale(items, 'direct_sale', mockDirectSale);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Item no encontrado en la venta original: product-999');
    });

    it('should validate by serviceId', async () => {
      const mockSaleWithServices = {
        id: 'sale-123',
        customerId: 'customer-1',
        items: [
          { id: 'item-1', productId: null, serviceId: 'service-1', quantity: 2, name: 'Service 1' },
        ],
      };

      const items: CreditNoteItemInput[] = [
        { serviceId: 'service-1', quantity: 1 },
      ];

      const result = await validateItemsInOriginalSale(items, 'direct_sale', mockSaleWithServices);

      expect(result.valid).toBe(true);
    });
  });

  describe('getAlreadyReturnedQuantities', () => {
    it('should return empty object when no credit notes exist', async () => {
      mockFns.findMany.mockResolvedValue([]);

      const result = await getAlreadyReturnedQuantities('sale-123', 'direct_sale');

      expect(result).toEqual({});
    });

    it('should aggregate returned quantities by productId', async () => {
      const mockCreditNotes = [
        {
          id: 'cn-1',
          items: [
            { productId: 'product-1', serviceId: null, id: 'item-1', quantity: 2 },
            { productId: 'product-2', serviceId: null, id: 'item-2', quantity: 1 },
          ],
        },
        {
          id: 'cn-2',
          items: [
            { productId: 'product-1', serviceId: null, id: 'item-3', quantity: 1 },
          ],
        },
      ];

      mockFns.findMany.mockResolvedValue(mockCreditNotes);

      const result = await getAlreadyReturnedQuantities('sale-123', 'direct_sale');

      expect(result['product-1']).toBe(3);
      expect(result['product-2']).toBe(1);
    });

    it('should aggregate returned quantities by serviceId', async () => {
      const mockCreditNotes = [
        {
          id: 'cn-1',
          items: [
            { productId: null, serviceId: 'service-1', id: 'item-1', quantity: 2 },
          ],
        },
      ];

      mockFns.findMany.mockResolvedValue(mockCreditNotes);

      const result = await getAlreadyReturnedQuantities('sale-123', 'direct_sale');

      expect(result['service-1']).toBe(2);
    });

    it('should use id as fallback when productId and serviceId are null', async () => {
      const mockCreditNotes = [
        {
          id: 'cn-1',
          items: [
            { productId: null, serviceId: null, id: 'item-1', quantity: 2 },
          ],
        },
      ];

      mockFns.findMany.mockResolvedValue(mockCreditNotes);

      const result = await getAlreadyReturnedQuantities('sale-123', 'direct_sale');

      expect(result['item-1']).toBe(2);
    });
  });

  describe('validateReturnQuantities', () => {
    const mockSale = {
      id: 'sale-123',
      items: [
        { id: 'item-1', productId: 'product-1', serviceId: null, quantity: 5, name: 'Product 1' },
        { id: 'item-2', productId: 'product-2', serviceId: null, quantity: 3, name: 'Product 2' },
      ],
    };

    it('should allow returning within sold quantity', async () => {
      mockFns.findMany.mockResolvedValue([]);

      const items: CreditNoteItemInput[] = [
        { productId: 'product-1', quantity: 3 },
      ];

      const result = await validateReturnQuantities(items, 'direct_sale', mockSale);

      expect(result.valid).toBe(true);
    });

    it('should allow returning full sold quantity', async () => {
      mockFns.findMany.mockResolvedValue([]);

      const items: CreditNoteItemInput[] = [
        { productId: 'product-1', quantity: 5 },
      ];

      const result = await validateReturnQuantities(items, 'direct_sale', mockSale);

      expect(result.valid).toBe(true);
    });

    it('should reject returning more than sold', async () => {
      mockFns.findMany.mockResolvedValue([]);

      const items: CreditNoteItemInput[] = [
        { productId: 'product-1', quantity: 10 },
      ];

      const result = await validateReturnQuantities(items, 'direct_sale', mockSale);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('No puede devolver más de lo vendido');
      expect(result.errors[0]).toContain('Vendido: 5');
    });

    it('should reject returning more than remaining after previous returns', async () => {
      const mockCreditNotes = [
        {
          id: 'cn-1',
          items: [
            { productId: 'product-1', serviceId: null, id: 'item-1', quantity: 3 },
          ],
        },
      ];
      mockFns.findMany.mockResolvedValue(mockCreditNotes);

      const items: CreditNoteItemInput[] = [
        { productId: 'product-1', quantity: 5 },
      ];

      const result = await validateReturnQuantities(items, 'direct_sale', mockSale);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Vendido: 5');
      expect(result.errors[0]).toContain('Ya devuelto: 3');
      expect(result.errors[0]).toContain('Disponible: 2');
    });

    it('should reject item not in original sale', async () => {
      mockFns.findMany.mockResolvedValue([]);

      const items: CreditNoteItemInput[] = [
        { productId: 'product-999', quantity: 1 },
      ];

      const result = await validateReturnQuantities(items, 'direct_sale', mockSale);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Item no encontrado en la venta original');
    });

    it('should work with work order items', async () => {
      const mockWorkOrder = {
        id: 'wo-123',
        work_order_item: [
          { id: 'item-1', productId: 'product-1', serviceId: null, quantity: 5, product: { name: 'Product 1' } },
        ],
      };

      mockFns.findMany.mockResolvedValue([]);

      const items: CreditNoteItemInput[] = [
        { productId: 'product-1', quantity: 2 },
      ];

      const result = await validateReturnQuantities(items, 'work_order', mockWorkOrder);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateCreditNoteCreation', () => {
    const validInput: CreateCreditNoteInput = {
      originalSaleId: 'sale-123',
      originalSaleType: 'direct_sale',
      items: [{ productId: 'product-1', quantity: 1 }],
      refundMethod: 'ACCOUNT_CREDIT',
      createdBy: 'user-1',
    };

    const mockSale = {
      id: 'sale-123',
      customerId: 'customer-1',
      items: [
        { id: 'item-1', productId: 'product-1', serviceId: null, quantity: 5, name: 'Product 1' },
      ],
    };

    it('should validate ACCOUNT_CREDIT credit note successfully', async () => {
      mockFns.findUnique.mockResolvedValue(mockSale);
      mockFns.findMany.mockResolvedValue([]);

      const result = await validateCreditNoteCreation(validInput);

      expect(result.valid).toBe(true);
    });

    it('should validate CASH credit note successfully', async () => {
      vi.mocked(isCashRegisterOpen).mockResolvedValue(true);
      mockFns.findUnique.mockResolvedValue(mockSale);
      mockFns.findMany.mockResolvedValue([]);

      const cashInput: CreateCreditNoteInput = {
        ...validInput,
        refundMethod: 'CASH',
        paymentMethodId: 'payment-1',
      };

      const result = await validateCreditNoteCreation(cashInput);

      expect(result.valid).toBe(true);
    });

    it('should fail on invalid input structure', async () => {
      const invalidInput = {
        originalSaleId: '',
        originalSaleType: 'direct_sale' as const,
        items: [],
        refundMethod: 'CASH' as const,
        createdBy: 'user-1',
      };

      const result = await validateCreditNoteCreation(invalidInput);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail when original sale not found', async () => {
      mockFns.findUnique.mockResolvedValue(null);

      const result = await validateCreditNoteCreation(validInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Venta original no encontrada');
    });

    it('should fail when item not in original sale', async () => {
      mockFns.findUnique.mockResolvedValue(mockSale);
      mockFns.findMany.mockResolvedValue([]);

      const invalidItemsInput: CreateCreditNoteInput = {
        ...validInput,
        items: [{ productId: 'product-999', quantity: 1 }],
      };

      const result = await validateCreditNoteCreation(invalidItemsInput);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('no encontrado en la venta original'))).toBe(true);
    });

    it('should fail when returning more than sold', async () => {
      mockFns.findUnique.mockResolvedValue(mockSale);
      mockFns.findMany.mockResolvedValue([]);

      const invalidQuantityInput: CreateCreditNoteInput = {
        ...validInput,
        items: [{ productId: 'product-1', quantity: 10 }],
      };

      const result = await validateCreditNoteCreation(invalidQuantityInput);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('No puede devolver más de lo vendido'))).toBe(true);
    });

    it('should fail when cash register is closed for CASH refund', async () => {
      vi.mocked(isCashRegisterOpen).mockResolvedValue(false);
      mockFns.findUnique.mockResolvedValue(mockSale);
      mockFns.findMany.mockResolvedValue([]);

      const cashInput: CreateCreditNoteInput = {
        ...validInput,
        refundMethod: 'CASH',
        paymentMethodId: 'payment-1',
      };

      const result = await validateCreditNoteCreation(cashInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('La caja está cerrada. Debe abrir la caja para realizar reintegros en efectivo.');
    });

    it('should fail when payment method not found for CASH refund', async () => {
      vi.mocked(isCashRegisterOpen).mockResolvedValue(true);
      mockFns.findUnique.mockResolvedValueOnce(mockSale).mockResolvedValueOnce(null);
      mockFns.findMany.mockResolvedValue([]);

      const cashInput: CreateCreditNoteInput = {
        ...validInput,
        refundMethod: 'CASH',
        paymentMethodId: 'payment-1',
      };

      const result = await validateCreditNoteCreation(cashInput);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Método de pago no encontrado');
    });

    it('should work with work order', async () => {
      const mockWorkOrder = {
        id: 'wo-123',
        customerId: 'customer-1',
        work_order_item: [
          { id: 'item-1', productId: 'product-1', serviceId: null, quantity: 5, product: { name: 'Product 1' } },
        ],
      };

      mockFns.findUnique.mockResolvedValue(mockWorkOrder);
      mockFns.findMany.mockResolvedValue([]);

      const workOrderInput: CreateCreditNoteInput = {
        ...validInput,
        originalSaleId: 'wo-123',
        originalSaleType: 'work_order',
      };

      const result = await validateCreditNoteCreation(workOrderInput);

      expect(result.valid).toBe(true);
    });
  });
});
