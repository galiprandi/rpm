'use client';

import { Header, CrudStats } from '@/components/adm';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, History, FileText, Plus } from 'lucide-react';

export default function PurchaseVouchersLoading() {
  const stats = [
    {
      label: 'Borradores',
      value: '...',
      icon: FileText,
      iconColor: '#f97316',
    },
    {
      label: 'Finalizados',
      value: '...',
      icon: History,
      iconColor: '#10b981',
    },
    {
      label: 'Total Acumulado',
      value: '...',
      icon: Receipt,
      iconColor: '#3b82f6',
    }
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Comprobantes de Compra"
        description="Gestión y registro de facturas de proveedores y comprobantes"
      />

      <CrudStats stats={stats} />

      <div className="mt-10 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="bg-muted/50 p-4 border-b">
          <div className="flex gap-4 px-4">
            <Skeleton className="h-4 flex-[1.5]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="p-4 border-b last:border-0 flex gap-4 items-center">
            <Skeleton className="h-10 flex-[1.5]" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[100px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
