/**
 * API Route: /api/price-lists/[id]/items/[itemId]
 * Methods: DELETE
 * Spec: /specs/spec-price-lists.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { deletePriceListItem } from '@/lib/services';

interface Params {
  params: Promise<{ id: string; itemId: string }>;
}

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
