import { NextResponse } from 'next/server';
import { updateVoucherItem, removeVoucherItem } from '@/lib/services/purchaseVoucherService';

/** PATCH /api/purchase-vouchers/:id/items/:itemId
 *  Update an item in a draft voucher.
 *  Body: { quantity?, unitCost?, priceListData? }
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { itemId } = await params;
  const body = await request.json();
  const { quantity, unitCost, priceListData } = body;

  const { Decimal } = await import('@prisma/client/runtime/library');
  try {
    const updated = await updateVoucherItem({
      itemId,
      quantity: quantity !== undefined ? parseInt(quantity) : undefined,
      unitCost: unitCost !== undefined ? new Decimal(unitCost) : undefined,
      priceListData: priceListData || undefined,
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al actualizar ítem';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** DELETE /api/purchase-vouchers/:id/items/:itemId
 *  Remove an item from a draft voucher.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { itemId } = await params;
  try {
    await removeVoucherItem({ itemId });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al eliminar ítem';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
