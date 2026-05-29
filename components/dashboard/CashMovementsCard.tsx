import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, ExternalLink } from 'lucide-react';
import { formatARS } from '@/lib/utils/format';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface CashMovement {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'OPENING' | 'CLOSING' | 'PURCHASE_VOUCHER';
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
      case 'PURCHASE_VOUCHER':
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
      case 'PURCHASE_VOUCHER':
        return 'Compra';
      case 'OPENING':
        return 'Apertura';
      case 'CLOSING':
        return 'Cierre';
      default:
        return type;
    }
  };

  const getMethodNameLabel = (methodName: string) => {
    switch (methodName) {
      case 'PURCHASE':
        return 'Compra';
      case 'CASH':
        return 'Efectivo';
      default:
        return methodName;
    }
  };

  const getAmountClass = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'text-green-600';
      case 'EXPENSE':
      case 'PURCHASE_VOUCHER':
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
        <CardFooter className="pt-2 border-t">
          <Button asChild variant="ghost" size="sm" className="w-full text-xs gap-2">
            <Link href="/adm/operations">
              Ver operaciones detalladas
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Movimientos de Caja
        </CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="space-y-3 mt-2 max-h-[300px] overflow-y-auto pr-2">
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {getMovementIcon(movement.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {getMovementTypeLabel(movement.type)}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      ({getMethodNameLabel(movement.methodName)})
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
              <div className={`text-sm font-semibold whitespace-nowrap ml-2 ${getAmountClass(movement.type)}`}>
                {movement.type === 'EXPENSE' || movement.type === 'PURCHASE_VOUCHER' ? '-' : '+'}
                {formatARS(movement.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t mt-auto">
        <Button asChild variant="ghost" size="sm" className="w-full text-xs gap-2">
          <Link href="/adm/operations">
            Ver todas las operaciones
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
