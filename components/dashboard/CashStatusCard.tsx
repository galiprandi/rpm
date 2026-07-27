import { Card, CardContent } from "@/components/ui/card";
import { formatARS } from "@/lib/utils/format";
import Link from "next/link";
import { Wallet } from "lucide-react";

interface CashStatusCardProps {
  isOpen: boolean;
  openedAt: string | null;
  balance: number;
}

export function CashStatusCard({
  isOpen,
  openedAt,
  balance,
}: CashStatusCardProps) {
  const openedTime = openedAt
    ? new Date(openedAt).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${isOpen ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-slate-500/10 border border-slate-500/20"}`}
            >
              <Wallet
                className={`h-3.5 w-3.5 ${isOpen ? "text-emerald-700" : "text-slate-500"}`}
                aria-hidden="true"
              />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Caja
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
            />
            <span
              className={`text-[11px] font-bold ${isOpen ? "text-emerald-700" : "text-slate-500"}`}
            >
              {isOpen ? "Abierta" : "Cerrada"}
            </span>
          </div>
        </div>
        <div
          className={`text-xl font-bold tracking-tight tabular-nums ${isOpen ? "text-emerald-700" : "text-slate-500"}`}
        >
          {formatARS(balance)}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {isOpen && openedTime ? (
            <>
              Desde <span className="font-mono tabular-nums">{openedTime}</span>
            </>
          ) : (
            <>Sin abrir hoy</>
          )}
        </p>
        <Link
          href="/adm/cash"
          className="text-[11px] text-primary hover:underline mt-1.5 inline-block font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-offset-1 rounded"
          aria-label="Ir a la gestión de caja"
        >
          Ver movimientos →
        </Link>
      </CardContent>
    </Card>
  );
}
