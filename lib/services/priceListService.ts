/**
 * PriceList Service - CRUD operations for price lists and items
 *
 * Especificaciones relacionadas:
 * - /specs/spec-price-lists.md
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/client';
import { calculateFinalPrice, calculateMarginPercentage, type RoundingRule } from '@/lib/utils/rounding';
import { getMinimumMargin } from './settingsService';

/**
 * Calculate the effective base cost for a product.
 * Uses replacementCost if available (> 0), otherwise falls back to costPrice.
 * This is the centralized source of truth for product cost calculation.
 * 
 * @param replacementCost - The replacement cost (may be null, 0, or Prisma Decimal)
 * @param costPrice - The cost price (fallback, may be Prisma Decimal)
 * @returns The effective base cost as a number
 */
export function getProductBaseCost(
  replacementCost: unknown,
  costPrice: unknown
): number {
  const replacement = replacementCost !== null && replacementCost !== undefined
    ? Number(replacementCost)
    : 0;
  
  if (replacement > 0) {
    return replacement;
  }
  
  return costPrice !== null && costPrice !== undefined
    ? Number(costPrice)
    : 0;
}

// Types
export interface PriceList {
  id: string;
  name: string;
  isPublic: boolean;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  baseMarginPercentage: number;
  roundingRule: RoundingRule;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string | null;
  productName?: string;
  productSku?: string;
  replacementCost?: number;
  overrideMarginPercentage: number | null;
  fixedPrice: number | null;
  finalPrice: number;
  actualMargin: number;
  isBelowMinimum: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceListDetail extends PriceList {
  items: PriceListItem[];
}

export interface CreatePriceListInput {
  name: string;
  isPublic?: boolean;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  baseMarginPercentage: number;
  roundingRule?: RoundingRule;
}

export type UpdatePriceListInput = Partial<CreatePriceListInput>;

export interface CreatePriceListItemInput {
  productId: string;
  overrideMarginPercentage?: number | null;
  fixedPrice?: number | null;
}

export interface PriceListResult {
  priceLists: PriceList[];
  total: number;
}

export interface CalculatedPrice {
  replacementCost: number;
  baseMargin: number;
  appliedMargin: number;
  roundingRule: RoundingRule;
  finalPrice: number;
  actualMargin: number;
  isBelowMinimum: boolean;
}

// GET all price lists
export async function getPriceLists(includeInactive: boolean = false): Promise<PriceListResult> {
  const priceLists = await prisma.price_list.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { price_list_item: true },
      },
    },
  });

  return {
    priceLists: priceLists.map(pl => ({
      ...pl,
      baseMarginPercentage: Number(pl.baseMarginPercentage),
      roundingRule: pl.roundingRule as RoundingRule,
      itemCount: pl._count.price_list_item,
    })),
    total: priceLists.length,
  };
}

// GET price list by ID with items
export async function getPriceListById(id: string): Promise<PriceListDetail | null> {
  const priceList = await prisma.price_list.findUnique({
    where: { id },
    include: {
      price_list_item: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              replacementCost: true,
            },
          },
        },
      },
      _count: {
        select: { price_list_item: true },
      },
    },
  });

  if (!priceList) return null;

  const minimumMargin = await getMinimumMargin();

  // Transform items with calculated prices and margins
  const items: PriceListItem[] = priceList.price_list_item.map(item => {
    const replacementCost = item.product?.replacementCost
      ? Number(item.product.replacementCost)
      : 0;

    const finalPrice = item.fixedPrice !== null
      ? Number(item.fixedPrice)
      : calculateFinalPrice(
          replacementCost,
          Number(priceList.baseMarginPercentage),
          priceList.roundingRule as RoundingRule,
          item.overrideMarginPercentage !== null
            ? { overrideMarginPercentage: Number(item.overrideMarginPercentage) }
            : undefined
        );

    const actualMargin = calculateMarginPercentage(replacementCost, finalPrice);

    return {
      id: item.id,
      priceListId: item.priceListId,
      productId: item.productId,
      productName: item.product?.name,
      productSku: item.product?.sku ?? undefined,
      replacementCost,
      overrideMarginPercentage: item.overrideMarginPercentage !== null
        ? Number(item.overrideMarginPercentage)
        : null,
      fixedPrice: item.fixedPrice !== null ? Number(item.fixedPrice) : null,
      finalPrice,
      actualMargin,
      isBelowMinimum: actualMargin < minimumMargin,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  return {
    ...priceList,
    baseMarginPercentage: Number(priceList.baseMarginPercentage),
    roundingRule: priceList.roundingRule as RoundingRule,
    itemCount: priceList._count.price_list_item,
    items: priceList.price_list_item,
  };
}

// GET price list by name (for uniqueness validation)
export async function getPriceListByName(name: string): Promise<PriceList | null> {
  const priceList = await prisma.price_list.findFirst({
    where: { name },
    include: {
      _count: {
        select: { price_list_item: true },
      },
    },
  });

  if (!priceList) return null;

  return {
    ...priceList,
    baseMarginPercentage: Number(priceList.baseMarginPercentage),
    roundingRule: priceList.roundingRule as RoundingRule,
    itemCount: priceList._count.price_list_item,
  };
}

// CREATE price list
export async function createPriceList(input: CreatePriceListInput): Promise<PriceList> {
  const priceList = await prisma.price_list.create({
    data: {
      name: input.name,
      isPublic: input.isPublic ?? false,
      isActive: input.isActive ?? true,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      baseMarginPercentage: input.baseMarginPercentage,
      roundingRule: input.roundingRule ?? 'SMART_HUNDREDS',
    },
    include: {
      _count: {
        select: { price_list_item: true },
      },
    },
  });

  return {
    ...priceList,
    baseMarginPercentage: Number(priceList.baseMarginPercentage),
    roundingRule: priceList.roundingRule as RoundingRule,
    itemCount: priceList._count?.price_list_item ?? 0,
  };
}

// UPDATE price list
export async function updatePriceList(id: string, input: UpdatePriceListInput): Promise<PriceList> {
  const data: Prisma.price_listUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.isPublic !== undefined) data.isPublic = input.isPublic;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.startDate !== undefined) data.startDate = input.startDate;
  if (input.endDate !== undefined) data.endDate = input.endDate;
  if (input.baseMarginPercentage !== undefined) data.baseMarginPercentage = input.baseMarginPercentage;
  if (input.roundingRule !== undefined) data.roundingRule = input.roundingRule;

  const priceList = await prisma.price_list.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { price_list_item: true },
      },
    },
  });

  return {
    ...priceList,
    baseMarginPercentage: Number(priceList.baseMarginPercentage),
    roundingRule: priceList.roundingRule as RoundingRule,
    itemCount: priceList._count.price_list_item,
  };
}

// DELETE price list (hard delete with cascade)
export async function deletePriceList(id: string): Promise<void> {
  await prisma.price_list.delete({
    where: { id },
  });
}

// CREATE price list item (exception)
export async function createPriceListItem(
  priceListId: string,
  input: CreatePriceListItemInput
): Promise<PriceListItem> {
  // Verify the price list exists
  const priceList = await prisma.price_list.findUnique({
    where: { id: priceListId },
  });

  if (!priceList) {
    throw new Error('Price list not found');
  }

  // Verify the product exists and has replacement cost
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const replacementCost = getProductBaseCost(product.replacementCost, product.costPrice);

  // Create the item
  const item = await prisma.price_list_item.create({
    data: {
      priceListId,
      productId: input.productId,
      overrideMarginPercentage: input.overrideMarginPercentage ?? null,
      fixedPrice: input.fixedPrice ?? null,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          replacementCost: true,
          costPrice: true,
        },
      },
    },
  });

  const minimumMargin = await getMinimumMargin();

  const finalPrice = item.fixedPrice !== null
    ? Number(item.fixedPrice)
    : calculateFinalPrice(
        replacementCost,
        Number(priceList.baseMarginPercentage),
        priceList.roundingRule as RoundingRule,
        item.overrideMarginPercentage !== null
          ? { overrideMarginPercentage: Number(item.overrideMarginPercentage) }
          : undefined
      );

  const actualMargin = calculateMarginPercentage(replacementCost, finalPrice);

  return {
    id: item.id,
    priceListId: item.priceListId,
    productId: item.productId,
    productName: item.product?.name,
    productSku: item.product?.sku ?? undefined,
    replacementCost,
    overrideMarginPercentage: item.overrideMarginPercentage !== null
      ? Number(item.overrideMarginPercentage)
      : null,
    fixedPrice: item.fixedPrice !== null ? Number(item.fixedPrice) : null,
    finalPrice,
    actualMargin,
    isBelowMinimum: actualMargin < minimumMargin,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// DELETE price list item
export async function deletePriceListItem(id: string): Promise<void> {
  await prisma.price_list_item.delete({
    where: { id },
  });
}

// Calculate price for a product in a specific price list
export async function calculateProductPrice(
  productId: string,
  priceListId: string
): Promise<CalculatedPrice | null> {
  const priceList = await prisma.price_list.findUnique({
    where: { id: priceListId },
  });

  if (!priceList) return null;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) return null;

  const replacementCost = getProductBaseCost(product.replacementCost, product.costPrice);

  // Check for exception
  const exception = await prisma.price_list_item.findUnique({
    where: {
      priceListId_productId: {
        priceListId,
        productId,
      },
    },
  });

  const minimumMargin = await getMinimumMargin();

  const finalPrice = exception?.fixedPrice !== null && exception?.fixedPrice !== undefined
    ? Number(exception.fixedPrice)
    : calculateFinalPrice(
        replacementCost,
        Number(priceList.baseMarginPercentage),
        priceList.roundingRule as RoundingRule,
        exception?.overrideMarginPercentage !== null && exception?.overrideMarginPercentage !== undefined
          ? { overrideMarginPercentage: Number(exception.overrideMarginPercentage) }
          : undefined
      );

  const appliedMargin = exception?.overrideMarginPercentage !== null && exception?.overrideMarginPercentage !== undefined
    ? Number(exception.overrideMarginPercentage)
    : Number(priceList.baseMarginPercentage);

  const actualMargin = calculateMarginPercentage(replacementCost, finalPrice);

  return {
    replacementCost,
    baseMargin: Number(priceList.baseMarginPercentage),
    appliedMargin,
    roundingRule: priceList.roundingRule as RoundingRule,
    finalPrice,
    actualMargin,
    isBelowMinimum: actualMargin < minimumMargin,
  };
}
