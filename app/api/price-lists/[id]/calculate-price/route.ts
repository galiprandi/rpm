/**
 * API Route: /api/price-lists/[id]/calculate-price
 * Method: GET
 * Query params: productId
 * Spec: /specs/spec-price-lists.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { calculateProductPrice } from '@/lib/services';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/price-lists/[id]/calculate-price?productId=xxx
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const result = await calculateProductPrice(productId, id);

    if (!result) {
      return NextResponse.json(
        { error: 'Price list or product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating product price:', error);
    return NextResponse.json(
      { error: 'Error calculating price' },
      { status: 500 }
    );
  }
}
