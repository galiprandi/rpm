import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchProducts } from './searchService';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
  },
}));

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('performs fuzzy search and returns relevant results', async () => {
    const { prisma } = await import('@/lib/prisma');
    
    // Mock fuzzy search with 2+ results
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      {
        id: '1',
        sku: 'SKU-001',
        name: 'Aceite de Motor 5W-30',
        description: 'Aceite sintético',
        stock: 10,
        costPrice: 100,
        replacementCost: 150,
        category: { id: 'cat1', name: 'Aceites', color: null },
        supplier: { id: 'sup1', name: 'Proveedor 1' },
        location: 'A1',
        lastMovementAt: new Date(),
      },
      {
        id: '2',
        sku: 'SKU-002',
        name: 'Aceite de Motor 10W-40',
        description: 'Aceite sintético',
        stock: 5,
        costPrice: 120,
        replacementCost: 180,
        category: { id: 'cat1', name: 'Aceites', color: null },
        supplier: { id: 'sup1', name: 'Proveedor 1' },
        location: 'A2',
        lastMovementAt: new Date(),
      },
    ] as any);

    const result = await searchProducts({
      query: 'aceite',
      role: 'ADMIN',
    });

    expect(result).toContain('🔍 Resultados de búsqueda');
    expect(result).toContain('Aceite de Motor 5W-30');
    expect(result).toContain('Aceite de Motor 10W-40');
    expect(result).toContain('fuzzy');
  });

  it('filters results by role', async () => {
    const { prisma } = await import('@/lib/prisma');
    
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([
      {
        id: '1',
        sku: 'SKU-001',
        name: 'Producto Test',
        description: 'Descripción',
        stock: 10,
        costPrice: 100,
        replacementCost: 150,
        category: { id: 'cat1', name: 'Categoría', color: null },
        supplier: { id: 'sup1', name: 'Proveedor' },
        location: 'A1',
        lastMovementAt: new Date(),
      },
    ] as any);

    const adminResult = await searchProducts({
      query: 'test',
      role: 'ADMIN',
    });

    const sellerResult = await searchProducts({
      query: 'test',
      role: 'SELLER',
    });

    // ADMIN should see costPrice
    expect(adminResult).toContain('Costo');
    // SELLER should not see costPrice
    expect(sellerResult).not.toContain('Costo');
    // Both should see replacementCost (price)
    expect(adminResult).toContain('Precio');
    expect(sellerResult).toContain('Precio');
  });

  it('falls back to category search when fuzzy < 2 results', async () => {
    const { prisma } = await import('@/lib/prisma');
    
    // Mock fuzzy search with 1 result
    vi.mocked(prisma.product.findMany)
      .mockResolvedValueOnce([
        {
          id: '1',
          sku: 'SKU-001',
          name: 'Producto Único',
          description: 'Descripción',
          stock: 10,
          costPrice: 100,
          replacementCost: 150,
          category: { id: 'cat1', name: 'Categoría', color: null },
          supplier: { id: 'sup1', name: 'Proveedor' },
          location: 'A1',
          lastMovementAt: new Date(),
        },
      ] as any)
      // Mock category search
      .mockResolvedValueOnce([
        {
          id: '2',
          sku: 'SKU-002',
          name: 'Producto Categoría 1',
          description: 'Descripción',
          stock: 5,
          costPrice: 100,
          replacementCost: 150,
          category: { id: 'cat1', name: 'Categoría', color: null },
          supplier: { id: 'sup1', name: 'Proveedor' },
          location: 'A2',
          lastMovementAt: new Date(),
        },
        {
          id: '3',
          sku: 'SKU-003',
          name: 'Producto Categoría 2',
          description: 'Descripción',
          stock: 3,
          costPrice: 100,
          replacementCost: 150,
          category: { id: 'cat1', name: 'Categoría', color: null },
          supplier: { id: 'sup1', name: 'Proveedor' },
          location: 'A3',
          lastMovementAt: new Date(),
        },
      ] as any);

    vi.mocked(prisma.category.findMany).mockResolvedValueOnce([
      { id: 'cat1', name: 'Categoría', color: null },
    ] as any);

    const result = await searchProducts({
      query: 'test',
      role: 'ADMIN',
    });

    expect(result).toContain('category');
    expect(result).toContain('Producto Categoría 1');
    expect(result).toContain('Producto Categoría 2');
  });

  it('returns all active products when no results found', async () => {
    const { prisma } = await import('@/lib/prisma');
    
    // Mock fuzzy search with 0 results
    (prisma.product.findMany as any)
      .mockResolvedValueOnce([])
      // Mock category search with 0 results
      .mockResolvedValueOnce([])
      // Mock all products search
      .mockResolvedValueOnce([
        {
          id: '1',
          sku: 'SKU-001',
          name: 'Producto 1',
          description: 'Descripción',
          stock: 10,
          costPrice: { toNumber: () => 100 },
          replacementCost: { toNumber: () => 150 },
          category: { id: 'cat1', name: 'Categoría', color: null },
          supplier: { id: 'sup1', name: 'Proveedor' },
          location: 'A1',
          lastMovementAt: new Date(),
        },
        {
          id: '2',
          sku: 'SKU-002',
          name: 'Producto 2',
          description: 'Descripción',
          stock: 5,
          costPrice: { toNumber: () => 100 },
          replacementCost: { toNumber: () => 150 },
          category: { id: 'cat1', name: 'Categoría', color: null },
          supplier: { id: 'sup1', name: 'Proveedor' },
          location: 'A2',
          lastMovementAt: new Date(),
        },
      ]);

    (prisma.category.findMany as any).mockResolvedValueOnce([]);

    const result = await searchProducts({
      query: 'inexistente',
      role: 'ADMIN',
    });

    expect(result).toContain('all');
    expect(result).toContain('Producto 1');
    expect(result).toContain('Producto 2');
  });

  it('formats results correctly in Markdown', async () => {
    const { prisma } = await import('@/lib/prisma');
    
    (prisma.product.findMany as any).mockResolvedValueOnce([
      {
        id: '1',
        sku: 'SKU-001',
        name: 'Test Product',
        description: 'Test description',
        stock: 10,
        costPrice: { toNumber: () => 100 },
        replacementCost: { toNumber: () => 150 },
        category: { id: 'cat1', name: 'Test Category', color: null },
        supplier: { id: 'sup1', name: 'Test Supplier' },
        location: 'A1',
        lastMovementAt: new Date(),
      },
    ]);

    const result = await searchProducts({
      query: 'test',
      role: 'ADMIN',
    });

    // Check Markdown formatting
    expect(result).toContain('## 🔍 Resultados de búsqueda');
    expect(result).toContain('**1. Test Product**');
    expect(result).toContain('SKU: SKU-001');
    expect(result).toContain('📊 Stock: 10 unidades');
    expect(result).toContain('💰 Precio: $150');
    expect(result).toContain('> Test description');
    expect(result).toContain('---');
    expect(result).toContain('💡 **Tip**');
  });
});
