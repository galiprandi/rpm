// app/api/purchase-vouchers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withStaffDynamic } from '@/lib/api-middleware';
import { getVoucherById, addItemToVoucher, deleteVoucher, updateVoucherHeader } from '@/lib/services/purchaseVoucherService';
import { toISODate } from '@/lib/utils/date';

/** Convert a purchase voucher item's numeric/timestamp fields for API output. */
function formatVoucherItem(item: Record<string, unknown>) {
  return {
    ...item,
    unitCost: Number(item.unitCost),
    subtotal: Number(item.subtotal),
    createdAt: toISODate(item.createdAt),
    updatedAt: toISODate(item.updatedAt),
  };
}

/** Convert a purchase voucher's numeric/timestamp fields for API output. */
function formatVoucher(voucher: Record<string, unknown>) {
  const items = Array.isArray(voucher.items)
    ? voucher.items.map(formatVoucherItem)
    : voucher.items;
  return {
    ...voucher,
    date: toISODate(voucher.date),
    totalAmount: Number(voucher.totalAmount),
    createdAt: toISODate(voucher.createdAt),
    updatedAt: toISODate(voucher.updatedAt),
    finalizedAt: toISODate(voucher.finalizedAt),
    items,
  };
}

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
  return NextResponse.json(formatVoucher(voucher as unknown as Record<string, unknown>));
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
    const updated = await updateVoucherHeader({
      voucherId: id,
      supplierId,
      letter,
      number,
      date: new Date(date),
      totalAmount: Number(totalAmount),
      paymentMethodId: paymentMethodId || null,
      notes,
    });
    return NextResponse.json(formatVoucher(updated as unknown as Record<string, unknown>));
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
    const item = await addItemToVoucher({
      voucherId: id,
      productId,
      quantity,
      unitCost: Number(unitCost),
    });
    return NextResponse.json(formatVoucherItem(item as unknown as Record<string, unknown>), { status: 201 });
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

