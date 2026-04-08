import PaymentMethodsClient from './PaymentMethodsClient';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function PaymentMethodsPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN) {
    throw new Error('Acceso denegado');
  }

  const paymentMethods = await prisma.payment_method.findMany({
    orderBy: [
      { isActive: 'desc' },
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
  });

  return <PaymentMethodsClient initialPaymentMethods={paymentMethods} />;
}
