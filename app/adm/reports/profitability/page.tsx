import ProfitabilityReportClient from './ProfitabilityReportClient';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export default async function ProfitabilityReportPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  return <ProfitabilityReportClient />;
}
