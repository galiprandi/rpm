import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Setting item skeleton — imitates SettingItem horizontal layout:
 * left: icon placeholder + title/description lines, right: control placeholder.
 */
function SettingItemSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-5 border-b border-border/50 last:border-0">
      <div className="flex gap-3 flex-1 min-w-0">
        {/* Icon placeholder */}
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        {/* Title + description lines */}
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      {/* Control placeholder */}
      <Skeleton className="w-10 h-6 shrink-0 sm:ml-4" />
    </div>
  );
}

/**
 * Settings card skeleton — imitates the real Card structure with
 * overflow-hidden, CardHeader with bg-muted/50, and N setting items.
 */
function SettingsCardSkeleton({ items = 3 }: { items?: number }) {
  return (
    <Card className="overflow-hidden border-muted/60 shadow-sm">
      <CardHeader className="pb-4 -mt-4 pt-4 bg-muted/50 border-b">
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6">
          {Array.from({ length: items }).map((_, i) => (
            <SettingItemSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      {/* Page header skeleton — imitates Header (h1 title + description) */}
      <header className="space-y-1">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96" />
      </header>

      <div className="space-y-6">
        {/* Apariencia — 1 setting item */}
        <SettingsCardSkeleton items={1} />
        {/* Listas de Precios — 1 setting item */}
        <SettingsCardSkeleton items={1} />
        {/* Configuración Fiscal (AFIP) — 5 setting items */}
        <SettingsCardSkeleton items={5} />
        {/* Finanzas — 1 navigation link item */}
        <SettingsCardSkeleton items={1} />
      </div>
    </div>
  );
}
