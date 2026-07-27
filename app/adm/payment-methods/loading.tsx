'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentMethodsLoading() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-busy="true"
      aria-label="Cargando métodos de pago"
    >
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="flex flex-wrap items-center gap-x-1">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-5 w-28" />
        ))}
      </div>

      {/* CrudAdmin Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="border rounded-md">
          <div className="p-4 border-b bg-muted/50">
            <div className="flex gap-4">
              <Skeleton className="h-4 flex-[2]" /> {/* Nombre */}
              <Skeleton className="h-4 flex-1" /> {/* Código */}
              <Skeleton className="h-4 flex-[2]" /> {/* Descripción */}
              <Skeleton className="h-4 w-20" /> {/* Estado */}
              <Skeleton className="h-4 w-20 ml-auto" /> {/* Acciones */}
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-0">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-3 flex-[2]">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-[2]" />
                <Skeleton className="h-6 w-20" />
                <div className="flex gap-2 ml-auto">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
