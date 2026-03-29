/**
 * Services Index - Re-export all business services
 * 
 * Following BFF pattern: services are pure functions reusable by:
 * - API Controllers (Next.js API Routes)
 * - Agent Tools (RPM Bot / LLM Tools)
 */

// Product Service
export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deactivateProduct,
  deleteProduct,
  updateStock,
  type Product,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductFilters,
  type ProductListResult,
} from './productService';

// Category Service
export {
  getCategories,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type CategoryListResult,
} from './categoryService';

// Supplier Service
export {
  getSuppliers,
  getSupplierById,
  getSupplierByName,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
  hasAssociatedProducts,
  type Supplier,
  type CreateSupplierInput,
  type UpdateSupplierInput,
  type SupplierListResult,
} from './supplierService';
