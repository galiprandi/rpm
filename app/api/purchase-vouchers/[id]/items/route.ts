import { NextRequest, NextResponse } from 'next/server';
import { withStaffDynamic } from '@/lib/api-middleware';
import { addItemToVoucher } from '@/lib/services/purchaseVoucherService';

/** POST /api/purchase-vouchers/:id/items
 *  Add an item to a draft voucher.
 *  Body: { productId, quantity, unitCost, priceListData? }
 */
interface Params {
  params: Promise<{ id: string }>;
}

export const POST = withStaffDynamic(async (request: NextRequest, { params }: Params, _session) => {
  const { id } = await params;
  const body = await request.json();
  const { productId, quantity, unitCost, priceListData } = body;
  if (!productId || quantity === undefined || !unitCost) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const { Decimal } = await import('@prisma/client/runtime/library');
  try {
    const item = await addItemToVoucher({
      voucherId: id,
      productId,
      quantity: parseInt(quantity),
      unitCost: new Decimal(unitCost),
      priceListData: priceListData || undefined,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al agregar ítem';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
