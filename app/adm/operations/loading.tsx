'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Header, CrudStats } from '@/components/adm';
import { RefreshCw, TrendingUp, TrendingDown, Scale } from 'lucide-react';

export default function OperationsLoading() {
  return (
    <div className="space-y-6">
      <Header
        title="Operaciones Diarias"
        description="Seguimiento de movimientos de caja y ventas"
        leftActions={
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1 shadow-sm h-9">
            <div className="w-4 h-4 bg-muted rounded-full animate-pulse" />
            <Skeleton className="h-7 w-32" />
          </div>
        }
        secondaryActions={[
          {
            label: "Actualizar",
            onClick: () => {},
            icon: RefreshCw,
            disabled: true,
          }
        ]}
      />

      <CrudStats
        stats={[
          { label: 'Ingresos', value: <Skeleton className="h-4 w-20" />, icon: TrendingUp },
          { label: 'Egresos', value: <Skeleton className="h-4 w-20" />, icon: TrendingDown },
          { label: 'Balance Neto', value: <Skeleton className="h-4 w-20" />, icon: Scale },
        ]}
      />

      {/* DataTable Skeleton */}
      <div className="border rounded-md">
        <div className="p-4 border-b bg-muted/50">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" /> {/* Hora */}
            <Skeleton className="h-4 w-24" /> {/* Tipo */}
            <Skeleton className="h-4 flex-1" /> {/* Cliente */}
            <Skeleton className="h-4 flex-1" /> {/* Referencia */}
            <Skeleton className="h-4 w-28" /> {/* Método */}
            <Skeleton className="h-4 w-24" /> {/* Monto */}
            <Skeleton className="h-4 w-8 ml-auto" /> {/* Acciones */}
          </div>
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="p-4 border-b last:border-0">
            <div className="flex gap-4 items-center">
              <Skeleton className="h-4 w-16" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <div className="ml-auto">
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
