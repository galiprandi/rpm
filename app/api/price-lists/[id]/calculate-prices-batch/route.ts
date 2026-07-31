/**
 * API Route: /api/price-lists/[id]/calculate-prices-batch
 * Method: POST
 * Body: { productIds: string[] }
 * Spec: /specs/features/price-lists.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { calculateBatchPrices } from '@/lib/services/priceCalculationService';

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

    // Compute prices via the centralized service (resolves basePriceListId
    // chains + exceptions + rounding consistently across the system).
    const priceMap = await calculateBatchPrices(productIds, [id]);

    const results = productIds.map((productId) => {
      const calc = priceMap.get(productId)?.get(id);
      return {
        productId,
        priceListId: id,
        price: calc?.finalPrice ?? 0,
        appliedMargin: calc?.appliedMargin ?? 0,
        actualMargin: calc?.actualMargin ?? 0,
        isBelowMinimum: calc?.isBelowMinimum ?? false,
      };
    });

    // Return as map for easy lookup
    const result = results.reduce((acc, r) => {
      acc[r.productId] = r;
      return acc;
    }, {} as Record<string, typeof results[0]>);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating batch prices:', error);
    return NextResponse.json(
      { error: 'Error calculating prices' },
      { status: 500 }
    );
  }
}
