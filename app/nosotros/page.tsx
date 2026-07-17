import { Suspense } from 'react';
import { AboutClient } from '@/components/public/AboutClient';
import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | RPM Accesorios',
  description: 'Más de una década de trayectoria equipando los mejores vehículos de Tucumán con estándares de excelencia.',
};

export default function AboutPage() {
  return (
    <PublicLayout>
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <AboutClient />
      </Suspense>
    </PublicLayout>
  );
}
