import StockReportClient from './StockReportClient';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export const metadata = {
  title: 'Reporte de Stock | RPM Accesorios',
};

export default async function StockReportPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  return <StockReportClient />;
}
