import { NextRequest, NextResponse } from 'next/server';
import { withStaffDynamic } from '@/lib/api-middleware';
import { finalizeVoucher } from '@/lib/services/purchaseVoucherService';

/** POST /api/purchase-vouchers/:id/finalize
 *  Finalize the draft voucher.
 *  Body (optional): { paymentMethodId }
 */
interface Params {
  params: Promise<{ id: string }>;
}

export const POST = withStaffDynamic(async (request: NextRequest, { params }: Params, _session) => {
  const { id } = await params;
  const body = await request.json();
  const { paymentMethodId } = body;
  try {
    const updated = await finalizeVoucher({
      voucherId: id,
      paymentMethodId,
    });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error al finalizar comprobante';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
