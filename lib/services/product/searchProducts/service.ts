import { db } from '@/lib/db';
import { product } from '@/db/schema';
import { or, ilike, asc, type SQL } from 'drizzle-orm';
import type { SearchProductsInput } from './schema';

/**
 * searchProductsService - Pure function to search products
 *
 * This service is shared between:
 * - API routes (app/api/products/route.ts)
 * - AI tools (lib/services/product/searchProducts/tool.ts)
 *
 * @param input - Search parameters
 * @returns List of matching products
 */
export async function searchProductsService(input: SearchProductsInput) {
  const { search, limit = 10 } = input;

  // Build where clause
  let where: SQL | undefined;
  if (search) {
    where = or(
      ilike(product.name, `%${search}%`),
      ilike(product.sku, `%${search}%`),
      ilike(product.barcode, `%${search}%`),
    )!;
  }

  const products = await db.query.product.findMany({
    where,
    with: {
      category: true,
      supplier: { columns: { id: true, name: true } },
    },
    orderBy: asc(product.name),
    limit,
  });

  return products;
}
