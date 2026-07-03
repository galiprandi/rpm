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
    let Icon = DollarSign;
    let iconClass = 'text-muted-foreground';
    let containerClass = 'bg-slate-100 border-slate-200';

    switch (type) {
      case 'INCOME':
        Icon = ArrowUpCircle;
        iconClass = 'text-emerald-700';
        containerClass = 'bg-emerald-50 border-emerald-100';
        break;
      case 'EXPENSE':
      case 'PURCHASE_VOUCHER':
        Icon = ArrowDownCircle;
        iconClass = 'text-red-700';
        containerClass = 'bg-red-50 border-red-100';
        break;
      case 'OPENING':
      case 'CLOSING':
        Icon = DollarSign;
        iconClass = 'text-blue-700';
        containerClass = 'bg-blue-50 border-blue-100';
        break;
    }

    return (
      <div className={`w-8 h-8 rounded-lg shadow-sm border flex items-center justify-center shrink-0 ${containerClass}`}>
        <Icon className={`h-4 w-4 ${iconClass} pointer-events-none`} aria-hidden="true" />
      </div>
    );
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
        return 'text-emerald-700';
      case 'EXPENSE':
      case 'PURCHASE_VOUCHER':
        return 'text-red-700';
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
          <DollarSign className="h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
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
        <DollarSign className="h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="space-y-3 mt-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="flex items-center justify-between py-2.5 border-b last:border-0 hover:bg-slate-50/50 transition-colors px-1 rounded-md"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {getMovementIcon(movement.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tracking-tight text-sm">
                      {getMovementTypeLabel(movement.type)}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 truncate">
                      {getMethodNameLabel(movement.methodName)}
                    </span>
                  </div>
                  {movement.reason && (
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {movement.reason}
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">
                    {new Date(movement.createdAt).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
              <div className={`text-sm font-mono font-bold whitespace-nowrap ml-2 ${getAmountClass(movement.type)}`}>
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
