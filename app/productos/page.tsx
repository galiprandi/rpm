import { Metadata } from 'next';
import { Suspense } from 'react';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'Productos | RPM Accesorios',
  description: 'Explora nuestro catálogo curado de accesorios premium para vehículos: iluminación, estética y equipamiento off-road.',
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ProductsClient />
    </Suspense>
  );
}
