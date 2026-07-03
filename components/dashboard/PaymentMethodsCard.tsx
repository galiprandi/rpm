import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { formatARS } from '@/lib/utils/format';

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Arqueo de Caja por Método
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Sin movimientos hoy
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = methods.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Arqueo de Caja por Método
        </CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mt-2">
          {methods.map((method) => {
            const percentage = total !== 0 ? (method.total / total) * 100 : 0;
            const isNegative = method.total < 0;
            return (
              <div key={method.code} className="space-y-1 group">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold tracking-tight">{method.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground/60 bg-muted px-1 rounded">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className={`font-mono font-bold ${isNegative ? 'text-red-700' : 'text-foreground'}`}>
                      {formatARS(Math.abs(method.total))}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${isNegative ? 'bg-red-700' : 'bg-blue-600'}`}
                    style={{ width: `${Math.abs(percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-muted-foreground">Neto Diario</span>
            <span className={`font-mono ${total < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {formatARS(total)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
