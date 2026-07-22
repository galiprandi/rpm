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

import { db } from '@/lib/db';
import { product, stockMovement } from '@/db/schema';
import { eq, and, or, ilike, sql, lte, asc, desc, type SQL } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Invalidate the public catalog cache (home + /productos) since product
 * mutations affect what is shown on the public website. Called at the end
 * of every mutating function below.
 */
function revalidatePublicCatalog(): void {
  revalidatePath('/');
  revalidatePath('/productos');
}

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

// Helper: Transform Drizzle product to Product type
type DrizzleProductWithRelations = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  barcode: string | null;
  categoryId: string;
  costPrice: string;
  replacementCost: string;
  stock: number;
  minStock: number;
  supplierId: string | null;
  location: string | null;
  lastMovementAt: string | null;
  isActive: boolean;
  category: { id: string; name: string; color: string | null } | null;
  supplier?: { id: string; name: string } | null;
};

function transformProduct(p: DrizzleProductWithRelations): Product {
  const cost = Number(p.costPrice) || 0;
  const replacement = Number(p.replacementCost) || 0;
  return {
    id: p.id,
    sku: p.sku || '',
    name: p.name,
    description: p.description,
    barcode: p.barcode,
    categoryId: p.categoryId,
    category: p.category
      ? { id: p.category.id, name: p.category.name, color: p.category.color }
      : null,
    costPrice: cost,
    replacementCost: replacement,
    stock: p.stock,
    minStock: p.minStock,
    isLowStock: isLowStock(p.stock, p.minStock),
    margin: calculateMargin(cost, replacement),
    supplierId: p.supplierId,
    supplier: p.supplier || null,
    location: p.location,
    lastMovementAt: p.lastMovementAt ? new Date(p.lastMovementAt) : null,
    isActive: p.isActive,
  };
}

/**
 * Get all products with optional filters
 */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductListResult> {
  // Build where conditions
  const conditions: SQL[] = [];

  // Search by EAN, name, or SKU
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    conditions.push(
      or(
        ilike(product.barcode, `%${searchLower}%`),
        ilike(product.name, `%${searchLower}%`),
        ilike(product.sku, `%${searchLower}%`),
      )!
    );
  }

  // Filter by category
  if (filters.categoryId) {
    conditions.push(eq(product.categoryId, filters.categoryId));
  }

  // Filter by active status
  if (filters.isActive !== undefined) {
    conditions.push(eq(product.isActive, filters.isActive));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Low stock count condition (stock <= minStock AND isActive)
  const lowStockWhere = and(lte(product.stock, product.minStock), eq(product.isActive, true));

  const [products, totalRows, lowStockRows] = await Promise.all([
    db.query.product.findMany({
      where,
      with: {
        category: true,
        supplier: { columns: { id: true, name: true } },
      },
      orderBy: asc(product.name),
    }),
    db.select({ count: sql<number>`count(*)::int` })
      .from(product)
      .where(where),
    db.select({ count: sql<number>`count(*)::int` })
      .from(product)
      .where(lowStockWhere),
  ]);

  let transformedProducts = products.map(transformProduct);

  // Apply low stock filter post-transformation
  if (filters.lowStock) {
    transformedProducts = transformedProducts.filter((p) => p.isLowStock);
  }

  return {
    products: transformedProducts,
    total: totalRows[0]?.count ?? 0,
    lowStockCount: lowStockRows[0]?.count ?? 0,
  };
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const p = await db.query.product.findFirst({
    where: eq(product.id, id),
    with: { category: true },
  });

  if (!p) return null;
  return transformProduct(p);
}

/**
 * Create a new product
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const [created] = await db.insert(product).values({
    id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sku: input.sku || null,
    name: input.name,
    description: input.description || null,
    barcode: input.barcode || null,
    categoryId: input.categoryId,
    costPrice: input.costPrice.toString(),
    replacementCost: input.replacementCost.toString(),
    stock: input.stock,
    minStock: input.minStock,
    supplierId: input.supplierId || null,
    location: input.location || null,
    isActive: true,
    updatedAt: new Date().toISOString(),
  }).returning();

  // Fetch with category relation
  const p = await db.query.product.findFirst({
    where: eq(product.id, created.id),
    with: { category: true },
  });

  if (!p) throw new Error('Failed to create product');

  revalidatePublicCatalog();
  return transformProduct(p);
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const data: Partial<typeof product.$inferInsert> = {};

  if (input.sku !== undefined) data.sku = input.sku;
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.barcode !== undefined) data.barcode = input.barcode ?? null;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.costPrice !== undefined) data.costPrice = input.costPrice.toString();
  if (input.replacementCost !== undefined) data.replacementCost = input.replacementCost.toString();
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.minStock !== undefined) data.minStock = input.minStock;
  if (input.supplierId !== undefined) data.supplierId = input.supplierId || null;
  if (input.location !== undefined) data.location = input.location || null;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  data.updatedAt = new Date().toISOString();

  await db.update(product).set(data).where(eq(product.id, id));

  const p = await db.query.product.findFirst({
    where: eq(product.id, id),
    with: { category: true },
  });

  if (!p) throw new Error('Product not found after update');

  revalidatePublicCatalog();
  return transformProduct(p);
}

/**
 * Soft delete (deactivate) a product
 */
export async function deactivateProduct(id: string): Promise<void> {
  await db.update(product).set({ isActive: false }).where(eq(product.id, id));
  revalidatePublicCatalog();
}

/**
 * Hard delete a product (use with caution)
 */
export async function deleteProduct(id: string): Promise<void> {
  await db.delete(product).where(eq(product.id, id));
  revalidatePublicCatalog();
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
  const existing = await db.query.product.findFirst({
    where: eq(product.id, id),
    with: { category: true },
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
  await db.update(product).set({ stock: newStock }).where(eq(product.id, id));

  // Re-fetch with category
  const p = await db.query.product.findFirst({
    where: eq(product.id, id),
    with: { category: true },
  });

  if (!p) throw new Error('Product not found after stock update');

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

  return transformProduct(p);
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
  // For add/subtract we use SQL expression; for set we use literal
  if (operation === 'add' || operation === 'subtract') {
    await db.update(product)
      .set({ stock: sql`${product.stock} ${operation === 'add' ? '+' : '-'} ${quantity}`, updatedAt: new Date().toISOString() })
      .where(eq(product.id, id));
  } else if (operation === 'set') {
    await db.update(product)
      .set({ stock: quantity, updatedAt: new Date().toISOString() })
      .where(eq(product.id, id));
  } else {
    throw new Error(`Invalid operation: ${operation}`);
  }

  const p = await db.query.product.findFirst({
    where: eq(product.id, id),
    with: { category: true },
  });

  if (!p) throw new Error('Product not found after stock update');

  return transformProduct(p);
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
  const [movement] = await db.insert(stockMovement).values({
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
  }).returning();

  // Update lastMovementAt on the product
  await db.update(product)
    .set({ lastMovementAt: new Date().toISOString() })
    .where(eq(product.id, input.productId));

  return {
    ...movement,
    type: movement.type as MovementType,
    reason: movement.reason as MovementReason,
    salePrice: movement.salePrice ? Number(movement.salePrice) : null,
    createdAt: new Date(movement.createdAt),
  };
}

/**
 * Get all movements for a product
 */
export async function getProductMovements(productId: string): Promise<StockMovement[]> {
  const movements = await db.query.stockMovement.findMany({
    where: eq(stockMovement.productId, productId),
    orderBy: desc(stockMovement.createdAt),
  });

  return movements.map((m) => ({
    ...m,
    type: m.type as MovementType,
    reason: m.reason as MovementReason,
    salePrice: m.salePrice ? Number(m.salePrice) : null,
    createdAt: new Date(m.createdAt),
  }));
}
