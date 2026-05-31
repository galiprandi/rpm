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
        primaryAction={{
          label: 'Nuevo Comprobante',
          icon: Plus,
          disabled: true,
        }}
      />

      <CrudStats stats={stats} />

      <div className="bg-card rounded-lg border shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-72" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
