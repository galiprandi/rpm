import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryCountsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      {/* CrudAdmin Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="border rounded-md overflow-hidden">
          <div className="p-4 border-b bg-muted/50">
            <div className="flex gap-4">
              <Skeleton className="h-4 flex-1" /> {/* Fecha */}
              <Skeleton className="h-4 w-32" /> {/* Artículos */}
              <Skeleton className="h-4 w-[120px]" /> {/* Avance */}
              <Skeleton className="h-4 w-28" /> {/* Estado */}
              <Skeleton className="h-4 w-10 ml-auto" /> {/* Acciones */}
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-0">
              <div className="flex gap-4 items-center">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-32" />
                <div className="w-[120px] space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
                <Skeleton className="h-6 w-28 rounded-full" />
                <div className="ml-auto">
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
