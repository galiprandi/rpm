import CustomersClient from './CustomersClient';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function CustomersPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  const customers = await prisma.customer.findMany({
    take: 50,
    include: {
      vehicle: {
        select: {
          id: true,
          identifier: true,
          category: true,
        },
      },
      _count: {
        select: { work_order: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const customersWithVehicles = customers.map(c => ({
    ...c,
    vehicles: c.vehicle,
    _count: {
      workOrders: c._count.work_order,
    },
  }));

  return <CustomersClient initialCustomers={customersWithVehicles as any} />;
}
