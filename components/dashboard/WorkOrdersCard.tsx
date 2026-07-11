import { Card, CardContent } from "@/components/ui/card";
import { Wrench, ArrowUp, Clock, CheckCircle2, Car, Timer } from "lucide-react";
import { relativeTime } from "@/lib/utils/format";

interface WorkOrdersCardProps {
  total: number;
  byStatus: {
    pending: number;
    inProgress: number;
    ready: number;
  };
  newToday: number;
  oldestPending: Array<{
    workOrderId: string;
    vehicleIdentifier: string;
    customerName: string;
    createdAt: string;
  }>;
}

export function WorkOrdersCard({
  total,
  byStatus,
  newToday,
  oldestPending,
}: WorkOrdersCardProps) {
  const statuses = [
    {
      label: "Pendientes",
      value: byStatus.pending,
      icon: Clock,
      colorClass: "text-amber-700",
      bgClass: "bg-amber-500/5",
      borderClass: "border-amber-500/20",
      dotClass: "bg-amber-500",
    },
    {
      label: "En proceso",
      value: byStatus.inProgress,
      icon: Wrench,
      colorClass: "text-blue-700",
      bgClass: "bg-blue-500/5",
      borderClass: "border-blue-500/20",
      dotClass: "bg-blue-500",
    },
    {
      label: "Listas",
      value: byStatus.ready,
      icon: CheckCircle2,
      colorClass: "text-emerald-700",
      bgClass: "bg-emerald-500/5",
      borderClass: "border-emerald-500/20",
      dotClass: "bg-emerald-500",
    },
  ];

  return (
    <Card className="relative overflow-hidden border-l-2 border-l-primary/40">
      <CardContent className="p-4">
        {/* Header: title + total + newToday badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Taller
            </span>
            <span className="text-lg font-bold tracking-tight tabular-nums">
              {total}
            </span>
            <span className="text-[11px] text-muted-foreground">activas</span>
          </div>
          {newToday > 0 && (
            <div className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700">
              <ArrowUp
                className="h-2.5 w-2.5 pointer-events-none"
                aria-hidden="true"
              />
              <span>
                {newToday} nueva{newToday !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Kanban: horizontal compact bars */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {statuses.map((status) => (
            <div
              key={status.label}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border ${status.bgClass} ${status.borderClass}`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${status.dotClass}`}
              />
              <div className="min-w-0">
                <div
                  className={`text-base font-bold tabular-nums leading-none ${status.colorClass}`}
                >
                  {status.value}
                </div>
                <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5 truncate">
                  {status.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Oldest pending OTs: tight rows */}
        {oldestPending.length > 0 && (
          <div className="border-t border-border/40 pt-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Timer
                className="h-3 w-3 text-amber-700 pointer-events-none"
                aria-hidden="true"
              />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Más viejas
              </p>
            </div>
            <div className="space-y-1">
              {oldestPending.map((wo) => (
                <div
                  key={wo.workOrderId}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Car
                      className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 group-hover:text-primary transition-colors pointer-events-none"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-semibold tracking-tight font-mono tabular-nums truncate">
                      {wo.vehicleIdentifier}
                    </span>
                    <span className="text-[11px] text-muted-foreground/70 truncate hidden sm:inline">
                      {wo.customerName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-amber-700 shrink-0">
                    {relativeTime(wo.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
