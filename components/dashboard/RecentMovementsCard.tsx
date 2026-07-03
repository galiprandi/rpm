import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { relativeTime } from '@/lib/utils/format';

interface RecentMovementsCardProps {
  recentMovements: Array<{
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    productName: string;
    quantity: number;
    reason: string;
    timestamp: string;
    userName: string;
  }>;
}

export function RecentMovementsCard({
  recentMovements,
}: RecentMovementsCardProps) {
  const getMovementIcon = (type: string) => {
    let Icon = ArrowUpDown;
    let iconClass = 'text-gray-600';
    let containerClass = 'bg-gray-100 border-gray-200';

    switch (type) {
      case 'IN':
        Icon = ArrowUp;
        iconClass = 'text-emerald-700';
        containerClass = 'bg-emerald-50 border-emerald-100';
        break;
      case 'OUT':
        Icon = ArrowDown;
        iconClass = 'text-red-700';
        containerClass = 'bg-red-50 border-red-100';
        break;
      case 'ADJUSTMENT':
        Icon = Minus;
        iconClass = 'text-amber-700';
        containerClass = 'bg-amber-50 border-amber-100';
        break;
    }

    return (
      <div
        className={`w-8 h-8 rounded-lg shadow-sm border flex items-center justify-center shrink-0 ${containerClass}`}
      >
        <Icon className={`h-4 w-4 ${iconClass} pointer-events-none`} aria-hidden="true" />
      </div>
    );
  };

  if (recentMovements.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Movimientos de Productos
          </CardTitle>
          <ArrowUpDown
            className="h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No hay movimientos de productos
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
          Movimientos de Productos
        </CardTitle>
        <ArrowUpDown
          className="h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentMovements.map((movement, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/50 border border-transparent hover:border-slate-200 transition-colors"
            >
              <div className="flex-shrink-0">{getMovementIcon(movement.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold tracking-tight truncate">
                    {movement.productName}
                  </span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      movement.type === 'IN'
                        ? 'text-emerald-700'
                        : movement.type === 'OUT'
                        ? 'text-red-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : ''}
                    {movement.quantity}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                  <span className="truncate">{movement.reason}</span>
                  <span className="shrink-0 ml-2">{relativeTime(movement.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
