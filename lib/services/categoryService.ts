/**
 * Category Service - CRUD operations for categories
 * 
 * Especificaciones relacionadas:
 * - /specs/data-architecture.md#categorías
 * - /specs/inventory-sales.md
 */

import { db } from '@/lib/db';
import { category, product } from '@/db/schema';
import { eq, sql, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

/**
 * Invalidate the public catalog cache (home + /productos) since category
 * mutations affect what is shown on the public website. Called at the end
 * of every mutating function below.
 */
function revalidatePublicCatalog(): void {
  revalidatePath('/');
  revalidatePath('/productos');
}

// Types
export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  defaultMarginPercent: number;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  color?: string;
  defaultMarginPercent?: number;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CategoryListResult {
  categories: Category[];
  total: number;
}

// Helper: count products for a category
async function countProductsByCategory(categoryId: string): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` })
    .from(product)
    .where(eq(product.categoryId, categoryId));
  return row?.count ?? 0;
}

// Helper: Transform Drizzle category to Category type
function transformCategory(
  c: typeof category.$inferSelect,
  productCount: number
): Category {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    color: c.color,
    defaultMarginPercent: c.defaultMarginPercent,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    productCount,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  };
}

/**
 * Get all categories with product count
 */
export async function getCategories(includeInactive: boolean = false): Promise<CategoryListResult> {
  const categories = await db.query.category.findMany({
    where: includeInactive ? undefined : eq(category.isActive, true),
    orderBy: asc(category.name),
  });

  // Get product counts for all categories in a single query
  const counts = await db.select({
    categoryId: product.categoryId,
    count: sql<number>`count(*)::int`,
  })
    .from(product)
    .groupBy(product.categoryId);

  const countMap = new Map<string, number>(counts.map(c => [c.categoryId, c.count]));

  const transformed = categories.map(c => transformCategory(c, countMap.get(c.id) ?? 0));

  return {
    categories: transformed,
    total: transformed.length,
  };
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const c = await db.query.category.findFirst({
    where: eq(category.id, id),
  });

  if (!c) return null;

  const productCount = await countProductsByCategory(id);
  return transformCategory(c, productCount);
}

/**
 * Get a single category by name
 */
export async function getCategoryByName(name: string): Promise<Category | null> {
  const c = await db.query.category.findFirst({
    where: eq(category.name, name),
  });

  if (!c) return null;

  const productCount = await countProductsByCategory(c.id);
  return transformCategory(c, productCount);
}

/**
 * Create a new category
 */
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const [created] = await db.insert(category).values({
    id: randomUUID(),
    name: input.name,
    description: input.description || null,
    color: input.color || null,
    defaultMarginPercent: input.defaultMarginPercent || 0,
    isActive: true,
    updatedAt: new Date().toISOString(),
  }).returning();

  revalidatePublicCatalog();
  return transformCategory(created, 0);
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const data: Partial<typeof category.$inferInsert> = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.color !== undefined) data.color = input.color || null;
  if (input.defaultMarginPercent !== undefined) data.defaultMarginPercent = input.defaultMarginPercent;
  data.updatedAt = new Date().toISOString();

  const [updated] = await db.update(category).set(data).where(eq(category.id, id)).returning();

  if (!updated) throw new Error('Category not found');

  revalidatePublicCatalog();
  const productCount = await countProductsByCategory(id);
  return transformCategory(updated, productCount);
}

/**
 * Delete a category (only if no products)
 */
export async function deleteCategory(id: string): Promise<void> {
  await db.delete(category).where(eq(category.id, id));
  revalidatePublicCatalog();
}
