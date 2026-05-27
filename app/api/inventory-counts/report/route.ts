import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { reportItemCount } from '@/lib/services/inventoryCountService';

/**
 * POST /api/inventory-counts/report
 * Report a single item count from mobile view
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(UserRole.STAFF); // Anything but USER
    const body = await request.json();
    const { itemId, isFound, countedStock, newLocation } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId es requerido' }, { status: 400 });
    }

    await reportItemCount(itemId, session.user.id, {
      isFound,
      countedStock: countedStock !== undefined ? parseInt(countedStock) : undefined,
      newLocation
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
