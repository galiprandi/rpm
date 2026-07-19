import { tool } from 'ai';
import { searchProductsService } from './service';
import { searchProductsSchema } from './schema';
import logger from '@/lib/agents/utils/logger';

/**
 * searchProductsTool - Search for products by name, SKU, or barcode.
 *
 * Note: This tool does NOT return prices. For prices, use searchProductsWithPricesTool.
 */
export const searchProductsTool = tool({
  description: 'Busca productos por nombre, SKU o código de barras. Devuelve ID, nombre, SKU, código de barras y categoría.',
  inputSchema: searchProductsSchema,
  execute: async (input) => {
    logger.debug({ search: input.search }, 'Searching products');

    const products = await searchProductsService(input);

    if (products.length === 0) {
      return 'No se encontraron productos con ese criterio de búsqueda.';
    }

    const formatted = products
      .map((p) => {
        let line = `- [ID: ${p.id}] ${p.name}`;
        if (p.sku) line += ` | SKU: ${p.sku}`;
        if (p.barcode) line += ` | EAN: ${p.barcode}`;
        if ((p as any).category) line += ` | Categoría: ${(p as any).category.name}`;
        return line;
      })
      .join('\n');

    return `Se encontraron ${products.length} producto(s):\n${formatted}`;
  },
});
