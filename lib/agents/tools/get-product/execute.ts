import { getProducts } from '@/lib/services/productService';
import { searchProducts } from '@/lib/services/searchService';
import { productToMarkdown } from './parser';
import type { BotContext } from '../../utils/types';
import { getPriceLists, calculateProductPrice } from '@/lib/services/priceListService';

/**
 * Input parameters for get_product tool
 */
interface GetProductInput {
  query: string;
  context?: BotContext;
}

/**
 * Execute function for get_product tool
 * Searches for products by EAN, SKU, or name and returns formatted Markdown
 */
export async function executeGetProduct({ query, context }: GetProductInput) {
  try {
    // Extract role from context
    const role = context?.role || 'STAFF';

    // Singularize and normalize query (remove plural 's' or 'es', remove accents)
    const singularQuery = query
      .replace(/es$/, '')
      .replace(/s$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Search for products (handles EAN/SKU/name fuzzy search)
    const result = await getProducts({ search: singularQuery, isActive: true });

    // Detect if query is SKU (exact match in sku field)
    const isSku = result.products.some(p => p.sku === query);

    // Fetch price lists
    const { priceLists } = await getPriceLists();

    // Calculate prices for each product in each price list
    const productPriceMap = new Map<string, Array<{ name: string; isPublic: boolean; finalPrice: number }>>();

    for (const product of result.products) {
      const prices: Array<{ name: string; isPublic: boolean; finalPrice: number }> = [];

      for (const priceList of priceLists) {
        const calculatedPrice = await calculateProductPrice(product.id, priceList.id);
        if (calculatedPrice) {
          prices.push({
            name: priceList.name,
            isPublic: priceList.isPublic,
            finalPrice: calculatedPrice.finalPrice,
          });
        }
      }

      if (prices.length > 0) {
        productPriceMap.set(product.id, prices);
      }
    }

    if (isSku) {
      // SKU with results → return as-is (no fuzzy)
      const limitedProducts = result.products.slice(0, 5);
      return productToMarkdown(limitedProducts, role, context, productPriceMap);
    }

    // Generic query
    if (result.products.length > 0) {
      // Results found → return as-is
      const limitedProducts = result.products.slice(0, 5);
      return productToMarkdown(limitedProducts, role, context, productPriceMap);
    }

    // 0 results → invoke searchService (fuzzy more broad)
    return await searchProducts({
      query: singularQuery,
      role,
      context,
    });
  } catch (error) {
    console.error('Error in get_product tool:', error);
    return 'Hubo un error al buscar el producto. Por favor, intentá nuevamente.';
  }
}
