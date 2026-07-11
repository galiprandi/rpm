import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  ExternalLink,
} from "lucide-react";
import { formatARS, toTitleCase } from "@/lib/utils/format";
import Link from "next/link";

interface CashMovement {
  id: string;
  type: "INCOME" | "EXPENSE" | "OPENING" | "CLOSING" | "PURCHASE_VOUCHER";
  amount: number;
  method: string;
  methodName: string;
  referenceId?: string;
  referenceType?: string;
  reason?: string;
  createdAt: string;
  createdBy: string;
}

interface CashMovementsCardProps {
  cashMovements?: CashMovement[];
}

export function CashMovementsCard({ cashMovements }: CashMovementsCardProps) {
  const movements = cashMovements || [];

  const getMovementIcon = (type: string) => {
    let Icon = DollarSign;
    let iconClass = "text-muted-foreground";
    let containerClass = "bg-slate-100 border-slate-200";

    switch (type) {
      case "INCOME":
        Icon = ArrowUpCircle;
        iconClass = "text-emerald-700";
        containerClass = "bg-emerald-500/10 border-emerald-500/20";
        break;
      case "EXPENSE":
      case "PURCHASE_VOUCHER":
        Icon = ArrowDownCircle;
        iconClass = "text-red-700";
        containerClass = "bg-red-500/10 border-red-500/20";
        break;
      case "OPENING":
      case "CLOSING":
        Icon = DollarSign;
        iconClass = "text-blue-600";
        containerClass = "bg-blue-500/10 border-blue-500/20";
        break;
    }

    return (
      <div
        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${containerClass}`}
      >
        <Icon
          className={`h-3.5 w-3.5 ${iconClass} pointer-events-none`}
          aria-hidden="true"
        />
      </div>
    );
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case "INCOME":
        return "Ingreso";
      case "EXPENSE":
        return "Egreso";
      case "PURCHASE_VOUCHER":
        return "Compra";
      case "OPENING":
        return "Apertura";
      case "CLOSING":
        return "Cierre";
      default:
        return type;
    }
  };

  const getMethodNameLabel = (methodName: string) => {
    switch (methodName) {
      case "PURCHASE":
        return "Compra";
      case "CASH":
        return "Efectivo";
      default:
        return toTitleCase(methodName);
    }
  };

  const getAmountClass = (type: string) => {
    switch (type) {
      case "INCOME":
        return "text-emerald-700";
      case "EXPENSE":
      case "PURCHASE_VOUCHER":
        return "text-red-700";
      default:
        return "text-foreground";
    }
  };

  if (movements.length === 0) {
    return (
      <Card className="relative overflow-hidden border-l-2 border-l-cyan-500/40">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Movimientos
            </span>
            <DollarSign
              className="h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none"
              aria-hidden="true"
            />
          </div>
          <p className="text-xs text-muted-foreground/60 py-3 text-center">
            Sin movimientos hoy
          </p>
          <Link
            href="/adm/operations"
            className="text-[10px] text-primary hover:underline font-medium flex items-center gap-1"
          >
            Ver operaciones
            <ExternalLink
              className="h-2.5 w-2.5 pointer-events-none"
              aria-hidden="true"
            />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-l-2 border-l-cyan-500/40 flex flex-col h-full">
      <CardContent className="p-4 flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Movimientos
          </span>
          <DollarSign
            className="h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/30 hover:bg-muted/30 transition-colors px-1 rounded"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getMovementIcon(movement.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold tracking-tight text-xs">
                      {getMovementTypeLabel(movement.type)}
                    </span>
                    <span className="text-[9px] font-bold tracking-wider text-muted-foreground/50">
                      {getMethodNameLabel(movement.methodName)}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground/60 tabular-nums">
                    {new Date(movement.createdAt).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {movement.reason && ` · ${movement.reason}`}
                  </div>
                </div>
              </div>
              <div
                className={`text-xs font-mono font-bold whitespace-nowrap ml-2 tabular-nums ${getAmountClass(movement.type)}`}
              >
                {movement.type === "EXPENSE" ||
                movement.type === "PURCHASE_VOUCHER"
                  ? "-"
                  : "+"}
                {formatARS(movement.amount)}
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/adm/operations"
          className="text-[10px] text-primary hover:underline font-medium flex items-center gap-1 mt-3 pt-2 border-t border-border/40"
        >
          Ver todas las operaciones
          <ExternalLink
            className="h-2.5 w-2.5 pointer-events-none"
            aria-hidden="true"
          />
        </Link>
      </CardContent>
    </Card>
  );
}
