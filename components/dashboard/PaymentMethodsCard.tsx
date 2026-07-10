import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { formatARS } from "@/lib/utils/format";

interface PaymentMethodsCardProps {
  paymentsByMethod?: Array<{
    code: string;
    name: string;
    total: number;
  }>;
}

export function PaymentMethodsCard({
  paymentsByMethod,
}: PaymentMethodsCardProps) {
  const methods = paymentsByMethod || [];

  if (methods.length === 0) {
    return (
      <Card className="relative overflow-hidden border-l-2 border-l-indigo-500/40">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Medios de Pago
            </span>
            <CreditCard
              className="h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none"
              aria-hidden="true"
            />
          </div>
          <p className="text-xs text-muted-foreground/60 py-3 text-center">
            Sin movimientos hoy
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = methods.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card className="relative overflow-hidden border-l-2 border-l-indigo-500/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Medios de Pago
          </span>
          <CreditCard
            className="h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-2">
          {methods.map((method) => {
            const percentage = total !== 0 ? (method.total / total) * 100 : 0;
            const isNegative = method.total < 0;
            return (
              <div key={method.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold tracking-tight">
                    {method.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-muted-foreground/50 bg-muted/60 px-1 rounded tabular-nums">
                      {percentage.toFixed(1)}%
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums ${isNegative ? "text-red-600" : "text-foreground"}`}
                    >
                      {formatARS(Math.abs(method.total))}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-muted/40 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${isNegative ? "bg-red-500/60" : "bg-indigo-500/60"}`}
                    style={{ width: `${Math.abs(percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-muted-foreground">Neto</span>
            <span
              className={`font-mono tabular-nums ${total < 0 ? "text-red-600" : "text-emerald-600"}`}
            >
              {formatARS(total)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
