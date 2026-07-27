import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatARS, formatPercentageChange } from "@/lib/utils/format";

interface SalesCardProps {
  total: number;
  workOrderCount: number;
  vsYesterday: number;
  ticketAverage: number;
}

export function SalesCard({
  total,
  workOrderCount,
  vsYesterday,
  ticketAverage,
}: SalesCardProps) {
  const trend = formatPercentageChange(vsYesterday);
  const TrendIcon = vsYesterday >= 0 ? TrendingUp : TrendingDown;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <DollarSign
                className="h-3.5 w-3.5 text-emerald-700 pointer-events-none"
                aria-hidden="true"
              />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 truncate">
              Ventas Hoy
            </span>
          </div>
          <div
            className={`flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0 ${vsYesterday >= 0 ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}
          >
            <TrendIcon
              className="h-2.5 w-2.5 pointer-events-none"
              aria-hidden="true"
            />
            <span>{trend.text}</span>
          </div>
        </div>
        <div className="text-xl font-bold tracking-tight tabular-nums text-emerald-700">
          {formatARS(total)}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
          <span className="font-medium">
            {workOrderCount} op{workOrderCount !== 1 ? "s" : ""}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="tabular-nums" title="Ticket promedio por operación">
            ticket {formatARS(ticketAverage)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
