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
  replacementCost: number;
  stock: number;
  minStock: number;
  isLowStock: boolean;
  margin: number;
  supplierId: string | null;
  supplier: {
    id: string;
    name: string;
  } | null;
  location: string | null;
  lastMovementAt: Date | null;
  isActive: boolean;
}

export interface CreateProductInput {
  sku?: string;  // SKU opcional
  name: string;
  description?: string;
  barcode?: string;
  categoryId: string;
  costPrice: number;
  replacementCost: number;
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
function calculateMargin(costPrice: number, replacementCost: number): number {
  if (costPrice <= 0) return 0;
  return Number(((replacementCost - costPrice) / costPrice * 100).toFixed(2));
}

// Helper: Check if stock is low
function isLowStock(stock: number, minStock: number): boolean {
  return stock <= minStock;
}

// Helper: Transform Prisma product to Product type
type PrismaProductWithCategory = Prisma.productGetPayload<{ include: { category: true } }>;

function transformProduct(product: PrismaProductWithCategory & { supplier?: { id: string; name: string } | null }): Product {
  const cost = product.costPrice?.toNumber ? product.costPrice.toNumber() : Number(product.costPrice) || 0;
  const replacement = product.replacementCost?.toNumber ? product.replacementCost.toNumber() : Number(product.replacementCost) || 0;
  return {
    ...product,
    costPrice: cost,
    replacementCost: replacement,
    margin: calculateMargin(cost, replacement),
    isLowStock: isLowStock(product.stock, product.minStock),
    supplierId: product.supplierId,
    supplier: product.supplier || null,
    sku: product.sku || '',
    lastMovementAt: product.lastMovementAt,
  };
}

/**
 * Get all products with optional filters
 */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductListResult> {
  const where: Prisma.productWhereInput = {};

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
      include: { 
        category: true,
        supplier: { select: { id: true, name: true } },
      },
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
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sku: input.sku,
      name: input.name,
      description: input.description || null,
      barcode: input.barcode || null,
      categoryId: input.categoryId,
      costPrice: Prisma?.Decimal ? new Prisma.Decimal(input.costPrice) : input.costPrice,
      replacementCost: Prisma?.Decimal ? new Prisma.Decimal(input.replacementCost) : input.replacementCost,
      stock: input.stock,
      minStock: input.minStock,
      supplierId: input.supplierId || null,
      location: input.location || null,
      isActive: true,
      updatedAt: new Date(),
    },
    include: { category: true },
  });

  return transformProduct(product);
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const data: Prisma.productUpdateInput = {};

  if (input.sku !== undefined) data.sku = input.sku;
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.barcode !== undefined) data.barcode = input.barcode ?? null;
  if (input.categoryId !== undefined) {
    data.category = { connect: { id: input.categoryId } };
  }
  if (input.costPrice !== undefined) data.costPrice = input.costPrice.toString();
  if (input.replacementCost !== undefined) data.replacementCost = input.replacementCost.toString();
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

// ============================================
// Stock Types
// ============================================

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';
export type MovementReason = 'VENTA' | 'RECEPCION' | 'AJUSTE_INVENTARIO' | 'MERMA' | 'DEVOLUCION' | 'CARGA_INICIAL';

/**
 * Adjust stock with audit trail - ONLY use this function for stock changes
 * This is the centralized and mandatory entry point for all stock modifications
 */
export async function adjustStock(
  id: string,
  operation: 'add' | 'subtract' | 'set',
  quantity: number,
  userId?: string,
  userName?: string,
  reason: MovementReason = 'AJUSTE_INVENTARIO',
  reasonDetails?: string
): Promise<Product> {
  // Get current stock
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!existing) {
    throw new Error('Product not found');
  }

  const previousStock = existing.stock;
  let newStock: number;

  switch (operation) {
    case 'add':
      newStock = previousStock + quantity;
      break;
    case 'subtract':
      newStock = previousStock - quantity;
      break;
    case 'set':
      newStock = quantity;
      break;
    default:
      throw new Error(`Invalid operation: ${operation}`);
  }

  // Ensure stock doesn't go negative
  if (newStock < 0) {
    throw new Error('Stock cannot be negative');
  }

  // Update product stock
  const product = await prisma.product.update({
    where: { id },
    data: { stock: newStock },
    include: { category: true },
  });

  // Calculate movement type and quantity
  const quantityChange = newStock - previousStock;
  const type: MovementType = quantityChange > 0 ? 'IN' : quantityChange < 0 ? 'OUT' : 'ADJUSTMENT';

  // Create movement record (mandatory audit trail)
  await createStockMovement({
    productId: id,
    userId,
    userName: userName || 'Sistema',
    type,
    quantity: quantityChange,
    previousStock,
    newStock,
    reason,
    reasonDetails: reasonDetails || `Ajuste de stock: ${previousStock} → ${newStock}`,
  });

  return transformProduct(product);
}

/**
 * @internal - Do not use directly. Use adjustStock() instead.
 * Raw stock update without audit trail.
 */
export async function updateStock(
  id: string,
  quantity: number,
  operation: 'add' | 'subtract' | 'set'
): Promise<Product> {
  let data: Prisma.productUpdateInput;

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

// ============================================
// Stock Audit Trail Functions
// ============================================

export interface StockMovement {
  id: string;
  productId: string;
  userId: string | null;
  userName: string | null;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: MovementReason;
  reasonDetails: string | null;
  salePrice: number | null;
  createdAt: Date;
}

export interface CreateMovementInput {
  productId: string;
  userId?: string;
  userName?: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: MovementReason;
  reasonDetails?: string;
  salePrice?: number;
}

/**
 * Create a stock movement record (audit trail)
 */
export async function createStockMovement(input: CreateMovementInput): Promise<StockMovement> {
  // Check if prisma is available
  if (!prisma) {
    throw new Error('Database connection not available');
  }
  
  const movement = await prisma.stock_movement.create({
    data: {
      id: `movement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: input.productId,
      userId: input.userId || null,
      userName: input.userName || null,
      type: input.type,
      quantity: input.quantity,
      previousStock: input.previousStock,
      newStock: input.newStock,
      reason: input.reason,
      reasonDetails: input.reasonDetails || null,
      salePrice: input.salePrice ? input.salePrice.toString() : null,
    },
  });

  // Update lastMovementAt on the product
  await prisma.product.update({
    where: { id: input.productId },
    data: { lastMovementAt: new Date() },
  });

  return {
    ...movement,
    type: movement.type as MovementType,
    reason: movement.reason as MovementReason,
    salePrice: movement.salePrice ? Number(movement.salePrice) : null,
  };
}

/**
 * Get all movements for a product
 */
export async function getProductMovements(productId: string): Promise<StockMovement[]> {
  const movements = await prisma.stock_movement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
  });

  return movements.map(m => ({
    ...m,
    type: m.type as MovementType,
    reason: m.reason as MovementReason,
    salePrice: m.salePrice ? Number(m.salePrice) : null,
  }));
}
