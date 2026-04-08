import PriceListsClient from './PriceListsClient';
import { getPriceLists } from '@/lib/services/priceListService';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function PriceListsPage() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  const data = await getPriceLists(true);
  const priceLists = data.priceLists;

  return <PriceListsClient initialPriceLists={priceLists} />;
}
