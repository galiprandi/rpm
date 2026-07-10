import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import { formatARS } from "@/lib/utils/format";

interface TopProductsCardProps {
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export function TopProductsCard({ topProducts }: TopProductsCardProps) {
  if (topProducts.length === 0) {
    return (
      <Card className="relative overflow-hidden border-l-2 border-l-blue-500/40">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Top Productos
            </span>
            <Package
              className="h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none"
              aria-hidden="true"
            />
          </div>
          <p className="text-xs text-muted-foreground/60 py-3 text-center">
            Sin ventas de productos hoy
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = Math.max(...topProducts.map((p) => p.revenue));

  return (
    <Card className="relative overflow-hidden border-l-2 border-l-blue-500/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Top Productos
          </span>
          <Package
            className="h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-2">
          {topProducts.map((product, index) => {
            const barWidth =
              maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold tracking-tight truncate pr-2">
                    {product.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-mono font-bold text-muted-foreground/50 bg-muted/60 px-1 rounded tabular-nums">
                      x{product.quantity}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 tabular-nums">
                      {formatARS(product.revenue)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted/40 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500/60 transition-all duration-500 ease-out"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
