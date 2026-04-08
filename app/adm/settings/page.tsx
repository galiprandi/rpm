import SettingsClient from './SettingsClient';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function SettingsPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN) {
    throw new Error('Acceso denegado');
  }

  const setting = await prisma.setting.findUnique({
    where: { key: 'MINIMUM_MARGIN_PERCENTAGE' },
  });

  const initialMinimumMargin = setting ? Number(setting.value) : 15.0;

  return <SettingsClient initialMinimumMargin={initialMinimumMargin} />;
}
