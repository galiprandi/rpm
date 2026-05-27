import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSuggestedProductsForCount } from './inventoryCountService';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
    stock_movement: {
      groupBy: vi.fn(),
    },
  },
}));

describe('InventoryCountService - Algorithm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate risk scores correctly', async () => {
    const mockProducts = [
      { id: 'p1', name: 'Product 1', stock: 1, location: null, lastCountedAt: null }, // 100 (never) + 50 (stock 1) + 30 (no loc) = 180
      { id: 'p2', name: 'Product 2', stock: 10, location: 'A1', lastCountedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }, // 10 (age) = 10
      { id: 'p3', name: 'Product 3', stock: 5, location: '', lastCountedAt: null }, // 100 (never) + 30 (no loc) = 130
    ];

    (prisma.product.findMany as any).mockResolvedValue(mockProducts);
    (prisma.stock_movement.groupBy as any).mockResolvedValue([
      { productId: 'p2', _count: { id: 15 } } // High rotation for p2 (+40)
    ]);

    const suggested = await getSuggestedProductsForCount(3);

    expect(suggested[0].id).toBe('p1'); // 180
    expect(suggested[1].id).toBe('p3'); // 130
    expect(suggested[2].id).toBe('p2'); // 10 + 40 = 50
  });

  it('should limit the results to X', async () => {
    const mockProducts = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      name: `Product ${i}`,
      stock: 5,
      location: 'Loc',
      lastCountedAt: new Date(),
    }));

    (prisma.product.findMany as any).mockResolvedValue(mockProducts);
    (prisma.stock_movement.groupBy as any).mockResolvedValue([]);

    const suggested = await getSuggestedProductsForCount(5);
    expect(suggested).toHaveLength(5);
  });
});
