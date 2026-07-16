import { z } from 'zod';

/**
 * Schema for updating product organizational fields
 *
 * Only allows non-sensitive fields: name, category, location,
 * description, sku, barcode. Does NOT allow stock, cost, or
 * replacement cost changes.
 *
 * Shared between API routes and AI tools.
 */
export const updateProductSchema = z.object({
  productId: z.string().min(1, 'El ID del producto es requerido'),
  name: z.string().min(1, 'El nombre no puede estar vacío').optional(),
  categoryId: z.string().min(1, 'La categoría es requerida').optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
