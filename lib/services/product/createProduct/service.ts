import { db } from '@/lib/db';
import { product } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { CreateProductInput } from './schema';

/**
 * createProductService - Pure function to create a product
 *
 * This service is shared between:
 * - API routes (app/api/products/route.ts)
 * - AI tools (lib/services/product/createProduct/tool.ts)
 *
 * @param input - Product creation data
 * @returns Created product object
 */
export async function createProductService(input: CreateProductInput) {
  const [created] = await db.insert(product).values({
    id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sku: input.sku || null,
    name: input.name,
    description: input.description || null,
    barcode: input.barcode || null,
    categoryId: input.categoryId,
    costPrice: input.costPrice.toString(),
    replacementCost: input.replacementCost.toString(),
    stock: input.stock,
    minStock: input.minStock,
    supplierId: input.supplierId || null,
    location: input.location || null,
    isActive: true,
    updatedAt: new Date().toISOString(),
  }).returning();

  // Fetch with category relation
  const p = await db.query.product.findFirst({
    where: eq(product.id, created.id),
    with: { category: true },
  });

  return p;
}
