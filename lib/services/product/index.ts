/**
 * Product Domain - Colocated services, schemas, and tools
 *
 * This index file exports all product-related functionality:
 * - Services: Pure functions for business logic
 * - Schemas: Zod validation schemas (shared with API routes)
 * - Tools: AI SDK tools (using createTool factory)
 */

// Tools
export { createProductTool } from "./createProduct/tool";
export { searchProductsTool } from "./searchProducts/tool";

// Services
export { createProductService } from "./createProduct/service";
export { updateProductService } from "./updateProduct/service";
export { searchProductsService } from "./searchProducts/service";

// Schemas
export {
  createProductSchema,
  type CreateProductInput,
} from "./createProduct/schema";
export {
  updateProductSchema,
  type UpdateProductInput,
} from "./updateProduct/schema";
export {
  searchProductsSchema,
  type SearchProductsInput,
} from "./searchProducts/schema";

// Tool collection
import { createProductTool } from "./createProduct/tool";
import { searchProductsTool } from "./searchProducts/tool";

export const productTools = {
  createProduct: createProductTool,
  searchProducts: searchProductsTool,
};
