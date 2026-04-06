'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatARS } from '@/lib/utils/format';

interface CashMovement {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'OPENING' | 'CLOSING';
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
    switch (type) {
      case 'INCOME':
        return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
      case 'EXPENSE':
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
      case 'OPENING':
      case 'CLOSING':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'Ingreso';
      case 'EXPENSE':
        return 'Egreso';
      case 'OPENING':
        return 'Apertura';
      case 'CLOSING':
        return 'Cierre';
      default:
        return type;
    }
  };

  const getAmountClass = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'text-green-600';
      case 'EXPENSE':
        return 'text-red-600';
      default:
        return 'text-foreground';
    }
  };

  if (movements.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Movimientos de Caja
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Movimientos de Caja
        </CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mt-2 max-h-[300px] overflow-y-auto">
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div className="flex items-start gap-2 flex-1">
                {getMovementIcon(movement.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {getMovementTypeLabel(movement.type)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({movement.methodName})
                    </span>
                  </div>
                  {movement.reason && (
                    <div className="text-xs text-muted-foreground truncate">
                      {movement.reason}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {new Date(movement.createdAt).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
              <div className={`text-sm font-semibold ${getAmountClass(movement.type)}`}>
                {movement.type === 'EXPENSE' ? '-' : '+'}
                {formatARS(movement.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
