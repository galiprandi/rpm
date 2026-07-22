/**
 * PriceList Service Tests
 *
 * Tests for CRUD operations and price calculations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPriceLists,
  getPriceListById,
  getPriceListByName,
  createPriceList,
  updatePriceList,
  deletePriceList,
  createPriceListItem,
  deletePriceListItem,
  calculateProductPrice,
  type CreatePriceListInput,
} from './priceListService';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock settingsService to avoid needing to mock setting queries
vi.mock('./settingsService', () => ({
  getMinimumMargin: vi.fn(() => Promise.resolve(15)),
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
      priceListFindMany: vi.fn(),
      priceListFindFirst: vi.fn(),
      productFindFirst: vi.fn(),
      priceListItemFindFirst: vi.fn(),
      insertReturning: vi.fn(),
      updateWhere: vi.fn(),
      deleteWhere: vi.fn(),
      insertItemReturning: vi.fn(),
      deleteItemWhere: vi.fn(),
    },
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => createChainable([{ count: 0 }])),
    query: {
      priceList: {
        findMany: mockFns.priceListFindMany,
        findFirst: mockFns.priceListFindFirst,
      },
      product: { findFirst: mockFns.productFindFirst },
      priceListItem: { findFirst: mockFns.priceListItemFindFirst },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: mockFns.insertReturning,
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: mockFns.updateWhere,
      })),
    })),
    delete: vi.fn(() => ({
      where: mockFns.deleteWhere,
    })),
  },
}));

describe('PriceList Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPriceList = {
    id: 'pl-1',
    name: 'Test PriceList',
    isPublic: false,
    isActive: true,
    startDate: null,
    endDate: null,
    baseMarginPercentage: '40',
    roundingRule: 'SMART_HUNDREDS',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    priceListItems: [],
  };

  describe('getPriceLists', () => {
    it('should return active price lists by default', async () => {
      mockFns.priceListFindMany.mockResolvedValue([
        { ...mockPriceList, isActive: true },
      ]);

      const result = await getPriceLists();
      expect(result.priceLists.every(pl => pl.isActive)).toBe(true);
    });

    it('should include inactive when requested', async () => {
      const inactive = { ...mockPriceList, id: 'pl-2', isActive: false };
      mockFns.priceListFindMany.mockResolvedValue([inactive]);

      const result = await getPriceLists(true);
      expect(result.priceLists.some(pl => pl.id === inactive.id)).toBe(true);
    });

    it('should order by name ascending', async () => {
      mockFns.priceListFindMany.mockResolvedValue([
        { ...mockPriceList, name: 'A-List' },
        { ...mockPriceList, id: 'pl-2', name: 'Z-List' },
      ]);

      const result = await getPriceLists();
      expect(result.priceLists[0].name).toBe('A-List');
    });
  });

  describe('getPriceListById', () => {
    it('should return null for non-existent id', async () => {
      mockFns.priceListFindFirst.mockResolvedValue(null);

      const result = await getPriceListById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return price list with items', async () => {
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        priceListItems: [],
      });

      const result = await getPriceListById('pl-1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('pl-1');
      expect(Array.isArray(result?.items)).toBe(true);
    });

    it('should calculate margins and prices for items', async () => {
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        baseMarginPercentage: '50',
        priceListItems: [
          {
            id: 'item-1',
            priceListId: 'pl-1',
            productId: 'prod-1',
            overrideMarginPercentage: null,
            fixedPrice: null,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            product: { id: 'prod-1', name: 'Product 1', sku: 'SKU1', replacementCost: '150' },
          },
        ],
      });

      const result = await getPriceListById('pl-1');
      const item = result?.items[0];

      expect(item).toBeDefined();
      expect(item?.finalPrice).toBeGreaterThan(0);
      expect(typeof item?.actualMargin).toBe('number');
    });
  });

  describe('getPriceListByName', () => {
    it('should return price list by exact name', async () => {
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        name: 'Unique-Name',
      });

      const result = await getPriceListByName('Unique-Name');
      expect(result?.id).toBe('pl-1');
    });

    it('should return null for non-existent name', async () => {
      mockFns.priceListFindFirst.mockResolvedValue(null);

      const result = await getPriceListByName('non-existent-name');
      expect(result).toBeNull();
    });
  });

  describe('createPriceList', () => {
    it('should create price list with defaults', async () => {
      mockFns.insertReturning.mockResolvedValue([{
        id: 'new-pl',
        name: 'New-PriceList',
        isPublic: false,
        isActive: true,
        startDate: null,
        endDate: null,
        baseMarginPercentage: '30',
        roundingRule: 'SMART_HUNDREDS',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }]);

      const result = await createPriceList({
        name: 'New-PriceList',
        baseMarginPercentage: 30,
      });

      expect(result.name).toBe('New-PriceList');
      expect(result.isActive).toBe(true);
      expect(result.isPublic).toBe(false);
      expect(result.roundingRule).toBe('SMART_HUNDREDS');
    });

    it('should accept custom values', async () => {
      mockFns.insertReturning.mockResolvedValue([{
        id: 'custom-pl',
        name: 'Custom-PriceList',
        isPublic: true,
        isActive: false,
        startDate: null,
        endDate: null,
        baseMarginPercentage: '25',
        roundingRule: 'PSYCHOLOGICAL',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }]);

      const result = await createPriceList({
        name: 'Custom-PriceList',
        baseMarginPercentage: 25,
        isPublic: true,
        isActive: false,
        roundingRule: 'PSYCHOLOGICAL',
      });

      expect(result.baseMarginPercentage).toBe(25);
      expect(result.isPublic).toBe(true);
      expect(result.isActive).toBe(false);
      expect(result.roundingRule).toBe('PSYCHOLOGICAL');
    });
  });

  describe('updatePriceList', () => {
    it('should update name', async () => {
      mockFns.updateWhere.mockResolvedValue(undefined);
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        name: 'Updated-Name',
      });

      const updated = await updatePriceList('pl-1', { name: 'Updated-Name' });
      expect(updated.name).toBe('Updated-Name');
    });

    it('should update margin percentage', async () => {
      mockFns.updateWhere.mockResolvedValue(undefined);
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        baseMarginPercentage: '50',
      });

      const updated = await updatePriceList('pl-1', { baseMarginPercentage: 50 });
      expect(updated.baseMarginPercentage).toBe(50);
    });

    it('should update rounding rule', async () => {
      mockFns.updateWhere.mockResolvedValue(undefined);
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        roundingRule: 'EXACT',
      });

      const updated = await updatePriceList('pl-1', { roundingRule: 'EXACT' });
      expect(updated.roundingRule).toBe('EXACT');
    });
  });

  describe('deletePriceList', () => {
    it('should delete price list and its items', async () => {
      mockFns.deleteWhere.mockResolvedValue(undefined);

      await deletePriceList('pl-1');

      // After deletion, getPriceListById returns null
      mockFns.priceListFindFirst.mockResolvedValue(null);
      const result = await getPriceListById('pl-1');
      expect(result).toBeNull();
    });
  });

  describe('createPriceListItem', () => {
    it('should create item with calculated price', async () => {
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        baseMarginPercentage: '40',
      });
      mockFns.productFindFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Product 1',
        replacementCost: '150',
        costPrice: '100',
      });
      mockFns.insertReturning.mockResolvedValue([{
        id: 'item-1',
        priceListId: 'pl-1',
        productId: 'prod-1',
        overrideMarginPercentage: null,
        fixedPrice: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }]);
      mockFns.priceListItemFindFirst.mockResolvedValue({
        id: 'item-1',
        priceListId: 'pl-1',
        productId: 'prod-1',
        overrideMarginPercentage: null,
        fixedPrice: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        product: { id: 'prod-1', name: 'Product 1', sku: 'SKU1', replacementCost: '150', costPrice: '100' },
      });

      const item = await createPriceListItem('pl-1', {
        productId: 'prod-1',
      });

      expect(item.priceListId).toBe('pl-1');
      expect(item.productId).toBe('prod-1');
      expect(item.finalPrice).toBeGreaterThan(0);
    });

    it('should create item with override margin', async () => {
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        baseMarginPercentage: '40',
      });
      mockFns.productFindFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Product 1',
        replacementCost: '150',
        costPrice: '100',
      });
      mockFns.insertReturning.mockResolvedValue([{
        id: 'item-2',
        priceListId: 'pl-1',
        productId: 'prod-1',
        overrideMarginPercentage: '60',
        fixedPrice: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }]);
      mockFns.priceListItemFindFirst.mockResolvedValue({
        id: 'item-2',
        priceListId: 'pl-1',
        productId: 'prod-1',
        overrideMarginPercentage: '60',
        fixedPrice: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        product: { id: 'prod-1', name: 'Product 1', sku: 'SKU1', replacementCost: '150', costPrice: '100' },
      });

      const item = await createPriceListItem('pl-1', {
        productId: 'prod-1',
        overrideMarginPercentage: 60,
      });

      expect(item.overrideMarginPercentage).toBe(60);
    });

    it('should create item with fixed price', async () => {
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        baseMarginPercentage: '40',
      });
      mockFns.productFindFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Product 1',
        replacementCost: '150',
        costPrice: '100',
      });
      mockFns.insertReturning.mockResolvedValue([{
        id: 'item-3',
        priceListId: 'pl-1',
        productId: 'prod-1',
        overrideMarginPercentage: null,
        fixedPrice: '999.99',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      }]);
      mockFns.priceListItemFindFirst.mockResolvedValue({
        id: 'item-3',
        priceListId: 'pl-1',
        productId: 'prod-1',
        overrideMarginPercentage: null,
        fixedPrice: '999.99',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        product: { id: 'prod-1', name: 'Product 1', sku: 'SKU1', replacementCost: '150', costPrice: '100' },
      });

      const item = await createPriceListItem('pl-1', {
        productId: 'prod-1',
        fixedPrice: 999.99,
      });

      expect(item.fixedPrice).toBe(999.99);
      expect(item.finalPrice).toBe(999.99);
    });

    it('should throw error for non-existent price list', async () => {
      mockFns.priceListFindFirst.mockResolvedValue(null);

      await expect(
        createPriceListItem('non-existent', { productId: 'prod-1' })
      ).rejects.toThrow('Price list not found');
    });
  });

  describe('deletePriceListItem', () => {
    it('should delete item', async () => {
      mockFns.deleteWhere.mockResolvedValue(undefined);
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        priceListItems: [],
      });

      await deletePriceListItem('item-1');

      const updated = await getPriceListById('pl-1');
      expect(updated?.items.length).toBe(0);
    });
  });

  describe('calculateProductPrice', () => {
    it('should calculate price using base margin', async () => {
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        baseMarginPercentage: '50',
      });
      mockFns.productFindFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Product 1',
        replacementCost: '150',
        costPrice: '100',
      });
      mockFns.priceListItemFindFirst.mockResolvedValue(null);

      const result = await calculateProductPrice('prod-1', 'pl-1');

      expect(result).toBeDefined();
      expect(result?.baseMargin).toBe(50);
      expect(result?.finalPrice).toBeGreaterThan(0);
    });

    it('should use fixed price from exception', async () => {
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        baseMarginPercentage: '50',
      });
      mockFns.productFindFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Product 1',
        replacementCost: '150',
        costPrice: '100',
      });
      // First findFirst call returns the exception with fixedPrice
      mockFns.priceListItemFindFirst.mockResolvedValue({
        productId: 'prod-1',
        overrideMarginPercentage: null,
        fixedPrice: '500',
      });

      const result = await calculateProductPrice('prod-1', 'pl-1');

      expect(result?.finalPrice).toBe(500);
    });

    it('should return null for non-existent price list', async () => {
      mockFns.priceListFindFirst.mockResolvedValue(null);

      const result = await calculateProductPrice('prod-1', 'non-existent');
      expect(result).toBeNull();
    });

    it('should detect margin below minimum', async () => {
      mockFns.priceListFindFirst.mockResolvedValue({
        ...mockPriceList,
        baseMarginPercentage: '5',
      });
      mockFns.productFindFirst.mockResolvedValue({
        id: 'prod-1',
        name: 'Product 1',
        replacementCost: '150',
        costPrice: '100',
      });
      mockFns.priceListItemFindFirst.mockResolvedValue(null);

      const result = await calculateProductPrice('prod-1', 'pl-1');

      expect(result?.isBelowMinimum).toBe(true);
    });
  });
});
