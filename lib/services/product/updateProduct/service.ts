import { prisma } from '@/lib/prisma';
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

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (categoryId !== undefined) data.category = { connect: { id: categoryId } };
  if (location !== undefined) data.location = location || null;
  if (description !== undefined) data.description = description || null;
  if (sku !== undefined) data.sku = sku || null;
  if (barcode !== undefined) data.barcode = barcode || null;
  data.updatedAt = new Date();

  const product = await prisma.product.update({
    where: { id: productId },
    data,
    include: { category: true },
  });

  return product;
}
