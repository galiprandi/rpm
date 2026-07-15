import { z } from 'zod';

/**
 * Schema for searching products
 *
 * This schema is shared between:
 * - API routes (app/api/products/route.ts)
 * - AI tools (lib/services/product/searchProducts/tool.ts)
 * - Direct service calls
 */
export const searchProductsSchema = z.object({
  search: z.string().describe('Término de búsqueda (nombre, SKU o código de barras)'),
  limit: z.number().optional().default(10).describe('Límite de resultados (default: 10)'),
});

export type SearchProductsInput = z.infer<typeof searchProductsSchema>;
