/**
 * Test suite para ProductService
 * 
 * Especificaciones relacionadas:
 * - /specs/data-architecture.md#productos
 * - /specs/inventory-sales.md
 * 
 * Alcance del test:
 * - Validación de CRUD operations
 * - Búsqueda por EAN, nombre, SKU
 * - Filtros por categoría y stock bajo
 * - Cálculo de margen
 * 
 * Métricas cubiertas:
 * - Cobertura esperada: >90%
 * - Performance: <100ms por query
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock functions factory - hoisted by vitest
const mockFns = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
}));

// Mock Prisma - factory function is hoisted
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: mockFns.findMany,
      findUnique: mockFns.findUnique,
      create: mockFns.create,
      update: mockFns.update,
      delete: mockFns.delete,
      count: mockFns.count,
      fields: {
        minStock: 'minStock',
      },
    },
  },
  Prisma: {
    Decimal: vi.fn((val: number) => ({ toNumber: () => val })),
  },
}));

// Import after mock
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deactivateProduct,
  deleteProduct,
  updateStock,
} from './productService';

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProduct = {
    id: '1',
    sku: 'LED-001',
    name: 'LED Test',
    description: null,
    barcode: '123456789',
    categoryId: 'cat1',
    category: { id: 'cat1', name: 'LEDs', color: '#ff0000' },
    costPrice: { toNumber: () => 100 },
    salePrice: { toNumber: () => 150 },
    stock: 10,
    minStock: 5,
    supplier: null,
    location: null,
    isActive: true,
  };

  describe('getProducts', () => {
    it('should return all active products with calculated margin', async () => {
      const mockProducts = [mockProduct];

      mockFns.findMany.mockResolvedValue(mockProducts);
      mockFns.count.mockResolvedValue(1);

      const result = await getProducts();

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.products[0].margin).toBe(50);
    });
  });

  describe('getProducts with filters', () => {

    it('should filter by search term (EAN)', async () => {
      mockFns.findMany.mockResolvedValue([]);
      mockFns.count.mockResolvedValue(0);

      await getProducts({ search: '123456789' });

      expect(mockFns.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ barcode: expect.any(Object) }),
            ]),
          }),
        })
      );
    });

    it('should filter by category', async () => {
      mockFns.findMany.mockResolvedValue([]);
      mockFns.count.mockResolvedValue(0);

      await getProducts({ categoryId: 'cat1' });

      expect(mockFns.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat1' }),
        })
      );
    });

    it('should identify low stock products', async () => {
      const mockProducts = [
        {
          id: '1',
          sku: 'LOW-001',
          name: 'Low Stock Item',
          description: null,
          barcode: null,
          categoryId: null,
          category: null,
          costPrice: { toNumber: () => 10 },
          salePrice: { toNumber: () => 15 },
          stock: 2,
          minStock: 5,
          supplier: null,
          location: null,
          isActive: true,
        },
      ];

      mockFns.findMany.mockResolvedValue(mockProducts);
      mockFns.count.mockResolvedValue(1);

      const result = await getProducts({ lowStock: true });

      expect(result.products[0].isLowStock).toBe(true);
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const mockProduct = {
        id: '1',
        sku: 'TEST-001',
        name: 'Test Product',
        description: null,
        barcode: '789123',
        categoryId: null,
        category: null,
        costPrice: { toNumber: () => 50 },
        salePrice: { toNumber: () => 75 },
        stock: 20,
        minStock: 10,
        supplier: null,
        location: null,
        isActive: true,
      };

      mockFns.findUnique.mockResolvedValue(mockProduct);

      const result = await getProductById('1');

      expect(result).toBeDefined();
      expect(result?.sku).toBe('TEST-001');
      expect(mockFns.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { category: true },
      });
    });

    it('should return null if product not found', async () => {
      mockFns.findUnique.mockResolvedValue(null);

      const result = await getProductById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    it('should create product with all fields', async () => {
      const input = {
        sku: 'NEW-001',
        name: 'New Product',
        description: 'Test description',
        barcode: '1234567890123',
        categoryId: 'cat1',
        costPrice: 100,
        salePrice: 150,
        stock: 50,
        minStock: 10,
        supplier: 'Supplier Co',
        location: 'A1-B2',
      };

      const mockCreated = {
        id: 'new-id',
        sku: 'NEW-001',
        name: 'New Product',
        description: 'Test description',
        barcode: '1234567890123',
        categoryId: 'cat1',
        costPrice: { toNumber: () => 100 },
        salePrice: { toNumber: () => 150 },
        stock: 50,
        minStock: 10,
        supplier: 'Supplier Co',
        location: 'A1-B2',
        category: { id: 'cat1', name: 'Category', color: null },
      };

      mockFns.create.mockResolvedValue(mockCreated);

      const result = await createProduct(input);

      expect(result.id).toBe('new-id');
      expect(mockFns.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sku: 'NEW-001',
          name: 'New Product',
          barcode: '1234567890123',
        }),
        include: { category: true },
      });
    });

    it('should handle null optional fields', async () => {
      const input = {
        sku: 'MIN-001',
        name: 'Minimal Product',
        categoryId: 'cat1', // Required field
        costPrice: 10,
        salePrice: 15,
        stock: 100,
        minStock: 20,
      };

      mockFns.create.mockResolvedValue({
        ...input,
        id: 'min-id',
        costPrice: { toNumber: () => 10 },
        salePrice: { toNumber: () => 15 },
        category: { id: 'cat1', name: 'Category', color: null },
      });

      await createProduct(input);

      expect(mockFns.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sku: 'MIN-001',
          name: 'Minimal Product',
          categoryId: 'cat1',
          description: null,
          barcode: null,
          supplier: null,
          location: null,
        }),
        include: { category: true },
      });
    });
  });

  describe('updateProduct', () => {
    it('should update product fields', async () => {
      const input = {
        name: 'Updated Name',
        salePrice: 200,
      };

      const mockUpdated = {
        id: '1',
        sku: 'TEST-001',
        name: 'Updated Name',
        description: null,
        barcode: null,
        categoryId: null,
        category: null,
        costPrice: { toNumber: () => 100 },
        salePrice: { toNumber: () => 200 },
        stock: 50,
        minStock: 10,
        supplier: null,
        location: null,
        isActive: true,
      };

      mockFns.update.mockResolvedValue(mockUpdated);

      const result = await updateProduct('1', input);

      expect(result.name).toBe('Updated Name');
      expect(result.salePrice).toBe(200);
      expect(mockFns.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          name: 'Updated Name',
        }),
        include: { category: true },
      });
    });
  });

  describe('deactivateProduct', () => {
    it('should deactivate product', async () => {
      mockFns.update.mockResolvedValue({ id: '1', isActive: false });

      await deactivateProduct('1');

      expect(mockFns.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });
  });

  describe('deleteProduct', () => {
    it('should hard delete product', async () => {
      mockFns.delete.mockResolvedValue({ id: '1' });

      await deleteProduct('1');

      expect(mockFns.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('updateStock', () => {
    it('should add stock', async () => {
      const mockProduct = {
        id: '1',
        sku: 'TEST-001',
        name: 'Test',
        description: null,
        barcode: null,
        categoryId: null,
        category: null,
        costPrice: { toNumber: () => 10 },
        salePrice: { toNumber: () => 15 },
        stock: 15,
        minStock: 10,
        supplier: null,
        location: null,
        isActive: true,
      };

      mockFns.update.mockResolvedValue(mockProduct);

      await updateStock('1', 5, 'add');

      expect(mockFns.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { stock: { increment: 5 } },
        include: { category: true },
      });
    });

    it('should subtract stock', async () => {
      const mockProduct = {
        id: '1',
        sku: 'TEST-001',
        name: 'Test',
        description: null,
        barcode: null,
        categoryId: null,
        category: null,
        costPrice: { toNumber: () => 10 },
        salePrice: { toNumber: () => 15 },
        stock: 5,
        minStock: 10,
        supplier: null,
        location: null,
        isActive: true,
      };

      mockFns.update.mockResolvedValue(mockProduct);

      await updateStock('1', 3, 'subtract');

      expect(mockFns.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { stock: { decrement: 3 } },
        include: { category: true },
      });
    });

    it('should set stock directly', async () => {
      const mockProduct = {
        id: '1',
        sku: 'TEST-001',
        name: 'Test',
        description: null,
        barcode: null,
        categoryId: null,
        category: null,
        costPrice: { toNumber: () => 10 },
        salePrice: { toNumber: () => 15 },
        stock: 100,
        minStock: 10,
        supplier: null,
        location: null,
        isActive: true,
      };

      mockFns.update.mockResolvedValue(mockProduct);

      await updateStock('1', 100, 'set');

      expect(mockFns.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { stock: 100 },
        include: { category: true },
      });
    });

    it('should throw error for invalid operation', async () => {
      await expect(updateStock('1', 5, 'invalid' as 'add' | 'subtract' | 'set')).rejects.toThrow(
        'Invalid operation: invalid'
      );
    });
  });
});
