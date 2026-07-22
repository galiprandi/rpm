/**
 * Test suite para CategoryService
 *
 * Especificaciones relacionadas:
 * - /specs/data-architecture.md#categorías
 * - /specs/inventory-sales.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// vi.hoisted runs before vi.mock factory
const { createChainable, mockFns } = vi.hoisted(() => {
  function createChainable(resolveValue: unknown = []): any {
    const target = () => {};
    return new Proxy(target, {
      get(_t: any, prop: string) {
        if (prop === 'then') {
          return (resolve: any, reject: any) =>
            Promise.resolve(resolveValue).then(resolve, reject);
        }
        if (prop === 'catch') {
          return (onRejected: any) =>
            Promise.resolve(resolveValue).catch(onRejected);
        }
        return vi.fn(() => createChainable(resolveValue));
      },
      apply() {
        return createChainable(resolveValue);
      },
    });
  }

  return {
    createChainable,
    mockFns: {
      categoryFindMany: vi.fn(),
      categoryFindFirst: vi.fn(),
      insertReturning: vi.fn(),
      updateReturning: vi.fn(),
      deleteWhere: vi.fn(),
    },
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => createChainable([{ categoryId: '1', count: 5 }])),
    query: {
      category: {
        findMany: mockFns.categoryFindMany,
        findFirst: mockFns.categoryFindFirst,
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: mockFns.insertReturning,
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: mockFns.updateReturning,
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: mockFns.deleteWhere,
    })),
  },
}));

import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './categoryService';
import { db } from '@/lib/db';

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
    sortOrder: 0,
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  };

  describe('getCategories', () => {
    it('should return all categories with product count', async () => {
      mockFns.categoryFindMany.mockResolvedValue([mockCategory]);
      // db.select returns [{categoryId: '1', count: 5}] by default

      const result = await getCategories();

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].productCount).toBe(5);
      expect(result.total).toBe(1);
    });
  });

  describe('getCategoryById', () => {
    it('should return category by id', async () => {
      mockFns.categoryFindFirst.mockResolvedValue(mockCategory);
      // db.select for countProductsByCategory returns [{count: 5}] via chainable

      const result = await getCategoryById('1');

      expect(result).toBeDefined();
      expect(result?.name).toBe('LEDs');
      expect(result?.productCount).toBe(5);
    });

    it('should return null if category not found', async () => {
      mockFns.categoryFindFirst.mockResolvedValue(null);

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

      mockFns.insertReturning.mockResolvedValue([{
        id: 'new-id',
        ...input,
        defaultMarginPercent: 40,
        sortOrder: 0,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }]);

      const result = await createCategory(input);

      expect(result.id).toBe('new-id');
      expect(result.defaultMarginPercent).toBe(40);
    });

    it('should create category with custom margin', async () => {
      const input = {
        name: 'Premium',
        defaultMarginPercent: 60,
      };

      mockFns.insertReturning.mockResolvedValue([{
        id: 'new-id',
        ...input,
        description: null,
        color: null,
        sortOrder: 0,
        isActive: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }]);

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

      mockFns.updateReturning.mockResolvedValue([{
        ...mockCategory,
        ...input,
      }]);

      const result = await updateCategory('1', input);

      expect(result.name).toBe('Updated Name');
      expect(result.defaultMarginPercent).toBe(50);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', async () => {
      mockFns.deleteWhere.mockResolvedValue(undefined);

      await deleteCategory('1');

      expect(db.delete).toHaveBeenCalled();
    });
  });
});
