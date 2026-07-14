import { Metadata } from 'next';
import { Suspense } from 'react';
import ServicesClient from './ServicesClient';

export const metadata: Metadata = {
  title: 'Servicios | RPM Accesorios',
  description: 'Instalación certificada de iluminación LED, protección PPF y equipamiento off-road en Tucumán.',
};

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ServicesClient />
    </Suspense>
  );
}
