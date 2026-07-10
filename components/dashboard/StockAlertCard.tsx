import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface StockAlertCardProps {
  lowStockCount: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    stock: number;
    minStock: number;
  }>;
}

export function StockAlertCard({
  lowStockCount,
  lowStockItems,
}: StockAlertCardProps) {
  const hasAlerts = lowStockCount > 0;

  return (
    <Card
      className={`relative overflow-hidden border-l-2 ${hasAlerts ? "border-l-orange-500/60" : "border-l-emerald-500/60"}`}
    >
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Stock Bajo
          </span>
          {hasAlerts && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600">
              {lowStockCount} prod.
            </span>
          )}
        </div>
        <div
          className={`text-xl font-bold tracking-tight tabular-nums ${hasAlerts ? "text-orange-600" : "text-emerald-600"}`}
        >
          {hasAlerts ? lowStockCount : "OK"}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
          {hasAlerts
            ? lowStockItems
                .slice(0, 2)
                .map((item) => item.name)
                .join(", ")
            : "Niveles normales"}
        </p>
        {hasAlerts && (
          <Link
            href="/adm/products?lowStock=true"
            className="text-[10px] text-primary hover:underline mt-1.5 inline-block font-medium"
          >
            Ver lista →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
