import { Skeleton } from '@/components/ui/skeleton';

export default function DebtorsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-44" /> {/* Sort select placeholder */}
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>

      {/* DataTable Skeleton */}
      <div className="border rounded-md">
        <div className="p-4 border-b bg-muted/50">
          <div className="flex gap-4">
            <Skeleton className="h-4 flex-1" /> {/* Cliente */}
            <Skeleton className="h-4 w-40" /> {/* Vehículos */}
            <Skeleton className="h-4 w-16" /> {/* # OTs */}
            <Skeleton className="h-4 w-28" /> {/* Deuda Total */}
            <Skeleton className="h-4 w-32" /> {/* Deuda Más Antigua */}
            <Skeleton className="h-4 w-8 ml-auto" /> {/* Acciones */}
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b last:border-0">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-28" />
              <div className="space-y-2 w-32">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
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
