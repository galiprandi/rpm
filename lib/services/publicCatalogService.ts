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
import { priceList, priceListItem, product, category } from '@/db/schema';
import { eq, and, isNotNull, desc, asc } from 'drizzle-orm';
import { applyRounding, RoundingRule } from '@/lib/utils/rounding';

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

interface PriceException {
  overrideMarginPercentage: number | null;
  fixedPrice: number | null;
}

interface PublicPriceListContext {
  id: string;
  baseMarginPercentage: number;
  roundingRule: RoundingRule;
  exceptions: Map<string, PriceException>;
}

/**
 * Load the active public price list together with its per-product
 * exceptions. Returns null when no public price list is active.
 */
async function loadPublicPriceListContext(): Promise<PublicPriceListContext | null> {
  const publicPriceList = await db.query.priceList.findFirst({
    where: and(
      eq(priceList.isPublic, true),
      eq(priceList.isActive, true),
    ),
    orderBy: desc(priceList.createdAt),
    columns: {
      id: true,
      baseMarginPercentage: true,
      roundingRule: true,
    },
  });

  if (!publicPriceList) return null;

  const exceptions = await db.query.priceListItem.findMany({
    where: and(
      eq(priceListItem.priceListId, publicPriceList.id),
      isNotNull(priceListItem.productId),
    ),
    columns: {
      productId: true,
      overrideMarginPercentage: true,
      fixedPrice: true,
    },
  });

  const exceptionMap = new Map<string, PriceException>();
  for (const item of exceptions) {
    if (item.productId) {
      exceptionMap.set(item.productId, {
        overrideMarginPercentage:
          item.overrideMarginPercentage !== null
            ? toNumber(item.overrideMarginPercentage, 0)
            : null,
        fixedPrice: item.fixedPrice !== null ? toNumber(item.fixedPrice, 0) : null,
      });
    }
  }

  return {
    id: publicPriceList.id,
    baseMarginPercentage: toNumber(publicPriceList.baseMarginPercentage, 0),
    roundingRule: (publicPriceList.roundingRule as RoundingRule) || 'SMART_HUNDREDS',
    exceptions: exceptionMap,
  };
}

/**
 * Compute the public price for a single product given the active
 * public price list context (or null when none exists).
 *
 * Priority:
 *   1. fixedPrice exception (no rounding applied)
 *   2. overrideMarginPercentage exception over the base cost
 *   3. baseMarginPercentage from the public price list
 *   4. category defaultMarginPercent fallback (when no public list)
 *
 * Base cost prefers replacementCost when > 0, otherwise costPrice.
 */
function computePublicPrice(
  productRec: {
    id: string;
    costPrice: unknown;
    replacementCost: unknown;
    category: { defaultMarginPercent: unknown } | null;
  },
  ctx: PublicPriceListContext | null,
): number {
  const costPrice = toNumber(productRec.costPrice, 0);
  const replacementCost = toNumber(productRec.replacementCost, 0);
  const baseCost = replacementCost > 0 ? replacementCost : costPrice;

  if (ctx) {
    const exc = ctx.exceptions.get(productRec.id);
    if (exc && exc.fixedPrice !== null) {
      return exc.fixedPrice;
    }
    const margin =
      exc && exc.overrideMarginPercentage !== null
        ? exc.overrideMarginPercentage
        : ctx.baseMarginPercentage;
    const rawPrice = baseCost * (1 + margin / 100);
    return applyRounding(rawPrice, ctx.roundingRule);
  }

  const categoryMargin = toNumber(productRec.category?.defaultMarginPercent ?? null, 40);
  const rawPrice = baseCost * (1 + categoryMargin / 100);
  return applyRounding(rawPrice, 'SMART_HUNDREDS');
}

// Public API

/**
 * Fetch the public catalog: active products with computed public prices
 * and active categories ordered by sortOrder. Only safe fields are
 * returned. Throws when the database is unreachable so the caller
 * (Server Component / API route) can surface a 500 error.
 */
export async function getPublicCatalog(): Promise<PublicCatalogResult> {
  const [priceListCtx, dbProducts, dbCategories] = await Promise.all([
    loadPublicPriceListContext(),
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

  const products: PublicCatalogProduct[] = dbProducts.map((productRec) => {
    const price = computePublicPrice(productRec, priceListCtx);
    const imageFallback = productRec.name ? productRec.name.charAt(0).toUpperCase() : 'P';
    return {
      id: productRec.id,
      sku: productRec.sku || '',
      name: productRec.name,
      category: productRec.category?.name || 'Varios',
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
