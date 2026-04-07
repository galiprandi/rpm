import { headers } from 'next/headers';
import CategoriesClient from './CategoriesClient';

interface Category {
  id: string;
  name: string;
  description: string | null;
  defaultMarginPercent: number;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export default async function CategoriesPage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/categories?includeInactive=true`, {
    cache: 'no-store',
  });
  const data = await res.json();
  const categories: Category[] = data.categories || [];

  return <CategoriesClient initialCategories={categories} />;
}
