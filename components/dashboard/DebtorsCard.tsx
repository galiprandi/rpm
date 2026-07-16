import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { formatARS } from "@/lib/utils/format";
import { Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DebtorsCardProps {
  totalDebt: number;
  count: number;
  topDebtors: Array<{
    name: string;
    balance: number;
  }>;
}

export function DebtorsCard({
  totalDebt,
  count,
  topDebtors,
}: DebtorsCardProps) {
  const hasDebt = count > 0;

  return (
    <Card
      className={`relative overflow-hidden border-l-2 ${hasDebt ? "border-l-red-500/60" : "border-l-emerald-500/60"}`}
    >
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Deudores
          </span>
          <div className="flex items-center gap-2">
            {hasDebt && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-700">
                {count} cliente{count !== 1 ? "s" : ""}
              </span>
            )}
            <Users
              className="h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>
        <div
          className={`text-xl font-bold tracking-tight tabular-nums ${hasDebt ? "text-red-700" : "text-emerald-700"}`}
        >
          {hasDebt ? formatARS(totalDebt) : "Sin deuda"}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <p
              className="text-[11px] text-muted-foreground mt-1.5 truncate cursor-default outline-none focus-visible:underline decoration-dotted"
              tabIndex={hasDebt && topDebtors.length > 0 ? 0 : undefined}
            >
              {hasDebt
                ? topDebtors[0]?.name
                  ? `${topDebtors[0].name} · ${formatARS(topDebtors[0].balance)}`
                  : `${count} con saldo`
                : "Todos al día"}
            </p>
          </TooltipTrigger>
          {hasDebt && topDebtors.length > 0 && (
            <TooltipContent side="bottom" className="max-w-[220px]">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 pb-1 mb-1">
                  Mayores deudores
                </p>
                {topDebtors.map((debtor, i) => (
                  <div key={i} className="flex justify-between gap-3 text-xs">
                    <span className="truncate font-medium">{debtor.name}</span>
                    <span className="font-mono font-semibold text-red-700 shrink-0">
                      {formatARS(debtor.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
        {hasDebt && (
          <Link
            href="/adm/reports/debtors"
            className="text-[10px] text-primary hover:underline mt-1.5 inline-block font-medium"
          >
            Ver reporte →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
