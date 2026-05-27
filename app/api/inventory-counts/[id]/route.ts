import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { getOperativeDetails } from '@/lib/services/inventoryCountService';

/**
 * GET /api/inventory-counts/[id]
 * Get details of a specific count operative
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(UserRole.STAFF);
    const { id } = await params;
    const details = await getOperativeDetails(id);

    if (!details) {
      return NextResponse.json({ error: 'Operativo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
