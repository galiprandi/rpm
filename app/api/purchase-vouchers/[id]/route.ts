// app/api/purchase-vouchers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withStaffDynamic } from '@/lib/api-middleware';
import { getVoucherById, addItemToVoucher, deleteVoucher, updateVoucherHeader } from '@/lib/services/purchaseVoucherService';

interface Params {
  params: Promise<{ id: string }>;
}

/** GET /api/purchase-vouchers/:id
 *  Retrieve a specific voucher with its items, supplier, and payment method.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withStaffDynamic(async (request: NextRequest, { params }: Params, _session) => {
  const { id } = await params;
  const voucher = await getVoucherById(id);
  if (!voucher) {
    return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
  }
  return NextResponse.json(voucher);
});

/** PUT /api/purchase-vouchers/:id
 *  Update voucher header (supplier, letter, number, date, totalAmount, paymentMethod, notes)
 *  Body: { supplierId, letter, number, date, totalAmount, paymentMethodId, notes }
 */
export const PUT = withStaffDynamic(async (request: NextRequest, { params }: Params, _session) => {
  const { id } = await params;
  const body = await request.json();
  const { supplierId, letter, number, date, totalAmount, paymentMethodId, notes } = body;
  if (!supplierId || !letter || !number || !date || !totalAmount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const { Decimal } = await import('@prisma/client/runtime/library');
    const updated = await updateVoucherHeader({
      voucherId: id,
      supplierId,
      letter,
      number,
      date: new Date(date),
      totalAmount: new Decimal(totalAmount),
      paymentMethodId: paymentMethodId || null,
      notes,
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al actualizar comprobante';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

/** PATCH /api/purchase-vouchers/:id
 *  Add an item to a draft voucher.
 *  Body: { productId, quantity, unitCost }
 */
export const PATCH = withStaffDynamic(async (request: NextRequest, { params }: Params, _session) => {
  const { id } = await params;
  const body = await request.json();
  const { productId, quantity, unitCost } = body;
  if (!productId || !quantity || !unitCost) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const { Decimal } = await import('@prisma/client/runtime/library');
    const item = await addItemToVoucher({
      voucherId: id,
      productId,
      quantity,
      unitCost: new Decimal(unitCost),
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al agregar ítem';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

/** DELETE /api/purchase-vouchers/:id
 *  Delete a draft voucher (only DRAFT status allowed)
 */
export const DELETE = withStaffDynamic(async (request: NextRequest, { params }: Params, _session) => {
  const { id } = await params;
  try {
    await deleteVoucher({ voucherId: id });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al eliminar comprobante';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

