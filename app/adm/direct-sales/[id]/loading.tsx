import { Skeleton } from '@/components/ui/skeleton';

export default function DirectSaleDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-md" />
            <Skeleton className="h-7 w-28 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" /> {/* Back button placeholder */}
        </div>
      </div>

      {/* Info Card Skeleton */}
      <div className="border rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-2 border-b pb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Items Card Skeleton */}
      <div className="border rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-4 border rounded-xl">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Payments Card Skeleton */}
      <div className="border rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex justify-between items-center p-4 border rounded-xl">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
