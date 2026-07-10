import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { formatARS } from "@/lib/utils/format";

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
          {hasDebt && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-600">
              {count} cliente{count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div
          className={`text-xl font-bold tracking-tight tabular-nums ${hasDebt ? "text-red-600" : "text-emerald-600"}`}
        >
          {hasDebt ? formatARS(totalDebt) : "Sin deuda"}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 truncate">
          {hasDebt
            ? topDebtors[0]?.name
              ? `${topDebtors[0].name} · ${formatARS(topDebtors[0].balance)}`
              : `${count} con saldo`
            : "Todos al día"}
        </p>
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
