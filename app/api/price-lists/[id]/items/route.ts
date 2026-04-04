/**
 * API Route: /api/price-lists/[id]/items
 * Methods: GET, POST
 * Spec: /specs/spec-price-lists.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPriceListById, createPriceListItem } from '@/lib/services';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/price-lists/[id]/items - Get items for a price list
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const priceList = await getPriceListById(id);

    if (!priceList) {
      return NextResponse.json(
        { error: 'Price list not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ items: priceList.items });
  } catch (error) {
    console.error('Error fetching price list items:', error);
    return NextResponse.json(
      { error: 'Error fetching price list items' },
      { status: 500 }
    );
  }
}

// POST /api/price-lists/[id]/items - Add item to price list
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validations
    if (!body.productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate margin override if provided
    if (body.overrideMarginPercentage !== undefined && body.overrideMarginPercentage !== null) {
      if (body.overrideMarginPercentage < 0 || body.overrideMarginPercentage > 100) {
        return NextResponse.json(
          { error: 'Override margin percentage must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    // Validate fixed price if provided
    if (body.fixedPrice !== undefined && body.fixedPrice !== null) {
      if (body.fixedPrice < 0) {
        return NextResponse.json(
          { error: 'Fixed price cannot be negative' },
          { status: 400 }
        );
      }
    }

    const item = await createPriceListItem(id, {
      productId: body.productId,
      overrideMarginPercentage: body.overrideMarginPercentage,
      fixedPrice: body.fixedPrice,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Error creating price list item:', error);

    if (error instanceof Error && error.message === 'Price list not found') {
      return NextResponse.json(
        { error: 'Price list not found' },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === 'Product not found') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error creating price list item' },
      { status: 500 }
    );
  }
}
