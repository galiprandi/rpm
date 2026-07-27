import { LayoutDashboard, History } from "lucide-react";

/**
 * Loading skeleton for the cash (arqueo de caja) page.
 * Imitates the real page structure: header with status badge, stat cards,
 * status/history tabs, and the per-method breakdown table.
 */
export default function CashLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header: title + description + status badge + primary action */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-9 w-44 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-7 w-32 bg-muted animate-pulse rounded-full" />
          <div className="h-10 w-36 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Stat cards (CrudStats — 4 cards) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-muted/40 animate-pulse rounded-lg border"
          />
        ))}
      </div>

      {/* Tabs list (2 tabs) */}
      <div className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-lg">
        <div className="flex items-center gap-2 h-9 px-3">
          <LayoutDashboard
            className="h-4 w-4 text-muted-foreground/40"
            aria-hidden="true"
          />
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex items-center gap-2 h-9 px-3">
          <History
            className="h-4 w-4 text-muted-foreground/40"
            aria-hidden="true"
          />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-4">
        <div className="h-11 w-44 bg-muted/40 animate-pulse rounded-md border" />
        <div className="h-11 w-44 bg-muted/40 animate-pulse rounded-md border" />
      </div>

      {/* Breakdown table card */}
      <div className="border shadow-xs overflow-hidden rounded-lg">
        {/* Card header */}
        <div className="bg-muted/30 border-b px-6 py-4 flex items-center gap-2">
          <div className="h-5 w-5 bg-muted animate-pulse rounded" />
          <div className="h-5 w-64 bg-muted animate-pulse rounded" />
        </div>

        {/* Table header */}
        <div className="bg-muted/50 border-b">
          <div className="grid grid-cols-5 px-6 py-3 gap-4">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded justify-self-end" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded justify-self-end" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded justify-self-end" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded justify-self-end" />
          </div>
        </div>

        {/* Table rows — imitate per-method breakdown */}
        <div className="divide-y">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="grid grid-cols-5 px-6 py-4 gap-4 items-center"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-4 w-20 bg-muted animate-pulse rounded justify-self-end" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded justify-self-end" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded justify-self-end" />
              <div className="h-5 w-24 bg-muted animate-pulse rounded justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
