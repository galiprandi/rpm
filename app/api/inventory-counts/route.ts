import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { getSuggestedProductsForCount, createCountOperative } from '@/lib/services/inventoryCountService';
import { db } from '@/lib/db';
import { inventoryCountOperative } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { toISODate } from '@/lib/utils/date';

/** Convert an inventory count operative's timestamp fields for API output. */
function formatOperative(op: Record<string, unknown>) {
  return {
    ...op,
    createdAt: toISODate(op.createdAt),
    updatedAt: toISODate(op.updatedAt),
    finishedAt: toISODate(op.finishedAt),
    approvedAt: toISODate(op.approvedAt),
  };
}

/**
 * GET /api/inventory-counts
 * List recent inventory counts (Admin/Staff)
 */
export async function GET() {
  try {
    await requireRole(UserRole.STAFF);
    const counts = await db.query.inventoryCountOperative.findMany({
      orderBy: desc(inventoryCountOperative.createdAt),
      limit: 20
    });
    return NextResponse.json(counts.map((c) => formatOperative(c as unknown as Record<string, unknown>)));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 });
  }
}

/**
 * POST /api/inventory-counts
 * Create a new inventory count operative
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(UserRole.ADMIN);
    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos un producto' }, { status: 400 });
    }

    const operative = await createCountOperative(session.user.id, productIds);
    return NextResponse.json(formatOperative(operative as unknown as Record<string, unknown>));
  } catch (error: unknown) {
    console.error('Error creating inventory count:', error);
    return NextResponse.json({ error: 'Error al crear arqueo de inventario' }, { status: 500 });
  }
}
