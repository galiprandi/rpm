import { Skeleton } from '@/components/ui/skeleton';

export default function SuppliersLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-40" />
        </div>
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
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="border rounded-md">
          {/* Table Header */}
          <div className="p-4 border-b bg-muted/50">
            <div className="flex gap-4">
              <Skeleton className="h-4 flex-[1.5]" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-[1.2]" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          {/* Table Body */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b last:border-0">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-3 flex-[1.5]">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 flex-[1.2]" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
