import CustomersClient from './CustomersClient';
import { db } from '@/lib/db';
import { customer } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { toISODate } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function CustomersPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  const customers = await db.query.customer.findMany({
    limit: 50,
    with: {
      vehicles: true,
      workOrders: true,
    },
    orderBy: asc(customer.name),
  });

  const customersWithVehicles = customers.map((c) => ({
    ...c,
    balance: Number(c.balance),
    createdAt: toISODate(c.createdAt),
    updatedAt: toISODate(c.updatedAt),
    vehicles: c.vehicles || [],
    _count: {
      workOrders: (c.workOrders || []).length,
    },
  }));

  return <CustomersClient initialCustomers={customersWithVehicles as any} isAdmin={userRole === UserRole.ADMIN} />;
}
