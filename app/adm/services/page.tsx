import ServicesClient from './ServicesClient';
import { prisma } from '@/lib/prisma';
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

  const services = await prisma.service.findMany({
    orderBy: { name: 'asc' },
  });

  return <ServicesClient initialServices={services.map(s => ({
    ...s,
    baseCost: Number(s.baseCost),
    vehicleFactor: Number(s.vehicleFactor),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))} />;
}
