"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { PackageX, PackageCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const Icon = hasAlerts ? PackageX : PackageCheck;

  return (
    <Card className="relative overflow-hidden min-w-0">
      <CardContent className="p-3.5 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${hasAlerts ? "bg-orange-500/10 border-orange-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}
            >
              <Icon
                className={`h-3.5 w-3.5 pointer-events-none ${hasAlerts ? "text-orange-700" : "text-emerald-700"}`}
                aria-hidden="true"
              />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 truncate">
              Stock Bajo
            </span>
          </div>
          {hasAlerts && (
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-700 shrink-0">
              {lowStockCount} prod.
            </span>
          )}
        </div>
        <div
          className={`text-xl font-bold tracking-tight tabular-nums ${hasAlerts ? "text-orange-700" : "text-emerald-700"}`}
        >
          {hasAlerts ? lowStockCount : "OK"}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <p
              className="text-[11px] text-muted-foreground mt-1.5 truncate cursor-default outline-none focus-visible:underline decoration-dotted rounded-sm"
              tabIndex={hasAlerts && lowStockItems.length > 0 ? 0 : undefined}
              aria-label={hasAlerts ? `Stock bajo: ${lowStockCount} productos` : "Niveles normales de stock"}
            >
              {hasAlerts
                ? `${lowStockItems
                    .slice(0, 2)
                    .map((item) => item.name)
                    .join(", ")}${lowStockCount > 2 ? "..." : ""}`
                : "Niveles normales"}
            </p>
          </TooltipTrigger>
          {hasAlerts && lowStockCount > 0 && (
            <TooltipContent side="bottom" className="max-w-[200px]">
              <div className="space-y-0.5">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-2 text-xs"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="font-mono text-orange-700 shrink-0">
                      {item.stock}/{item.minStock}
                    </span>
                  </div>
                ))}
                {lowStockCount > 5 && (
                  <div className="text-xs text-muted-foreground pt-0.5">
                    +{lowStockCount - 5} más...
                  </div>
                )}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
        {hasAlerts && (
          <Link
            href="/adm/products?lowStock=true"
            className="text-[11px] text-primary hover:underline mt-1.5 inline-block font-medium"
          >
            Ver lista →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
