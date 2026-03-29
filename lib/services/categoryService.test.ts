/**
 * Test suite para CategoryService
 * 
 * Especificaciones relacionadas:
 * - /specs/data-architecture.md#categorías
 * - /specs/inventory-sales.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock functions factory
const mockFns = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findMany: mockFns.findMany,
      findUnique: mockFns.findUnique,
      create: mockFns.create,
      update: mockFns.update,
      delete: mockFns.delete,
    },
  },
}));

import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categoryService';

describe('CategoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCategory = {
    id: '1',
    name: 'LEDs',
    description: 'LED products',
    color: '#ff0000',
    defaultMarginPercent: 40,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { products: 5 },
  };

  describe('getCategories', () => {
    it('should return all categories with product count', async () => {
      mockFns.findMany.mockResolvedValue([mockCategory]);

      const result = await getCategories();

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].productCount).toBe(5);
      expect(result.total).toBe(1);
    });
  });

  describe('getCategoryById', () => {
    it('should return category by id', async () => {
      mockFns.findUnique.mockResolvedValue(mockCategory);

      const result = await getCategoryById('1');

      expect(result).toBeDefined();
      expect(result?.name).toBe('LEDs');
      expect(result?.productCount).toBe(5);
    });

    it('should return null if category not found', async () => {
      mockFns.findUnique.mockResolvedValue(null);

      const result = await getCategoryById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createCategory', () => {
    it('should create category with default margin', async () => {
      const input = {
        name: 'New Category',
        description: 'Description',
        color: '#00ff00',
      };

      mockFns.create.mockResolvedValue({
        id: 'new-id',
        ...input,
        defaultMarginPercent: 40,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { products: 0 },
      });

      const result = await createCategory(input);

      expect(result.id).toBe('new-id');
      expect(result.defaultMarginPercent).toBe(40);
    });

    it('should create category with custom margin', async () => {
      const input = {
        name: 'Premium',
        defaultMarginPercent: 60,
      };

      mockFns.create.mockResolvedValue({
        id: 'new-id',
        ...input,
        description: null,
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { products: 0 },
      });

      const result = await createCategory(input);

      expect(result.defaultMarginPercent).toBe(60);
    });
  });

  describe('updateCategory', () => {
    it('should update category fields', async () => {
      const input = {
        name: 'Updated Name',
        defaultMarginPercent: 50,
      };

      mockFns.update.mockResolvedValue({
        ...mockCategory,
        ...input,
      });

      const result = await updateCategory('1', input);

      expect(result.name).toBe('Updated Name');
      expect(result.defaultMarginPercent).toBe(50);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', async () => {
      mockFns.delete.mockResolvedValue({ id: '1' });

      await deleteCategory('1');

      expect(mockFns.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
