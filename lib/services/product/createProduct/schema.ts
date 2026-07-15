import { z } from 'zod';

/**
 * Schema for creating a product
 *
 * This schema is shared between:
 * - API routes (app/api/products/route.ts)
 * - AI tools (lib/services/product/createProduct/tool.ts)
 * - Direct service calls
 */
export const createProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  costPrice: z.number().min(0, 'El precio de costo no puede ser negativo'),
  replacementCost: z.number().min(0, 'El precio de reemplazo no puede ser negativo'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  minStock: z.number().int().min(0).default(0),
  supplierId: z.string().optional(),
  location: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
