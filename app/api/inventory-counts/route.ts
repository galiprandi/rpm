import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { getSuggestedProductsForCount, createCountOperative } from '@/lib/services/inventoryCountService';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/inventory-counts
 * List recent inventory counts (Admin/Staff)
 */
export async function GET() {
  try {
    await requireRole(UserRole.STAFF);
    const counts = await prisma.inventory_count_operative.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return NextResponse.json(counts);
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
    return NextResponse.json(operative);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
