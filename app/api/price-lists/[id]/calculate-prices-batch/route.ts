/**
 * API Route: /api/price-lists/[id]/calculate-prices-batch
 * Method: POST
 * Body: { productIds: string[] }
 * Spec: /specs/spec-price-lists.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { priceList, product, priceListItem } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
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
    const priceListRecord = await db.query.priceList.findFirst({
      where: eq(priceList.id, id),
    });

    if (!priceListRecord) {
      return NextResponse.json(
        { error: 'Price list not found' },
        { status: 404 }
      );
    }

    // Get all products
    const products = await db.query.product.findMany({
      where: inArray(product.id, productIds),
      columns: {
        id: true,
        name: true,
        replacementCost: true,
        costPrice: true,
      },
    });

    // Get price list items (exceptions)
    const exceptions = await db.query.priceListItem.findMany({
      where: and(
        eq(priceListItem.priceListId, id),
        inArray(priceListItem.productId, productIds),
      ),
    });

    const minimumMargin = await getMinimumMargin();

    // Create a map of productId -> exception
    const exceptionMap = new Map(
      exceptions.map((e) => [e.productId, e])
    );

    // Calculate prices for all products
    const results = products.map((productRecord) => {
      const exception = exceptionMap.get(productRecord.id);
      const replacementCost = getProductBaseCost(productRecord.replacementCost, productRecord.costPrice);

      const finalPrice = exception?.fixedPrice !== null && exception?.fixedPrice !== undefined
        ? Number(exception.fixedPrice)
        : calculateFinalPrice(
            replacementCost,
            Number(priceListRecord.baseMarginPercentage),
            priceListRecord.roundingRule as RoundingRule,
            exception?.overrideMarginPercentage !== null && exception?.overrideMarginPercentage !== undefined
              ? { overrideMarginPercentage: Number(exception.overrideMarginPercentage) }
              : undefined
          );

      const appliedMargin = exception?.overrideMarginPercentage !== null && exception?.overrideMarginPercentage !== undefined
        ? Number(exception.overrideMarginPercentage)
        : Number(priceListRecord.baseMarginPercentage);

      const actualMargin = ((finalPrice - replacementCost) / replacementCost) * 100;

      return {
        productId: productRecord.id,
        name: productRecord.name,
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
