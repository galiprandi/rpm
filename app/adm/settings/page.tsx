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

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'MINIMUM_MARGIN_PERCENTAGE',
          'AFIP_CUIT',
          'AFIP_PUNTO_VENTA',
          'AFIP_RESPONSABLE',
          'AFIP_PRODUCTION',
          'AFIP_CERT_PATH',
        ],
      },
    },
  });

  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  const initialMinimumMargin = settingsMap['MINIMUM_MARGIN_PERCENTAGE']
    ? Number(settingsMap['MINIMUM_MARGIN_PERCENTAGE'])
    : 15.0;

  const initialAfipSettings = {
    cuit: settingsMap['AFIP_CUIT'] || '',
    puntoVenta: settingsMap['AFIP_PUNTO_VENTA'] || '1',
    responsable: settingsMap['AFIP_RESPONSABLE'] || 'RI',
    production: settingsMap['AFIP_PRODUCTION'] === 'true',
    certPath: settingsMap['AFIP_CERT_PATH'] || '',
  };

  return (
    <SettingsClient
      initialMinimumMargin={initialMinimumMargin}
      initialAfipSettings={initialAfipSettings}
    />
  );
}
