// app/api/purchase-vouchers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withStaff } from '@/lib/api-middleware';
import { createDraftVoucher, listVouchers } from '@/lib/services/purchaseVoucherService';
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
  const { purchaseVoucherItems: _raw, ...rest } = voucher;
  return {
    ...rest,
    date: toISODate(voucher.date),
    totalAmount: Number(voucher.totalAmount),
    createdAt: toISODate(voucher.createdAt),
    updatedAt: toISODate(voucher.updatedAt),
    finalizedAt: toISODate(voucher.finalizedAt),
    items,
  };
}

/** GET /api/purchase-vouchers
 *  Returns a list of purchase vouchers. Optional query param ?status=DRAFT|FINALIZED
 */
export const GET = withStaff(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') ?? undefined;
  const vouchers = await listVouchers(status ? { status } : undefined);
  return NextResponse.json(vouchers.map(formatVoucher));
});

/** POST /api/purchase-vouchers
 *  Body: { supplierId, letter, number, date, notes?, createdBy }
 *  Creates a draft purchase voucher.
 */
export const POST = withStaff(async (request: NextRequest, session) => {
  const body = await request.json();
  const { supplierId, letter, number, date, notes, totalAmount, paymentMethodId } = body;
  if (!supplierId || !letter || !number || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const voucher = await createDraftVoucher({
    supplierId,
    letter,
    number,
    date: new Date(date),
    notes,
    totalAmount: Number(totalAmount ?? 0),
    paymentMethodId: paymentMethodId || null,
    createdBy: session.user.id,
  });
  return NextResponse.json(formatVoucher(voucher as unknown as Record<string, unknown>), { status: 201 });
});
