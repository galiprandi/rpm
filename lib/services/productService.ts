/**
 * Product Service - CRUD and search operations for products
 * 
 * Especificaciones relacionadas:
 * - /specs/data-architecture.md#productos
 * - /specs/inventory-sales.md
 * 
 * Alcance del test:
 * - Validación de CRUD operations
 * - Búsqueda por EAN, nombre, SKU
 * - Filtros por categoría y stock bajo
 * - Cálculo de margen
 * 
 * Métricas cubiertas:
 * - Cobertura esperada: >90%
 * - Performance: <100ms por query
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/client';

// Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  barcode: string | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  isLowStock: boolean;
  margin: number;
  supplierId: string | null;
  location: string | null;
  isActive: boolean;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  barcode?: string;
  categoryId: string; // Required by Prisma schema
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  supplierId?: string;
  location?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  isActive?: boolean;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  lowStock?: boolean;
  isActive?: boolean;
}

export interface ProductListResult {
  products: Product[];
  total: number;
  lowStockCount: number;
}

// Helper: Calculate margin
function calculateMargin(costPrice: number, salePrice: number): number {
  if (costPrice <= 0) return 0;
  return Number(((salePrice - costPrice) / costPrice * 100).toFixed(2));
}

// Helper: Check if stock is low
function isLowStock(stock: number, minStock: number): boolean {
  return stock <= minStock;
}

// Helper: Transform Prisma product to Product type
type PrismaProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

function transformProduct(product: PrismaProductWithCategory): Product {
  const cost = product.costPrice?.toNumber ? product.costPrice.toNumber() : Number(product.costPrice) || 0;
  const sale = product.salePrice?.toNumber ? product.salePrice.toNumber() : Number(product.salePrice) || 0;
  return {
    ...product,
    costPrice: cost,
    salePrice: sale,
    margin: calculateMargin(cost, sale),
    isLowStock: isLowStock(product.stock, product.minStock),
    supplierId: product.supplierId,
  };
}

/**
 * Get all products with optional filters
 */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductListResult> {
  const where: Prisma.ProductWhereInput = {};

  // Search by EAN, name, or SKU
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    where.OR = [
      { barcode: { contains: searchLower, mode: 'insensitive' } },
      { name: { contains: searchLower, mode: 'insensitive' } },
      { sku: { contains: searchLower, mode: 'insensitive' } },
    ];
  }

  // Filter by category
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  // Filter by active status
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  // Filter by low stock (applied post-query)
  const [products, total, lowStockCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.count({ where }),
    prisma.product.count({
      where: {
        stock: { lte: prisma.product.fields.minStock },
        isActive: true,
      },
    }),
  ]);

  let transformedProducts = products.map(transformProduct);

  // Apply low stock filter post-transformation
  if (filters.lowStock) {
    transformedProducts = transformedProducts.filter(p => p.isLowStock);
  }

  return {
    products: transformedProducts,
    total,
    lowStockCount,
  };
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) return null;
  return transformProduct(product);
}

/**
 * Create a new product
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const product = await prisma.product.create({
    data: {
      sku: input.sku,
      name: input.name,
      description: input.description || null,
      barcode: input.barcode || null,
      categoryId: input.categoryId,
      costPrice: new Prisma.Decimal(input.costPrice),
      salePrice: new Prisma.Decimal(input.salePrice),
      stock: input.stock,
      minStock: input.minStock,
      supplierId: input.supplierId || null,
      location: input.location || null,
    },
    include: { category: true },
  });

  return transformProduct(product);
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const data: Prisma.ProductUpdateInput = {};

  if (input.sku !== undefined) data.sku = input.sku;
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.barcode !== undefined) data.barcode = input.barcode ?? null;
  if (input.categoryId !== undefined) {
    data.category = { connect: { id: input.categoryId } };
  }
  if (input.costPrice !== undefined) data.costPrice = new Prisma.Decimal(input.costPrice);
  if (input.salePrice !== undefined) data.salePrice = new Prisma.Decimal(input.salePrice);
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.minStock !== undefined) data.minStock = input.minStock;
  if (input.supplierId !== undefined) {
    data.supplier = input.supplierId 
      ? { connect: { id: input.supplierId } }
      : { disconnect: true };
  }
  if (input.location !== undefined) data.location = input.location || null;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const product = await prisma.product.update({
    where: { id },
    data,
    include: { category: true },
  });

  return transformProduct(product);
}

/**
 * Soft delete (deactivate) a product
 */
export async function deactivateProduct(id: string): Promise<void> {
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Hard delete a product (use with caution)
 */
export async function deleteProduct(id: string): Promise<void> {
  await prisma.product.delete({
    where: { id },
  });
}

/**
 * Update stock quantity
 */
export async function updateStock(
  id: string,
  quantity: number,
  operation: 'add' | 'subtract' | 'set'
): Promise<Product> {
  let data: Prisma.ProductUpdateInput;

  switch (operation) {
    case 'add':
      data = { stock: { increment: quantity } };
      break;
    case 'subtract':
      data = { stock: { decrement: quantity } };
      break;
    case 'set':
      data = { stock: quantity };
      break;
    default:
      throw new Error(`Invalid operation: ${operation}`);
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    include: { category: true },
  });

  return transformProduct(product);
}
