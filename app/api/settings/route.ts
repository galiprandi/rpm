/**
 * API Route: /api/settings
 * Methods: GET, PUT
 * Spec: /specs/spec-price-lists.md (REQ-005)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getMinimumMargin, setSetting } from '@/lib/services';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  minimumMarginPercentage: z.number().min(0).max(100),
});

// GET /api/settings - Get global settings
export async function GET() {
  try {
    const minimumMarginPercentage = await getMinimumMargin();

    return NextResponse.json({
      minimumMarginPercentage,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Error fetching settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update global settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const result = updateSettingsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { minimumMarginPercentage } = result.data;

    await setSetting('MINIMUM_MARGIN_PERCENTAGE', minimumMarginPercentage.toString());

    return NextResponse.json({
      minimumMarginPercentage,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Error updating settings' },
      { status: 500 }
    );
  }
}
