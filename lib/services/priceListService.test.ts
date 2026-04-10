/**
 * PriceList Service Integration Tests
 *
 * Tests for CRUD operations and price calculations
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
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
import { prisma } from '@/lib/prisma';
import { createCategory } from './categoryService';
import { createSupplier } from './supplierService';

// Test data helpers
async function createTestCategory() {
  return await createCategory({
    name: `Test-Category-${Date.now()}`,
  });
}

async function createTestSupplier() {
  return await createSupplier({
    name: `Test-Supplier-${Date.now()}`,
  });
}

async function createTestProduct(categoryId: string, supplierId: string) {
  return await prisma.product.create({
    data: {
      id: `test-prod-${Date.now()}`,
      name: `Test-Product-${Date.now()}`,
      costPrice: 100,
      replacementCost: 150,
      categoryId,
      supplierId,
      stock: 10,
      isActive: true,
      updatedAt: new Date(),
    },
  });
}

async function createTestPriceList(overrides: Partial<CreatePriceListInput> = {}) {
  return await createPriceList({
    name: `Test-PriceList-${Date.now()}`,
    baseMarginPercentage: 40,
    roundingRule: 'SMART_HUNDREDS',
    ...overrides,
  });
}

describe('PriceList Service', () => {
  let testCategoryId: string;
  let testSupplierId: string;
  let testProductId: string;

  beforeEach(async () => {
    // Setup test dependencies
    const category = await createTestCategory();
    const supplier = await createTestSupplier();
    testCategoryId = category.id;
    testSupplierId = supplier.id;
    const product = await createTestProduct(testCategoryId, testSupplierId);
    testProductId = product.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.price_list_item.deleteMany({});
    await prisma.price_list.deleteMany({
      where: { name: { startsWith: 'Test-' } },
    });
  });

  describe('getPriceLists', () => {
    it('should return active price lists by default', async () => {
      await createTestPriceList({ isActive: true });
      await createTestPriceList({ isActive: false });

      const result = await getPriceLists();
      expect(result.priceLists.every(pl => pl.isActive)).toBe(true);
    });

    it('should include inactive when requested', async () => {
      const inactive = await createTestPriceList({ isActive: false });

      const result = await getPriceLists(true);
      expect(result.priceLists.some(pl => pl.id === inactive.id)).toBe(true);
    });

    it('should order by name ascending', async () => {
      await createTestPriceList({ name: 'Z-List' });
      await createTestPriceList({ name: 'A-List' });

      const result = await getPriceLists();
      expect(result.priceLists[0].name).toBe('A-List');
    });
  });

  describe('getPriceListById', () => {
    it('should return null for non-existent id', async () => {
      const result = await getPriceListById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return price list with items', async () => {
      const priceList = await createTestPriceList();

      const result = await getPriceListById(priceList.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(priceList.id);
      expect(Array.isArray(result?.items)).toBe(true);
    });

    it('should calculate margins and prices for items', async () => {
      const priceList = await createTestPriceList({ baseMarginPercentage: 50 });
      await createPriceListItem(priceList.id, {
        productId: testProductId,
      });

      const result = await getPriceListById(priceList.id);
      const item = result?.items[0];

      expect(item).toBeDefined();
      expect(item?.finalPrice).toBeGreaterThan(0);
      expect(typeof item?.actualMargin).toBe('number');
    });
  });

  describe('getPriceListByName', () => {
    it('should return price list by exact name', async () => {
      const uniqueName = `Unique-Name-${Date.now()}`;
      const priceList = await createTestPriceList({ name: uniqueName });

      const result = await getPriceListByName(uniqueName);
      expect(result?.id).toBe(priceList.id);
    });

    it('should return null for non-existent name', async () => {
      const result = await getPriceListByName('non-existent-name');
      expect(result).toBeNull();
    });
  });

  describe('createPriceList', () => {
    it('should create price list with defaults', async () => {
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
      const priceList = await createTestPriceList();
      const updated = await updatePriceList(priceList.id, { name: 'Updated-Name' });
      expect(updated.name).toBe('Updated-Name');
    });

    it('should update margin percentage', async () => {
      const priceList = await createTestPriceList();
      const updated = await updatePriceList(priceList.id, { baseMarginPercentage: 50 });
      expect(updated.baseMarginPercentage).toBe(50);
    });

    it('should update rounding rule', async () => {
      const priceList = await createTestPriceList();
      const updated = await updatePriceList(priceList.id, { roundingRule: 'EXACT' });
      expect(updated.roundingRule).toBe('EXACT');
    });
  });

  describe('deletePriceList', () => {
    it('should delete price list and its items', async () => {
      const priceList = await createTestPriceList();
      await createPriceListItem(priceList.id, { productId: testProductId });

      await deletePriceList(priceList.id);

      const result = await getPriceListById(priceList.id);
      expect(result).toBeNull();
    });
  });

  describe('createPriceListItem', () => {
    it('should create item with calculated price', async () => {
      const priceList = await createTestPriceList({ baseMarginPercentage: 40 });

      const item = await createPriceListItem(priceList.id, {
        productId: testProductId,
      });

      expect(item.priceListId).toBe(priceList.id);
      expect(item.productId).toBe(testProductId);
      expect(item.finalPrice).toBeGreaterThan(0);
    });

    it('should create item with override margin', async () => {
      const priceList = await createTestPriceList({ baseMarginPercentage: 40 });

      const item = await createPriceListItem(priceList.id, {
        productId: testProductId,
        overrideMarginPercentage: 60,
      });

      expect(item.overrideMarginPercentage).toBe(60);
    });

    it('should create item with fixed price', async () => {
      const priceList = await createTestPriceList({ baseMarginPercentage: 40 });

      const item = await createPriceListItem(priceList.id, {
        productId: testProductId,
        fixedPrice: 999.99,
      });

      expect(item.fixedPrice).toBe(999.99);
      expect(item.finalPrice).toBe(999.99);
    });

    it('should throw error for non-existent price list', async () => {
      await expect(
        createPriceListItem('non-existent', { productId: testProductId })
      ).rejects.toThrow('Price list not found');
    });
  });

  describe('deletePriceListItem', () => {
    it('should delete item', async () => {
      const priceList = await createTestPriceList();
      const item = await createPriceListItem(priceList.id, { productId: testProductId });

      await deletePriceListItem(item.id);

      const updated = await getPriceListById(priceList.id);
      expect(updated?.items.length).toBe(0);
    });
  });

  describe('calculateProductPrice', () => {
    it('should calculate price using base margin', async () => {
      const priceList = await createTestPriceList({ baseMarginPercentage: 50 });

      const result = await calculateProductPrice(testProductId, priceList.id);

      expect(result).toBeDefined();
      expect(result?.baseMargin).toBe(50);
      expect(result?.finalPrice).toBeGreaterThan(0);
    });

    it('should use fixed price from exception', async () => {
      const priceList = await createTestPriceList({ baseMarginPercentage: 50 });
      await createPriceListItem(priceList.id, {
        productId: testProductId,
        fixedPrice: 500,
      });

      const result = await calculateProductPrice(testProductId, priceList.id);

      expect(result?.finalPrice).toBe(500);
      expect(result?.appliedMargin).toBe(50); // Shows base margin as applied
    });

    it('should return null for non-existent price list', async () => {
      const result = await calculateProductPrice(testProductId, 'non-existent');
      expect(result).toBeNull();
    });

    it('should detect margin below minimum', async () => {
      // Create price list with very low margin
      const priceList = await createTestPriceList({ baseMarginPercentage: 5 });

      const result = await calculateProductPrice(testProductId, priceList.id);

      expect(result?.isBelowMinimum).toBe(true);
    });
  });
});
