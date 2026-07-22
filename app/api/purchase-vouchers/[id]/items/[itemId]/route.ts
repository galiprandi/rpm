import { NextRequest, NextResponse } from 'next/server';
import { withStaffDynamic } from '@/lib/api-middleware';
import { updateVoucherItem, removeVoucherItem } from '@/lib/services/purchaseVoucherService';

/** PATCH /api/purchase-vouchers/:id/items/:itemId
 *  Update an item in a draft voucher.
 *  Body: { quantity?, unitCost?, priceListData? }
 */
interface Params {
  params: Promise<{ id: string; itemId: string }>;
}

export const PATCH = withStaffDynamic(async (request: NextRequest, { params }: Params, _session) => {
  const { itemId } = await params;
  const body = await request.json();
  const { quantity, unitCost, priceListData } = body;

  try {
    const updated = await updateVoucherItem({
      itemId,
      quantity: quantity !== undefined ? parseInt(quantity) : undefined,
      unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
      priceListData: priceListData || undefined,
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al actualizar ítem';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

/** DELETE /api/purchase-vouchers/:id/items/:itemId
 *  Remove an item from a draft voucher.
 */
export const DELETE = withStaffDynamic(async (_request: NextRequest, { params }: Params, _session) => {
  const { itemId } = await params;
  try {
    await removeVoucherItem({ itemId });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al eliminar ítem';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
