/**
 * API Route: /api/price-lists
 * Methods: GET, POST
 * Spec: /specs/spec-price-lists.md
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getPriceLists,
  createPriceList,
  getPriceListByName,
  type CreatePriceListInput,
} from '@/lib/services';
import type { RoundingRule } from '@/lib/utils/rounding';

// GET /api/price-lists - List price lists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const result = await getPriceLists(includeInactive);

    return NextResponse.json({ priceLists: result.priceLists });
  } catch (error) {
    console.error('Error fetching price lists:', error);
    return NextResponse.json(
      { error: 'Error fetching price lists' },
      { status: 500 }
    );
  }
}

// POST /api/price-lists - Create price list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[DEBUG] Creating price list with body:', JSON.stringify(body, null, 2));

    // Validations
    if (!body.name) {
      return NextResponse.json(
        { error: 'Price list name is required' },
        { status: 400 }
      );
    }

    if (body.baseMarginPercentage === undefined || body.baseMarginPercentage === null) {
      return NextResponse.json(
        { error: 'Base margin percentage is required' },
        { status: 400 }
      );
    }

    if (body.baseMarginPercentage < 0 || body.baseMarginPercentage > 100) {
      return NextResponse.json(
        { error: 'Base margin percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Check unique name
    console.log('[DEBUG] Checking existing name:', body.name);
    const existing = await getPriceListByName(body.name);
    console.log('[DEBUG] Existing price list:', existing);

    if (existing) {
      return NextResponse.json(
        { error: 'A price list with that name already exists' },
        { status: 409 }
      );
    }

    const input: CreatePriceListInput = {
      name: body.name,
      baseMarginPercentage: body.baseMarginPercentage,
      roundingRule: body.roundingRule as RoundingRule ?? 'SMART_HUNDREDS',
      isPublic: body.isPublic ?? false,
      isActive: body.isActive ?? true,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    };

    console.log('[DEBUG] Creating with input:', JSON.stringify(input, null, 2));
    const priceList = await createPriceList(input);
    console.log('[DEBUG] Created successfully:', priceList.id);

    return NextResponse.json({ priceList }, { status: 201 });
  } catch (error) {
    console.error('[DEBUG] Error creating price list:', error);
    console.error('[DEBUG] Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Error creating price list', details: (error as Error).message },
      { status: 500 }
    );
  }
}
