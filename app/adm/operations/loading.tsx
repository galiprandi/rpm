import { Skeleton } from '@/components/ui/skeleton';

export default function OperationsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-44" /> {/* Date picker placeholder */}
          <Skeleton className="h-9 w-28" /> {/* Refresh button */}
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>

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
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b last:border-0">
            <div className="flex gap-4 items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-24" />
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
