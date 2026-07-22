import { db } from '@/lib/db';
import { product } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { UpdateProductInput } from './schema';

/**
 * updateProductService - Pure function to update product organizational fields
 *
 * Only updates: name, categoryId, location, description, sku, barcode.
 * Does NOT touch: stock, costPrice, replacementCost, minStock, supplierId, isActive.
 *
 * @param input - Product ID + fields to update
 * @returns Updated product with category
 */
export async function updateProductService(input: UpdateProductInput) {
  const { productId, name, categoryId, location, description, sku, barcode } = input;

  const data: Partial<typeof product.$inferInsert> = {};
  if (name !== undefined) data.name = name;
  if (categoryId !== undefined) data.categoryId = categoryId;
  if (location !== undefined) data.location = location || null;
  if (description !== undefined) data.description = description || null;
  if (sku !== undefined) data.sku = sku || null;
  if (barcode !== undefined) data.barcode = barcode || null;
  data.updatedAt = new Date().toISOString();

  await db.update(product).set(data).where(eq(product.id, productId));

  const p = await db.query.product.findFirst({
    where: eq(product.id, productId),
    with: { category: true },
  });

  return p;
}
