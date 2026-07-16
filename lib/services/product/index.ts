/**
 * Product Domain - Colocated services, schemas, and tools
 *
 * This index file exports all product-related functionality:
 * - Services: Pure functions for business logic
 * - Schemas: Zod validation schemas (shared with API routes)
 * - Tools: AI SDK tools (using createTool factory)
 */

// Tools
export { draftProductTool, createProductTool } from "./createProduct/tool";
export {
  draftUpdateProductTool,
  updateProductTool,
} from "./updateProduct/tool";
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

// Tool collection for registry
import { draftProductTool, createProductTool } from "./createProduct/tool";
import {
  draftUpdateProductTool,
  updateProductTool,
} from "./updateProduct/tool";
import { searchProductsTool } from "./searchProducts/tool";

export const productTools = {
  draftProduct: draftProductTool,
  createProduct: createProductTool,
  draftUpdateProduct: draftUpdateProductTool,
  updateProduct: updateProductTool,
  searchProducts: searchProductsTool,
};
