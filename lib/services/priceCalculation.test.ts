/**
 * Price Calculation Service Tests
 *
 * Tests for the centralized price calculation service:
 * - Lista sin base (comportamiento actual)
 * - Lista basada en otra lista (1 nivel)
 * - Cadena de 3 niveles (A→B→C→costo)
 * - Detección de ciclo (A→B→A)
 * - Excepciones (fixedPrice, overrideMargin) en cualquier nivel
 * - isBelowMinimum siempre contra costo real
 * - Batch con múltiples productos y listas
 * - PriceCalcContext evita queries duplicadas
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PriceCalcContext,
  CircularReferenceError,
  resolveBasePrice,
  calculateListItemPriceSync,
  calculateBatchPrices,
  calculateListItemPrice,
  validateNoCycle,
} from './priceCalculationService';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('./settingsService', () => ({
  getMinimumMargin: vi.fn(() => Promise.resolve(15)),
}));

vi.mock('./priceListService', () => ({
  getProductBaseCost: vi.fn((replacement: unknown, cost: unknown) => {
    const r = replacement !== null && replacement !== undefined ? Number(replacement) : 0;
    return r > 0 ? r : (cost !== null && cost !== undefined ? Number(cost) : 0);
  }),
}));

// vi.hoisted runs before vi.mock factory
const { mockFns } = vi.hoisted(() => ({
  mockFns: {
    priceListFindMany: vi.fn(),
    priceListFindFirst: vi.fn(),
    productFindMany: vi.fn(),
    priceListItemFindMany: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      priceList: {
        findMany: mockFns.priceListFindMany,
        findFirst: mockFns.priceListFindFirst,
      },
      product: {
        findMany: mockFns.productFindMany,
      },
      priceListItem: {
        findMany: mockFns.priceListItemFindMany,
      },
    },
  },
}));

describe('PriceCalcContext', () => {
  it('returns real cost using replacementCost when > 0', () => {
    const ctx = new PriceCalcContext();
    ctx.products.set('p1', { id: 'p1', replacementCost: 150, costPrice: 100 });
    expect(ctx.getRealCost('p1')).toBe(150);
  });

  it('falls back to costPrice when replacementCost is 0', () => {
    const ctx = new PriceCalcContext();
    ctx.products.set('p1', { id: 'p1', replacementCost: 0, costPrice: 100 });
    expect(ctx.getRealCost('p1')).toBe(100);
  });

  it('caches minimum margin after first load', async () => {
    const ctx = new PriceCalcContext();
    const m1 = await ctx.getMinMargin();
    const m2 = await ctx.getMinMargin();
    expect(m1).toBe(15);
    expect(m2).toBe(15);
  });

  it('throws when list not loaded', () => {
    const ctx = new PriceCalcContext();
    expect(() => ctx.getList('missing')).toThrow('not loaded in context');
  });

  it('returns empty exceptions map for unknown list', () => {
    const ctx = new PriceCalcContext();
    expect(ctx.getExceptions('unknown').size).toBe(0);
  });
});

describe('calculateListItemPriceSync - lista sin base', () => {
  function buildCtx() {
    const ctx = new PriceCalcContext();
    ctx.lists.set('list-A', {
      id: 'list-A',
      baseMarginPercentage: 40,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: null,
      isActive: true,
    });
    ctx.products.set('p1', { id: 'p1', replacementCost: 100, costPrice: 80 });
    return ctx;
  }

  it('calculates price from real cost with base margin', () => {
    const ctx = buildCtx();
    const result = calculateListItemPriceSync('p1', 'list-A', ctx);
    // 100 * 1.4 = 140, SMART_HUNDREDS rounds to nearest 10 = 140
    expect(result.finalPrice).toBe(140);
    expect(result.basePrice).toBe(100);
    expect(result.realCost).toBe(100);
    expect(result.appliedMargin).toBe(40);
    expect(result.isFixed).toBe(false);
    expect(result.overrideMargin).toBeNull();
  });

  it('uses overrideMarginPercentage when exception exists', () => {
    const ctx = buildCtx();
    ctx.exceptions.set('list-A', new Map([
      ['p1', { overrideMarginPercentage: 50, fixedPrice: null }],
    ]));
    const result = calculateListItemPriceSync('p1', 'list-A', ctx);
    // 100 * 1.5 = 150, rounds to 150
    expect(result.finalPrice).toBe(150);
    expect(result.appliedMargin).toBe(50);
    expect(result.overrideMargin).toBe(50);
  });

  it('uses fixedPrice when exception exists (no rounding)', () => {
    const ctx = buildCtx();
    ctx.exceptions.set('list-A', new Map([
      ['p1', { overrideMarginPercentage: null, fixedPrice: 199.99 }],
    ]));
    const result = calculateListItemPriceSync('p1', 'list-A', ctx);
    expect(result.finalPrice).toBe(199.99);
    expect(result.isFixed).toBe(true);
    expect(result.appliedMargin).toBe(0);
  });

  it('fixedPrice takes priority over overrideMarginPercentage', () => {
    const ctx = buildCtx();
    ctx.exceptions.set('list-A', new Map([
      ['p1', { overrideMarginPercentage: 50, fixedPrice: 200 }],
    ]));
    const result = calculateListItemPriceSync('p1', 'list-A', ctx);
    expect(result.finalPrice).toBe(200);
    expect(result.isFixed).toBe(true);
  });

  it('actualMargin is computed against real cost, not base price', () => {
    const ctx = buildCtx();
    ctx.exceptions.set('list-A', new Map([
      ['p1', { overrideMarginPercentage: null, fixedPrice: 130 }],
    ]));
    const result = calculateListItemPriceSync('p1', 'list-A', ctx);
    // (130 - 100) / 100 * 100 = 30
    expect(result.actualMargin).toBe(30);
  });
});

describe('calculateListItemPriceSync - lista basada en otra lista (1 nivel)', () => {
  function buildCtx() {
    const ctx = new PriceCalcContext();
    // Contado: sin base, margen 40%
    ctx.lists.set('contado', {
      id: 'contado',
      baseMarginPercentage: 40,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: null,
      isActive: true,
    });
    // Tarjetas: base = contado, margen 10%
    ctx.lists.set('tarjetas', {
      id: 'tarjetas',
      baseMarginPercentage: 10,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: 'contado',
      isActive: true,
    });
    ctx.products.set('p1', { id: 'p1', replacementCost: 100, costPrice: 80 });
    return ctx;
  }

  it('tarjetas price = contado final price * 1.10', () => {
    const ctx = buildCtx();
    const contado = calculateListItemPriceSync('p1', 'contado', ctx);
    const tarjetas = calculateListItemPriceSync('p1', 'tarjetas', ctx);
    // contado: 100 * 1.4 = 140
    expect(contado.finalPrice).toBe(140);
    // tarjetas base = 140, 140 * 1.1 = 154, rounds to 150
    expect(tarjetas.basePrice).toBe(140);
    expect(tarjetas.finalPrice).toBe(150);
  });

  it('isBelowMinimum uses real cost not base price', async () => {
    const ctx = buildCtx();
    // Tarjetas with a very low fixed price → below minimum margin (15%)
    ctx.exceptions.set('tarjetas', new Map([
      ['p1', { overrideMarginPercentage: null, fixedPrice: 110 }],
    ]));
    const calc = calculateListItemPriceSync('p1', 'tarjetas', ctx);
    const minMargin = await ctx.getMinMargin();
    // real cost = 100, price = 110 → margin 10% < 15%
    expect(calc.actualMargin).toBe(10);
    expect(calc.actualMargin < minMargin).toBe(true);
  });
});

describe('calculateListItemPriceSync - cadena de 3 niveles', () => {
  function buildCtx() {
    const ctx = new PriceCalcContext();
    // C: sin base, margen 100%
    ctx.lists.set('list-C', {
      id: 'list-C',
      baseMarginPercentage: 100,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: null,
      isActive: true,
    });
    // B: base = C, margen 50%
    ctx.lists.set('list-B', {
      id: 'list-B',
      baseMarginPercentage: 50,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: 'list-C',
      isActive: true,
    });
    // A: base = B, margen 10%
    ctx.lists.set('list-A', {
      id: 'list-A',
      baseMarginPercentage: 10,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: 'list-B',
      isActive: true,
    });
    ctx.products.set('p1', { id: 'p1', replacementCost: 100, costPrice: 80 });
    return ctx;
  }

  it('resolves chain A→B→C→costo', () => {
    const ctx = buildCtx();
    const c = calculateListItemPriceSync('p1', 'list-C', ctx);
    const b = calculateListItemPriceSync('p1', 'list-B', ctx);
    const a = calculateListItemPriceSync('p1', 'list-A', ctx);

    // C: 100 * 2 = 200 → 200
    expect(c.finalPrice).toBe(200);
    // B: base 200, 200 * 1.5 = 300 → 300
    expect(b.finalPrice).toBe(300);
    expect(b.basePrice).toBe(200);
    // A: base 300, 300 * 1.1 = 330 → 330
    expect(a.finalPrice).toBe(330);
    expect(a.basePrice).toBe(300);
  });

  it('actualMargin at top of chain is against real cost', () => {
    const ctx = buildCtx();
    const a = calculateListItemPriceSync('p1', 'list-A', ctx);
    // real cost 100, final 330 → margin 230%
    expect(a.realCost).toBe(100);
    expect(a.actualMargin).toBeCloseTo(230, 5);
  });
});

describe('Detección de ciclos', () => {
  it('throws CircularReferenceError on direct self-reference', () => {
    const ctx = new PriceCalcContext();
    ctx.lists.set('list-A', {
      id: 'list-A',
      baseMarginPercentage: 40,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: 'list-A', // self-reference
      isActive: true,
    });
    ctx.products.set('p1', { id: 'p1', replacementCost: 100, costPrice: 80 });
    expect(() => calculateListItemPriceSync('p1', 'list-A', ctx)).toThrow(CircularReferenceError);
  });

  it('throws CircularReferenceError on A→B→A cycle', () => {
    const ctx = new PriceCalcContext();
    ctx.lists.set('list-A', {
      id: 'list-A',
      baseMarginPercentage: 40,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: 'list-B',
      isActive: true,
    });
    ctx.lists.set('list-B', {
      id: 'list-B',
      baseMarginPercentage: 40,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: 'list-A',
      isActive: true,
    });
    ctx.products.set('p1', { id: 'p1', replacementCost: 100, costPrice: 80 });
    expect(() => calculateListItemPriceSync('p1', 'list-A', ctx)).toThrow(CircularReferenceError);
  });

  it('resolveBasePrice throws on cycle', () => {
    const ctx = new PriceCalcContext();
    ctx.lists.set('list-A', {
      id: 'list-A',
      baseMarginPercentage: 40,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: 'list-B',
      isActive: true,
    });
    ctx.lists.set('list-B', {
      id: 'list-B',
      baseMarginPercentage: 40,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: 'list-A',
      isActive: true,
    });
    ctx.products.set('p1', { id: 'p1', replacementCost: 100, costPrice: 80 });
    expect(() => resolveBasePrice('p1', 'list-A', ctx)).toThrow(CircularReferenceError);
  });
});

describe('Excepciones en cualquier nivel de la cadena', () => {
  it('fixedPrice en lista base se propaga como base de la lista dependiente', () => {
    const ctx = new PriceCalcContext();
    ctx.lists.set('contado', {
      id: 'contado',
      baseMarginPercentage: 40,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: null,
      isActive: true,
    });
    ctx.lists.set('tarjetas', {
      id: 'tarjetas',
      baseMarginPercentage: 10,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: 'contado',
      isActive: true,
    });
    ctx.products.set('p1', { id: 'p1', replacementCost: 100, costPrice: 80 });
    // Contado has a fixed price of 180
    ctx.exceptions.set('contado', new Map([
      ['p1', { overrideMarginPercentage: null, fixedPrice: 180 }],
    ]));

    const tarjetas = calculateListItemPriceSync('p1', 'tarjetas', ctx);
    // base = 180 (contado fixed), 180 * 1.1 = 198 → 200
    expect(tarjetas.basePrice).toBe(180);
    expect(tarjetas.finalPrice).toBe(200);
  });

  it('overrideMargin en lista base afecta el precio final propagado', () => {
    const ctx = new PriceCalcContext();
    ctx.lists.set('contado', {
      id: 'contado',
      baseMarginPercentage: 40,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: null,
      isActive: true,
    });
    ctx.lists.set('tarjetas', {
      id: 'tarjetas',
      baseMarginPercentage: 10,
      roundingRule: 'SMART_HUNDREDS',
      basePriceListId: 'contado',
      isActive: true,
    });
    ctx.products.set('p1', { id: 'p1', replacementCost: 100, costPrice: 80 });
    // Contado override margin 60% → 100 * 1.6 = 160
    ctx.exceptions.set('contado', new Map([
      ['p1', { overrideMarginPercentage: 60, fixedPrice: null }],
    ]));

    const tarjetas = calculateListItemPriceSync('p1', 'tarjetas', ctx);
    // base = 160, 160 * 1.1 = 176 → 180
    expect(tarjetas.basePrice).toBe(160);
    expect(tarjetas.finalPrice).toBe(180);
  });
});

describe('calculateBatchPrices', () => {
  function setupMocks() {
    mockFns.priceListFindMany.mockImplementation(async (opts: any) => {
      const ids = opts?.where?.value as string[] | undefined;
      const all = [
        { id: 'contado', baseMarginPercentage: '40', roundingRule: 'SMART_HUNDREDS', basePriceListId: null, isActive: true },
        { id: 'tarjetas', baseMarginPercentage: '10', roundingRule: 'SMART_HUNDREDS', basePriceListId: 'contado', isActive: true },
      ];
      if (!ids) return all;
      return all.filter((l) => ids.includes(l.id));
    });
    mockFns.productFindMany.mockResolvedValue([
      { id: 'p1', replacementCost: '100', costPrice: '80' },
      { id: 'p2', replacementCost: '200', costPrice: '150' },
    ]);
    mockFns.priceListItemFindMany.mockResolvedValue([]);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it('returns prices for all products across all lists', async () => {
    const result = await calculateBatchPrices(['p1', 'p2'], ['contado', 'tarjetas']);

    expect(result.has('p1')).toBe(true);
    expect(result.has('p2')).toBe(true);
    expect(result.get('p1')?.has('contado')).toBe(true);
    expect(result.get('p1')?.has('tarjetas')).toBe(true);

    // p1 contado: 100 * 1.4 = 140
    expect(result.get('p1')?.get('contado')?.finalPrice).toBe(140);
    // p1 tarjetas: 140 * 1.1 = 154 → 150
    expect(result.get('p1')?.get('tarjetas')?.finalPrice).toBe(150);
    // p2 contado: 200 * 1.4 = 280
    expect(result.get('p2')?.get('contado')?.finalPrice).toBe(280);
  });

  it('sets isBelowMinimum against real cost', async () => {
    const result = await calculateBatchPrices(['p1'], ['contado']);
    const calc = result.get('p1')?.get('contado');
    // 140 vs cost 100 → margin 40% > 15% → not below
    expect(calc?.isBelowMinimum).toBe(false);
    expect(calc?.actualMargin).toBe(40);
  });

  it('skips products not found in context', async () => {
    mockFns.productFindMany.mockResolvedValue([
      { id: 'p1', replacementCost: '100', costPrice: '80' },
    ]);
    const result = await calculateBatchPrices(['p1', 'missing'], ['contado']);
    expect(result.has('missing')).toBe(false);
    expect(result.has('p1')).toBe(true);
  });

  it('returns empty map for empty inputs', async () => {
    const result = await calculateBatchPrices([], ['contado']);
    expect(result.size).toBe(0);
  });

  it('PriceCalcContext batch preload avoids duplicate list queries', async () => {
    let findManyCalls = 0;
    mockFns.priceListFindMany.mockImplementation(async () => {
      findManyCalls++;
      return [
        { id: 'contado', baseMarginPercentage: '40', roundingRule: 'SMART_HUNDREDS', basePriceListId: null, isActive: true },
        { id: 'tarjetas', baseMarginPercentage: '10', roundingRule: 'SMART_HUNDREDS', basePriceListId: 'contado', isActive: true },
      ];
    });
    mockFns.productFindMany.mockResolvedValue([
      { id: 'p1', replacementCost: '100', costPrice: '80' },
    ]);
    mockFns.priceListItemFindMany.mockResolvedValue([]);

    await calculateBatchPrices(['p1'], ['tarjetas']);

    // Should load tarjetas + contado (its base) — at most 2 batch queries
    // (one for the initial set, one for the transitive base). Not one per list.
    expect(findManyCalls).toBeLessThanOrEqual(2);
  });
});

describe('calculateListItemPrice (async single)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFns.priceListFindMany.mockResolvedValue([
      { id: 'contado', baseMarginPercentage: '40', roundingRule: 'SMART_HUNDREDS', basePriceListId: null, isActive: true },
    ]);
    mockFns.productFindMany.mockResolvedValue([
      { id: 'p1', replacementCost: '100', costPrice: '80' },
    ]);
    mockFns.priceListItemFindMany.mockResolvedValue([]);
  });

  it('calculates single product price with isBelowMinimum', async () => {
    const result = await calculateListItemPrice('p1', 'contado');
    expect(result.finalPrice).toBe(140);
    expect(result.isBelowMinimum).toBe(false);
    expect(result.actualMargin).toBe(40);
  });
});

describe('validateNoCycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts null base (no base)', async () => {
    await expect(validateNoCycle('list-A', null)).resolves.toBeUndefined();
  });

  it('rejects self-reference', async () => {
    await expect(validateNoCycle('list-A', 'list-A')).rejects.toThrow(CircularReferenceError);
  });

  it('walks the chain and detects cycle A→B→A', async () => {
    mockFns.priceListFindFirst
      .mockResolvedValueOnce({ id: 'list-B', basePriceListId: 'list-A' });

    await expect(validateNoCycle('list-A', 'list-B')).rejects.toThrow(CircularReferenceError);
  });

  it('accepts valid chain A→B→C→null', async () => {
    mockFns.priceListFindFirst
      .mockResolvedValueOnce({ id: 'list-B', basePriceListId: 'list-C' })
      .mockResolvedValueOnce({ id: 'list-C', basePriceListId: null });

    await expect(validateNoCycle('list-A', 'list-B')).resolves.toBeUndefined();
  });

  it('stops when base references non-existent list', async () => {
    mockFns.priceListFindFirst.mockResolvedValue(null);
    await expect(validateNoCycle('list-A', 'ghost')).resolves.toBeUndefined();
  });
});
