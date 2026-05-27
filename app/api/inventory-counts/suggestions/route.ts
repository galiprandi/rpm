import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { getSuggestedProductsForCount } from '@/lib/services/inventoryCountService';

/**
 * GET /api/inventory-counts/suggestions?limit=X
 * Get suggested products for a new count based on risk score
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(UserRole.ADMIN);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const suggested = await getSuggestedProductsForCount(limit);
    return NextResponse.json(suggested);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
