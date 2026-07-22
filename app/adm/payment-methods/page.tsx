import PaymentMethodsClient from './PaymentMethodsClient';
import { db } from '@/lib/db';
import { paymentMethod } from '@/db/schema';
import { desc, asc } from 'drizzle-orm';
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

  const paymentMethods = await db.query.paymentMethod.findMany({
    orderBy: [desc(paymentMethod.isActive), asc(paymentMethod.sortOrder), asc(paymentMethod.name)],
  });

  return <PaymentMethodsClient initialPaymentMethods={paymentMethods as any} />;
}
