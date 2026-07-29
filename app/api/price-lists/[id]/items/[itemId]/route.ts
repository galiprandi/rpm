/**
 * API Route: /api/price-lists/[id]/items/[itemId]
 * Methods: PUT, DELETE
 * Spec: /specs/spec-price-lists.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAdminDynamic } from '@/lib/api-middleware';
import { updatePriceListItem, deletePriceListItem } from '@/lib/services';

interface Params {
  params: Promise<{ id: string; itemId: string }>;
}

// PUT /api/price-lists/[id]/items/[itemId] - Update item in price list
export const PUT = withAdminDynamic(async (request: NextRequest, { params }: Params) => {
  try {
    const { itemId } = await params;
    const body = await request.json();

    // Validate margin override if provided
    if (body.overrideMarginPercentage !== undefined && body.overrideMarginPercentage !== null) {
      if (body.overrideMarginPercentage < 0) {
        return NextResponse.json(
          { error: 'Override margin percentage must be greater than or equal to 0' },
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

    const item = await updatePriceListItem(itemId, {
      overrideMarginPercentage: body.overrideMarginPercentage,
      fixedPrice: body.fixedPrice,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating price list item:', error);

    if (error instanceof Error && error.message === 'Price list item not found') {
      return NextResponse.json(
        { error: 'Price list item not found' },
        { status: 404 }
      );
    }

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
      { error: 'Error updating price list item' },
      { status: 500 }
    );
  }
});

// DELETE /api/price-lists/[id]/items/[itemId] - Remove item from price list
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { itemId } = await params;

    await deletePriceListItem(itemId);

    return NextResponse.json({
      message: 'Price list item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting price list item:', error);
    return NextResponse.json(
      { error: 'Error deleting price list item' },
      { status: 500 }
    );
  }
}
