/**
 * Category Service - CRUD operations for categories
 * 
 * Especificaciones relacionadas:
 * - /specs/data-architecture.md#categorías
 * - /specs/inventory-sales.md
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/client';

// Types
export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  defaultMarginPercent: number;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  color?: string;
  defaultMarginPercent?: number;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

export interface CategoryListResult {
  categories: Category[];
  total: number;
}

/**
 * Get all categories with product count
 */
export async function getCategories(): Promise<CategoryListResult> {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return {
    categories: categories.map(c => ({
      ...c,
      productCount: c._count.products,
    })),
    total: categories.length,
  };
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) return null;

  return {
    ...category,
    productCount: category._count.products,
  };
}

/**
 * Create a new category
 */
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const category = await prisma.category.create({
    data: {
      name: input.name,
      description: input.description || null,
      color: input.color || null,
      defaultMarginPercent: input.defaultMarginPercent ?? 40,
    },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return {
    ...category,
    productCount: category._count.products,
  };
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const data: Prisma.CategoryUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.color !== undefined) data.color = input.color || null;
  if (input.defaultMarginPercent !== undefined) data.defaultMarginPercent = input.defaultMarginPercent;

  const category = await prisma.category.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return {
    ...category,
    productCount: category._count.products,
  };
}

/**
 * Delete a category (only if no products)
 */
export async function deleteCategory(id: string): Promise<void> {
  await prisma.category.delete({
    where: { id },
  });
}
