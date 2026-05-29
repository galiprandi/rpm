/**
 * API Route: /api/price-lists
 * Methods: GET, POST
 * Spec: /specs/spec-price-lists.md
 */
import { NextRequest, NextResponse } from 'next/server';
import { withStaff } from '@/lib/api-middleware';
import {
  getPriceLists,
  createPriceList,
  getPriceListByName,
  type CreatePriceListInput,
} from '@/lib/services';
import type { RoundingRule } from '@/lib/utils/rounding';

// GET /api/price-lists - List price lists (requiere STAFF)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withStaff(async (request: NextRequest, _session) => {
  try {
    const { searchParams } = request.nextUrl;
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
});

// POST /api/price-lists - Create price list (requiere ADMIN)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const POST = withStaff(async (request: NextRequest, _session) => {
  try {
    const body = await request.json();

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

    if (body.baseMarginPercentage < 0) {
      return NextResponse.json(
        { error: 'Base margin percentage must be greater than or equal to 0' },
        { status: 400 }
      );
    }

    // Check unique name
    const existing = await getPriceListByName(body.name);

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

    const priceList = await createPriceList(input);

    return NextResponse.json({ priceList }, { status: 201 });
  } catch (error) {
    console.error('Error creating price list:', error);
    return NextResponse.json(
      { error: 'Error creating price list', details: (error as Error).message },
      { status: 500 }
    );
  }
});
