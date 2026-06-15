import { createTool } from '@/lib/agents/utils/createTool';
import { searchProductsService } from './service';
import { searchProductsSchema } from './schema';
import logger from '@/lib/agents/utils/logger';

/**
 * searchProductsTool - Search for products by name, SKU, or barcode
 *
 * Uses the createTool factory with the searchProductsService.
 */
export const searchProductsTool = createTool({
  name: 'searchProducts',
  description: 'Busca productos por nombre, SKU o código de barras. Devuelve una lista de productos coincidentes.',
  schema: searchProductsSchema,
  service: async (input) => {
    const { search, limit } = input;
    logger.debug({ search, limit }, 'Searching products');
    return searchProductsService(input);
  },
  format: (result) => {
    const products = result as any[];
    if (products.length === 0) {
      return 'No se encontraron productos con ese criterio de búsqueda.';
    }

    const formatted = products
      .map((p) => {
        let line = `- ${p.name}`;
        if (p.sku) line += ` | SKU: ${p.sku}`;
        if (p.barcode) line += ` | Barcode: ${p.barcode}`;
        if (p.category) line += ` | Categoría: ${p.category.name}`;
        return line;
      })
      .join('\n');

    return `Se encontraron ${products.length} producto(s):\n${formatted}`;
  },
});
