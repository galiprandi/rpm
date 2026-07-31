/**
 * Public Catalog Service - Read-only access to the public-facing catalog
 *
 * Returns active products and categories with publicly-safe fields only
 * (no cost prices, stock, supplier or internal margins). Prices are
 * computed from the active public price list and its per-product
 * exceptions, falling back to the category default margin when no
 * public price list exists.
 *
 * Especificaciones relacionadas:
 * - /specs/architecture/frontend-architecture.md (web pública)
 * - /specs/features/products-and-inventory.md
 * - /specs/features/sales-and-billing.md (price lists)
 *
 * Alcance del test:
 * - Cálculo de precios con/sin price list público
 * - Excepciones: fixedPrice tiene prioridad sobre overrideMarginPercentage
 * - Productos y categorías inactivas excluidas
 * - Campos sensibles no presentes en el output
 *
 * Métricas cubiertas:
 * - Cobertura esperada: >90%
 * - Performance: <100ms por query
 */

import { db } from '@/lib/db';
import { priceList, product, category } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { calculateBatchPrices } from './priceCalculationService';
import { CACHE_TAGS, CACHE_DURATIONS } from '@/lib/cache';
import { unstable_cache } from 'next/cache';

/**
 * Coerce a Drizzle numeric (string/number/null) into a number.
 */
function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// Types

/**
 * Public-facing product shape. Only contains fields safe to expose
 * on the public website (no cost, stock, supplier or internal data).
 */
export interface PublicCatalogProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  /** Single-letter fallback used when no imageUrl is available. */
  image: string;
  imageUrl: string | null;
  description: string;
  /** Placeholder array kept for template compatibility. */
  features: string[];
}

export interface PublicCatalogCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface PublicCatalogResult {
  products: PublicCatalogProduct[];
  categories: PublicCatalogCategory[];
}

// Helpers

/**
 * Load the active public price list id. Returns null when no public price
 * list is active. The actual price computation is delegated to the
 * centralized priceCalculationService (which resolves basePriceListId
 * chains and exceptions consistently).
 */
async function getPublicPriceListId(): Promise<string | null> {
  const publicPriceList = await db.query.priceList.findFirst({
    where: and(
      eq(priceList.isPublic, true),
      eq(priceList.isActive, true),
    ),
    orderBy: desc(priceList.createdAt),
    columns: { id: true },
  });

  return publicPriceList?.id ?? null;
}

/**
 * Compute the public price for a single product using the category default
 * margin fallback (when no public price list exists). Uses the same
 * rounding rule as the centralized service for consistency.
 */
function computeCategoryFallbackPrice(
  productRec: {
    costPrice: unknown;
    replacementCost: unknown;
    category: { defaultMarginPercent: unknown } | null;
  },
): number {
  const costPrice = toNumber(productRec.costPrice, 0);
  const replacementCost = toNumber(productRec.replacementCost, 0);
  const baseCost = replacementCost > 0 ? replacementCost : costPrice;
  const categoryMargin = toNumber(productRec.category?.defaultMarginPercent ?? null, 40);
  const rawPrice = baseCost * (1 + categoryMargin / 100);
  // SMART_HUNDREDS: round to nearest 10 (matches original behavior)
  return Math.round(rawPrice / 10) * 10;
}

// Public API

/**
 * Fetch the public catalog: active products with computed public prices
 * and active categories ordered by sortOrder. Only safe fields are
 * returned. Throws when the database is unreachable so the caller
 * (Server Component / API route) can surface a 500 error.
 *
 * Prices are computed via the centralized priceCalculationService so that
 * basePriceListId chains and exceptions are resolved consistently with the
 * rest of the system. Cached with unstable_cache + 'price-lists' tag.
 */
async function fetchPublicCatalog(): Promise<PublicCatalogResult> {
  const [publicListId, dbProducts, dbCategories] = await Promise.all([
    getPublicPriceListId(),
    db.query.product.findMany({
      where: eq(product.isActive, true),
      columns: {
        id: true,
        sku: true,
        name: true,
        description: true,
        imageUrl: true,
        costPrice: true,
        replacementCost: true,
      },
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            defaultMarginPercent: true,
          },
        },
      },
      orderBy: asc(product.name),
    }),
    db.query.category.findMany({
      where: eq(category.isActive, true),
      columns: { id: true, name: true, sortOrder: true },
      orderBy: asc(category.sortOrder),
    }),
  ]);

  // Compute prices via centralized service when a public list exists.
  // Falls back to category default margin otherwise.
  let priceMap: Map<string, Map<string, any>> = new Map();
  if (publicListId && dbProducts.length > 0) {
    const productIds = dbProducts.map((p) => p.id);
    priceMap = await calculateBatchPrices(productIds, [publicListId]) as any;
  }

  const products: PublicCatalogProduct[] = dbProducts.map((productRec: any) => {
    let price: number;
    if (publicListId) {
      const calc = priceMap.get(productRec.id)?.get(publicListId);
      price = calc?.finalPrice ?? computeCategoryFallbackPrice(productRec);
    } else {
      price = computeCategoryFallbackPrice(productRec);
    }
    const imageFallback = productRec.name ? productRec.name.charAt(0).toUpperCase() : 'P';
    return {
      id: productRec.id,
      sku: productRec.sku || '',
      name: productRec.name,
      category: (productRec.category as any)?.name || 'Varios',
      price,
      image: imageFallback,
      imageUrl: productRec.imageUrl || null,
      description: productRec.description || '',
      features: [],
    };
  });

  return {
    products,
    categories: dbCategories.map((c) => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sortOrder,
    })),
  };
}

/**
 * Cached public catalog. Invalidated via the 'price-lists' tag whenever
 * price lists or items are mutated (see invalidatePriceLists).
 */
export const getPublicCatalog = unstable_cache(
  fetchPublicCatalog,
  ['public-catalog'],
  {
    revalidate: CACHE_DURATIONS.PRICE_LISTS,
    tags: [CACHE_TAGS.PRICE_LISTS],
  },
);
