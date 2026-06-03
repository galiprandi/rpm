/**
 * API Route: /api/cost-updates/preview
 * POST: Preview cost update changes without applying them
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { previewCostUpdate, type CostUpdateFilters, type CostUpdateAdjustment, type AdjustmentType } from '@/lib/services';

const VALID_ADJUSTMENT_TYPES: AdjustmentType[] = ['PERCENTAGE_INC', 'PERCENTAGE_DEC', 'FIXED_INC', 'FIXED_DEC'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const POST = withAdmin(async (request: NextRequest, _session) => {
  try {
    const body = await request.json();

    // Validate filters
    const filters: CostUpdateFilters = {};
    if (body.filters?.supplierId) {
      filters.supplierId = body.filters.supplierId;
    }
    if (body.filters?.categoryId) {
      filters.categoryId = body.filters.categoryId;
    }
    if (body.filters?.search) {
      filters.search = body.filters.search;
    }
    if (body.filters?.priceListId) {
      filters.priceListId = body.filters.priceListId;
    }
    if (Array.isArray(body.filters?.productIds)) {
      filters.productIds = body.filters.productIds;
    }

    // Validate adjustment
    if (!body.adjustment?.type || !VALID_ADJUSTMENT_TYPES.includes(body.adjustment.type)) {
      return NextResponse.json(
        { error: 'Invalid adjustment type. Must be one of: PERCENTAGE_INC, PERCENTAGE_DEC, FIXED_INC, FIXED_DEC' },
        { status: 400 }
      );
    }

    if (typeof body.adjustment?.value !== 'number' || body.adjustment.value < 0) {
      return NextResponse.json(
        { error: 'Invalid adjustment value. Must be a positive number' },
        { status: 400 }
      );
    }

    const adjustment: CostUpdateAdjustment = {
      type: body.adjustment.type,
      value: body.adjustment.value,
    };

    // Pagination params
    const page = Math.max(1, Number(body.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(body.pageSize) || 20));

    // Get preview
    const result = await previewCostUpdate(filters, adjustment, page, pageSize);

    return NextResponse.json({
      ...result,
      page,
      pageSize,
      totalPages: Math.ceil(result.totalItems / pageSize),
    });
  } catch (error) {
    console.error('Cost update preview error:', error);
    const message = error instanceof Error ? error.message : 'Error generating preview';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
});
