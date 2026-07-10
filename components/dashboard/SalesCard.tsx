import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
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
    <Card className="relative overflow-hidden border-l-2 border-l-emerald-500/60">
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Ventas Hoy
          </span>
          <div
            className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${vsYesterday >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}
          >
            <TrendIcon
              className="h-2.5 w-2.5 pointer-events-none"
              aria-hidden="true"
            />
            <span>{trend.text}</span>
          </div>
        </div>
        <div className="text-xl font-bold tracking-tight tabular-nums">
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
