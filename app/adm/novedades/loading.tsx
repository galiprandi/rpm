import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the Novedades page.
 * Imitates the real structure: Header (title + description) and a Card
 * with prose-like content lines to mitigate layout shift on load.
 */
export default function NovedadesLoading() {
  return (
    <div
      className="max-w-3xl mx-auto space-y-6"
      role="status"
      aria-label="Cargando novedades"
      aria-busy="true"
    >
      {/* Header skeleton — imitates Header (h1 title + description) */}
      <header className="space-y-1">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64" />
      </header>

      {/* Content card skeleton — imitates prose content lines */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[85%]" />
            <div className="pt-4 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[92%]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
