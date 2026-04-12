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

  // Helper para convertir Decimal a number
  const decimalToNumber = (decimal: unknown): number => {
    if (decimal === null || decimal === undefined) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal === 'object' && 'toNumber' in decimal && typeof (decimal as { toNumber: () => number }).toNumber === 'function') {
      return (decimal as { toNumber: () => number }).toNumber();
    }
    return 0;
  };

  const customersWithVehicles = customers.map(c => ({
    ...c,
    balance: decimalToNumber(c.balance),
    vehicles: c.vehicle,
    _count: {
      workOrders: c._count.work_order,
    },
  }));

  return <CustomersClient initialCustomers={customersWithVehicles as unknown as any} />;
}
