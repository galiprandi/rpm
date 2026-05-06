/**
 * Category Service - CRUD operations for categories
 * 
 * Especificaciones relacionadas:
 * - /specs/data-architecture.md#categorías
 * - /specs/inventory-sales.md
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

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

/**
 * Get all categories with product count
 */
export async function getCategories(includeInactive: boolean = false): Promise<CategoryListResult> {
  const categories = await prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { product: true },
      },
    },
  });

  return {
    categories: categories.map((c: any) => ({
      ...c,
      productCount: c._count.product,
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
        select: { product: true },
      },
    },
  });

  if (!category) return null;

  return {
    ...category,
    productCount: category._count.product,
  };
}

/**
 * Get a single category by name
 */
export async function getCategoryByName(name: string): Promise<Category | null> {
  const category = await prisma.category.findUnique({
    where: { name },
    include: {
      _count: {
        select: { product: true },
      },
    },
  });

  if (!category) return null;

  return {
    ...category,
    productCount: category._count.product,
  };
}

/**
 * Create a new category
 */
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const category = await prisma.category.create({
    data: {
      id: randomUUID(),
      name: input.name,
      description: input.description || null,
      color: input.color || null,
      defaultMarginPercent: input.defaultMarginPercent || 0,
      isActive: true,
      updatedAt: new Date(),
    },
    include: {
      _count: {
        select: { product: true },
      },
    },
  });

  return {
    ...category,
    productCount: category._count.product,
  };
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  const data: Prisma.categoryUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.color !== undefined) data.color = input.color || null;
  if (input.defaultMarginPercent !== undefined) data.defaultMarginPercent = input.defaultMarginPercent;

  const category = await prisma.category.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { product: true },
      },
    },
  });

  return {
    ...category,
    productCount: category._count.product,
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
