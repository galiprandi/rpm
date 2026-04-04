/**
 * API Route: /api/price-lists/[id]
 * Methods: GET, PUT, DELETE
 * Spec: /specs/spec-price-lists.md
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getPriceListById,
  updatePriceList,
  deletePriceList,
  getPriceListByName,
  type UpdatePriceListInput,
} from '@/lib/services';
import type { RoundingRule } from '@/lib/utils/rounding';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/price-lists/[id] - Get price list by ID with items
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

    return NextResponse.json({ priceList });
  } catch (error) {
    console.error('Error fetching price list:', error);
    return NextResponse.json(
      { error: 'Error fetching price list' },
      { status: 500 }
    );
  }
}

// PUT /api/price-lists/[id] - Update price list
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify price list exists
    const existing = await getPriceListById(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Price list not found' },
        { status: 404 }
      );
    }

    // Validate unique name if changing
    if (body.name && body.name !== existing.name) {
      const nameExists = await getPriceListByName(body.name);
      if (nameExists) {
        return NextResponse.json(
          { error: 'A price list with that name already exists' },
          { status: 409 }
        );
      }
    }

    // Validate margin percentage
    if (body.baseMarginPercentage !== undefined) {
      if (body.baseMarginPercentage < 0 || body.baseMarginPercentage > 100) {
        return NextResponse.json(
          { error: 'Base margin percentage must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    const input: UpdatePriceListInput = {};

    if (body.name !== undefined) input.name = body.name;
    if (body.baseMarginPercentage !== undefined) input.baseMarginPercentage = body.baseMarginPercentage;
    if (body.roundingRule !== undefined) input.roundingRule = body.roundingRule as RoundingRule;
    if (body.isPublic !== undefined) input.isPublic = body.isPublic;
    if (body.isActive !== undefined) input.isActive = body.isActive;
    if (body.startDate !== undefined) input.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) input.endDate = body.endDate ? new Date(body.endDate) : null;

    const priceList = await updatePriceList(id, input);

    return NextResponse.json({ priceList });
  } catch (error) {
    console.error('Error updating price list:', error);
    return NextResponse.json(
      { error: 'Error updating price list' },
      { status: 500 }
    );
  }
}

// DELETE /api/price-lists/[id] - Delete price list
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Verify price list exists
    const existing = await getPriceListById(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Price list not found' },
        { status: 404 }
      );
    }

    await deletePriceList(id);

    return NextResponse.json({
      message: 'Price list deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting price list:', error);
    return NextResponse.json(
      { error: 'Error deleting price list' },
      { status: 500 }
    );
  }
}
