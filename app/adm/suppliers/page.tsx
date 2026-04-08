import SuppliersClient from './SuppliersClient';
import { getSuppliers } from '@/lib/services/supplierService';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function SuppliersPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  const data = await getSuppliers(true);
  const suppliers = data.suppliers;

  return <SuppliersClient initialSuppliers={suppliers} />;
}
