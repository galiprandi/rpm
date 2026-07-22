import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSuggestedProductsForCount } from './inventoryCountService';
import { db } from '@/lib/db';

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
      productFindMany: vi.fn(),
    },
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => createChainable([])),
    query: {
      product: { findMany: mockFns.productFindMany },
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

    mockFns.productFindMany.mockResolvedValue(mockProducts);
    // db.select for sales movements returns [{ productId: 'p2', count: 15 }]
    vi.mocked(db.select).mockReturnValue(
      createChainable([{ productId: 'p2', count: 15 }]),
    );

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

    mockFns.productFindMany.mockResolvedValue(mockProducts);
    // db.select returns empty array (no high rotation)
    vi.mocked(db.select).mockReturnValue(createChainable([]));

    const suggested = await getSuggestedProductsForCount(5);
    expect(suggested).toHaveLength(5);
  });
});
