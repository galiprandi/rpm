import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { listVouchers } from '@/lib/services/purchaseVoucherService';
import PurchaseVouchersClient from './PurchaseVouchersClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PurchaseVouchersPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  const vouchers = await listVouchers();

  // Convert decimal properties to string or serializable types for the client component
  const vouchersFormatted = vouchers.map((v) => {
    const itemsCount = v.items?.length ?? 0;
    const itemsSubtotal = v.items?.reduce((sum, it) => sum + Number(it.subtotal), 0) ?? 0;
    return {
      id: v.id,
      supplierId: v.supplierId,
      supplier: {
        name: v.supplier.name,
      },
      letter: v.letter,
      number: v.number,
      date: v.date.toISOString(),
      totalAmount: v.totalAmount.toString(),
      paymentMethodId: v.paymentMethodId,
      paymentMethod: v.paymentMethod ? { name: v.paymentMethod.name } : null,
      notes: v.notes,
      status: v.status as 'DRAFT' | 'FINALIZED',
      createdBy: v.createdBy,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
      finalizedAt: v.finalizedAt ? v.finalizedAt.toISOString() : null,
      itemsCount,
      itemsSubtotal,
    };
  });

  return <PurchaseVouchersClient initialVouchers={vouchersFormatted} />;
}
