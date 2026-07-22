import { getSession, hasRole } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { vehicle } from '@/db/schema';
import { desc, count } from 'drizzle-orm';
import { toISODate } from '@/lib/utils/date';
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
  const [vehicles, totalResult] = await Promise.all([
    db.query.vehicle.findMany({
      limit: 200, // Fetch more for initial client-side filtering/search
      with: {
        customer: true,
        vehicleMake: true,
        vehicleModel: true,
        workOrders: true,
      },
      orderBy: desc(vehicle.createdAt),
    }),
    db.select({ count: count() }).from(vehicle),
  ]);

  const vehiclesFormatted = vehicles.map((v) => ({
    ...v,
    createdAt: toISODate(v.createdAt),
    updatedAt: toISODate(v.updatedAt),
    _count: {
      workOrders: (v.workOrders || []).length,
    },
  }));

  return (
    <VehiclesClient
      initialVehicles={vehiclesFormatted as any}
      totalVehicles={totalResult[0].count}
    />
  );
}
