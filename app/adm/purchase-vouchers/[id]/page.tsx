import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { getVoucherById } from '@/lib/services/purchaseVoucherService';
import VoucherDetailClient from './VoucherDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function VoucherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  const { id } = await params;
  const voucher = await getVoucherById(id);

  if (!voucher) {
    notFound();
  }

  // Convert types to serializable items
  const voucherFormatted = {
    id: voucher.id,
    supplierId: voucher.supplierId,
    supplier: {
      name: voucher.supplier.name,
    },
    paymentMethod: voucher.paymentMethod ? {
      name: voucher.paymentMethod.name,
    } : null,
    letter: voucher.letter,
    number: voucher.number,
    date: voucher.date.toISOString(),
    totalAmount: voucher.totalAmount.toString(),
    paymentMethodId: voucher.paymentMethodId,
    notes: voucher.notes,
    status: voucher.status as 'DRAFT' | 'FINALIZED',
    createdBy: voucher.createdBy,
    createdAt: voucher.createdAt.toISOString(),
    updatedAt: voucher.updatedAt.toISOString(),
    finalizedAt: voucher.finalizedAt ? voucher.finalizedAt.toISOString() : null,
    items: (voucher.items || []).map((item) => ({
      id: item.id,
      voucherId: item.voucherId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitCost: item.unitCost.toString(),
      subtotal: item.subtotal.toString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };

  return <VoucherDetailClient initialVoucher={voucherFormatted} />;
}
