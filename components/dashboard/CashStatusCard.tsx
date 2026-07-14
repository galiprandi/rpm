import { Card, CardContent } from "@/components/ui/card";
import { formatARS } from "@/lib/utils/format";

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
    <Card
      className={`relative overflow-hidden border-l-2 ${isOpen ? "border-l-emerald-500/60" : "border-l-slate-300/60"}`}
    >
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Caja
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
            />
            <span
              className={`text-[10px] font-bold ${isOpen ? "text-emerald-700" : "text-slate-500"}`}
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
      </CardContent>
    </Card>
  );
}
