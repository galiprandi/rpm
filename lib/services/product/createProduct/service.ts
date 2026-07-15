import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
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
  const product = await prisma.product.create({
    data: {
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sku: input.sku,
      name: input.name,
      description: input.description || null,
      barcode: input.barcode || null,
      categoryId: input.categoryId,
      costPrice: Prisma?.Decimal ? new Prisma.Decimal(input.costPrice) : input.costPrice,
      replacementCost: Prisma?.Decimal ? new Prisma.Decimal(input.replacementCost) : input.replacementCost,
      stock: input.stock,
      minStock: input.minStock,
      supplierId: input.supplierId || null,
      location: input.location || null,
      isActive: true,
      updatedAt: new Date(),
    },
    include: { category: true },
  });

  return product;
}
