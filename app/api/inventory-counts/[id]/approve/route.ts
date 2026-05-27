import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { approveOperative } from '@/lib/services/inventoryCountService';

/**
 * POST /api/inventory-counts/[id]/approve
 * Approve and apply inventory count adjustments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(UserRole.ADMIN);
    const { id } = await params;
    const body = await request.json();
    const { adjustments } = body;

    if (!adjustments || !Array.isArray(adjustments)) {
      return NextResponse.json({ error: 'Ajustes son requeridos' }, { status: 400 });
    }

    await approveOperative(id, session.user.id, adjustments);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
