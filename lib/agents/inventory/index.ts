import { createAgent } from '../utils/createAgent';
import { productTools } from '@/lib/services/product';

/**
 * Inventory Agent - Specialized agent for inventory and product management
 * 
 * This agent handles all product-related operations including:
 * - Creating products (draft + confirm)
 * - Searching products
 * - Managing product data
 */
export const inventoryAgent = createAgent({
  instructions: './instructions.md',
  tools: productTools,
});
