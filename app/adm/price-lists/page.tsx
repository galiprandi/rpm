import { headers } from 'next/headers';
import PriceListsClient from './PriceListsClient';

interface PriceList {
  id: string;
  name: string;
  isPublic: boolean;
  isActive: boolean;
  baseMarginPercentage: number;
  roundingRule: string;
  itemCount: number;
}

export default async function PriceListsPage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/price-lists?includeInactive=true`, {
    cache: 'no-store',
  });
  const data = await res.json();
  const priceLists: PriceList[] = data.priceLists || [];

  return <PriceListsClient initialPriceLists={priceLists} />;
}
