'use client';

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
          <CreditCard className="h-4 w-4 text-muted-foreground" />
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
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mt-2">
          {methods.map((method) => {
            const percentage = total > 0 ? (method.total / total) * 100 : 0;
            const isNegative = method.total < 0;
            return (
              <div key={method.code} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{method.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className={`font-semibold ${isNegative ? 'text-red-600' : ''}`}>
                      {formatARS(Math.abs(method.total))}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${isNegative ? 'bg-red-600' : 'bg-blue-600'}`}
                    style={{ width: `${Math.abs(percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Neto</span>
            <span className={total < 0 ? 'text-red-600' : ''}>{formatARS(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
