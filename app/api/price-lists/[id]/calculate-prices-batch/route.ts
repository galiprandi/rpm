/**
 * API Route: /api/price-lists/[id]/calculate-prices-batch
 * Method: POST
 * Body: { productIds: string[] }
 * Spec: /specs/spec-price-lists.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProductBaseCost } from '@/lib/services/priceListService';
import { calculateFinalPrice, type RoundingRule } from '@/lib/utils/rounding';
import { getMinimumMargin } from '@/lib/services/settingsService';

interface Params {
  params: Promise<{ id: string }>;
}

interface BatchRequest {
  productIds: string[];
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body: BatchRequest = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Get price list
    const priceList = await prisma.price_list.findUnique({
      where: { id },
    });

    if (!priceList) {
      return NextResponse.json(
        { error: 'Price list not found' },
        { status: 404 }
      );
    }

    // Get all products
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        replacementCost: true,
        costPrice: true,
      },
    });

    // Get price list items (exceptions)
    const exceptions = await prisma.price_list_item.findMany({
      where: {
        priceListId: id,
        productId: { in: productIds },
      },
    });

    const minimumMargin = await getMinimumMargin();

    // Create a map of productId -> exception
    const exceptionMap = new Map(
      exceptions.map((e) => [e.productId, e])
    );

    // Calculate prices for all products
    const results = products.map((product) => {
      const exception = exceptionMap.get(product.id);
      const replacementCost = getProductBaseCost(product.replacementCost, product.costPrice);

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

      const actualMargin = ((finalPrice - replacementCost) / replacementCost) * 100;

      return {
        productId: product.id,
        name: product.name,
        priceListId: id,
        price: finalPrice,
        appliedMargin,
        actualMargin,
        isBelowMinimum: actualMargin < minimumMargin,
      };
    });

    // Return as map for easy lookup
    const priceMap = results.reduce((acc, result) => {
      acc[result.productId] = result;
      return acc;
    }, {} as Record<string, typeof results[0]>);

    return NextResponse.json(priceMap);
  } catch (error) {
    console.error('Error calculating batch prices:', error);
    return NextResponse.json(
      { error: 'Error calculating prices' },
      { status: 500 }
    );
  }
}
