import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { getOperativeDetails } from '@/lib/services/inventoryCountService';
import { toISODate } from '@/lib/utils/date';

/** Convert an inventory count item's timestamp fields for API output. */
function formatCountItem(item: Record<string, unknown>) {
  return {
    ...item,
    reportedAt: toISODate(item.reportedAt),
  };
}

/** Convert an inventory count operative's timestamp fields for API output. */
function formatOperativeDetails(details: Record<string, unknown>) {
  const items = Array.isArray(details.items)
    ? details.items.map((i) => formatCountItem(i as Record<string, unknown>))
    : details.items;
  return {
    ...details,
    createdAt: toISODate(details.createdAt),
    updatedAt: toISODate(details.updatedAt),
    finishedAt: toISODate(details.finishedAt),
    approvedAt: toISODate(details.approvedAt),
    items,
  };
}

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

    return NextResponse.json(formatOperativeDetails(details as unknown as Record<string, unknown>));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
