import { headers } from 'next/headers';
import PriceListDetailClient from './PriceListDetailClient';

interface PriceListItem {
  id: string;
  productId: string | null;
  productName?: string;
  productSku?: string;
  replacementCost?: number;
  overrideMarginPercentage: number | null;
  fixedPrice: number | null;
  finalPrice: number;
  actualMargin: number;
  isBelowMinimum: boolean;
}

interface PriceListDetail {
  id: string;
  name: string;
  isPublic: boolean;
  isActive: boolean;
  baseMarginPercentage: number;
  roundingRule: string;
  itemCount: number;
  items: PriceListItem[];
}

interface PriceListPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PriceListDetailPage({ params }: PriceListPageProps) {
  // Next.js 15: params is a Promise
  const { id } = await params;
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/price-lists/${id}`, {
    cache: 'no-store',
  });
  const data = await res.json();
  const priceList: PriceListDetail = data.priceList;

  return <PriceListDetailClient initialPriceList={priceList} />;
}
