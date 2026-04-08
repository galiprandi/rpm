import PriceListDetailClient from './PriceListDetailClient';
import { getPriceListById } from '@/lib/services/priceListService';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface PriceListPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PriceListDetailPage({ params }: PriceListPageProps) {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  const { id } = await params;
  const priceList = await getPriceListById(id);

  if (!priceList) {
    throw new Error('Lista de precios no encontrada');
  }

  return <PriceListDetailClient initialPriceList={priceList} />;
}
