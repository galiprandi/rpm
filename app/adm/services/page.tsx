import ServicesClient from './ServicesClient';
import { db } from '@/lib/db';
import { service } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function ServicesPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  const services = await db.query.service.findMany({
    orderBy: asc(service.name),
  });

  return <ServicesClient initialServices={services.map((s) => ({
    ...s,
    baseCost: Number(s.baseCost),
    vehicleFactor: Number(s.vehicleFactor),
    createdAt: new Date(s.createdAt).toISOString(),
    updatedAt: new Date(s.updatedAt).toISOString(),
  })) as any} />;
}
