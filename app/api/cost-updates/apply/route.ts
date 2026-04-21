/**
 * API Route: /api/cost-updates/apply
 * POST: Apply cost update to all filtered products
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/api-middleware';
import { applyCostUpdate, type CostUpdateFilters, type CostUpdateAdjustment, type AdjustmentType } from '@/lib/services';

const VALID_ADJUSTMENT_TYPES: AdjustmentType[] = ['PERCENTAGE_INC', 'PERCENTAGE_DEC', 'FIXED_INC', 'FIXED_DEC'];

export const POST = withAdmin(async (request: NextRequest, session) => {
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

    // Apply update
    const batch = await applyCostUpdate(
      filters,
      adjustment,
      session.user.id,
      session.user.name || session.user.email || null
    );

    return NextResponse.json({
      success: true,
      batch,
      message: `Successfully updated ${batch.itemsAffected} products`,
    });
  } catch (error) {
    console.error('Cost update apply error:', error);
    const message = error instanceof Error ? error.message : 'Error applying cost update';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
});
