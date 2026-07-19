import { Metadata } from 'next';
import { Suspense } from 'react';
import ProductsClient from './ProductsClient';
import { getPublicCatalog } from '@/lib/services/publicCatalogService';

// Revalidate the public catalog at most every 10 minutes.
export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Productos | RPM Accesorios',
  description: 'Explora nuestro catálogo curado de accesorios premium para vehículos: iluminación, estética y equipamiento off-road.',
};

export default async function ProductsPage() {
  // Server-side fetch. Errors propagate to Next.js (renders error.tsx / 500)
  // so we never show a fake static catalog when the DB is unavailable.
  const catalog = await getPublicCatalog();
  const categories = ['Todos', ...catalog.categories.map((c) => c.name)];

  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ProductsClient initialProducts={catalog.products} initialCategories={categories} />
    </Suspense>
  );
}
