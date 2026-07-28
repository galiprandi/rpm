import { NextRequest, NextResponse } from 'next/server';
import { withPermissionDynamic } from '@/lib/api-middleware';
import { approveOperative } from '@/lib/services/inventoryCountService';

/**
 * POST /api/inventory-counts/[id]/approve
 * Approve and apply inventory count adjustments (requiere can_approve_inventory)
 */
export const POST = withPermissionDynamic('can_approve_inventory', async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  session
) => {
  try {
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
});
