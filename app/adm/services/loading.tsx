import { Skeleton } from '@/components/ui/skeleton';

export default function ServicesLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      {/* CrudAdmin Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="p-4 border-b bg-muted/50">
            <div className="flex gap-4">
              <Skeleton className="h-4 flex-[1.5]" /> {/* Servicio */}
              <Skeleton className="h-4 flex-1" />   {/* Costo Base */}
              <Skeleton className="h-4 flex-1" />   {/* Tiempo */}
              <Skeleton className="h-4 flex-1" />   {/* Factor Vehículo */}
              <Skeleton className="h-4 w-24" />      {/* Estado */}
              <Skeleton className="h-4 w-20" />      {/* Acciones */}
            </div>
          </div>
          {/* Table Body */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-0">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-3 flex-[1.5]">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <div className="flex gap-2 w-20">
                   <Skeleton className="h-8 w-8 rounded-md" />
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
