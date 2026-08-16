/**
 * API Route: /api/settings
 * Methods: GET, PUT
 * Spec: /specs/spec-price-lists.md (REQ-005)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/api-middleware';
import { getMinimumMargin, setSetting, getSetting } from '@/lib/services';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  minimumMarginPercentage: z.number().min(0).max(100).optional(),
  afipCuit: z.string().optional(),
  afipPuntoVenta: z.string().optional(),
  afipResponsable: z.string().optional(),
  afipProduction: z.boolean().optional(),
});

// GET /api/settings - Get global settings (requiere can_manage_settings)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withPermission('can_manage_settings', async (request: NextRequest, _session) => {
  try {
    const [
      minimumMarginPercentage,
      afipCuit,
      afipPuntoVenta,
      afipResponsable,
      afipProduction,
    ] = await Promise.all([
      getMinimumMargin(),
      getSetting('AFIP_CUIT'),
      getSetting('AFIP_PUNTO_VENTA'),
      getSetting('AFIP_RESPONSABLE'),
      getSetting('AFIP_PRODUCTION'),
    ]);

    return NextResponse.json({
      minimumMarginPercentage,
      afipCuit,
      afipPuntoVenta,
      afipResponsable,
      afipProduction: afipProduction === 'true',
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Error fetching settings' },
      { status: 500 }
    );
  }
});

// PUT /api/settings - Update global settings (requiere can_manage_settings)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const PUT = withPermission('can_manage_settings', async (request: NextRequest, _session) => {
  try {
    const body = await request.json();

    const result = updateSettingsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.format() },
        { status: 400 }
      );
    }

    const {
      minimumMarginPercentage,
      afipCuit,
      afipPuntoVenta,
      afipResponsable,
      afipProduction,
    } = result.data;

    if (minimumMarginPercentage !== undefined) {
      await setSetting(
        'MINIMUM_MARGIN_PERCENTAGE',
        minimumMarginPercentage.toString()
      );
    }

    if (afipCuit !== undefined) {
      await setSetting('AFIP_CUIT', afipCuit);
    }

    if (afipPuntoVenta !== undefined) {
      await setSetting('AFIP_PUNTO_VENTA', afipPuntoVenta);
    }

    if (afipResponsable !== undefined) {
      await setSetting('AFIP_RESPONSABLE', afipResponsable);
    }

    if (afipProduction !== undefined) {
      await setSetting('AFIP_PRODUCTION', afipProduction.toString());
    }

    return NextResponse.json({
      minimumMarginPercentage,
      afipCuit: afipCuit ?? '',
      afipPuntoVenta: afipPuntoVenta ?? '1',
      afipResponsable: afipResponsable ?? 'RI',
      afipProduction: !!afipProduction,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Error updating settings' },
      { status: 500 }
    );
  }
});
