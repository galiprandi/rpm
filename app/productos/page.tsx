import { Metadata } from 'next';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'Productos | RPM Accesorios',
  description: 'Explora nuestro catálogo curado de accesorios premium para vehículos: iluminación, estética y equipamiento off-road.',
};

export default function ProductsPage() {
  return <ProductsClient />;
}
