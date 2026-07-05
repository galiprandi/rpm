import { getSession, hasRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import VehiclesClient from './VehiclesClient';

export const dynamic = 'force-dynamic';

export default async function VehiclesPage() {
  // Validate session and role
  const session = await getSession();
  if (!session?.user) {
    redirect('/login?callbackUrl=/adm/vehicles');
  }

  const isAuthorized = await hasRole(UserRole.STAFF);
  if (!isAuthorized) {
    redirect('/');
  }

  // Fetch initial data
  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      take: 200, // Fetch more for initial client-side filtering/search
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vehicle_make: true,
        vehicle_model: true,
        _count: {
          select: {
            work_order: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vehicle.count(),
  ]);

  return (
    <VehiclesClient
      initialVehicles={vehicles as any}
      totalVehicles={total}
    />
  );
}
