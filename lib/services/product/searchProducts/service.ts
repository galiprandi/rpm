import { prisma } from '@/lib/prisma';
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
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
          { barcode: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const products = await prisma.product.findMany({
    where,
    include: { 
      category: true,
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
    take: limit,
  });

  return products;
}
