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
    switch (type) {
      case 'IN':
        return (
          <ArrowUp
            className="h-3 w-3 text-emerald-700 pointer-events-none"
            aria-hidden="true"
          />
        );
      case 'OUT':
        return (
          <ArrowDown
            className="h-3 w-3 text-red-700 pointer-events-none"
            aria-hidden="true"
          />
        );
      case 'ADJUSTMENT':
        return (
          <Minus
            className="h-3 w-3 text-amber-700 pointer-events-none"
            aria-hidden="true"
          />
        );
      default:
        return (
          <ArrowUpDown
            className="h-3 w-3 text-gray-600 pointer-events-none"
            aria-hidden="true"
          />
        );
    }
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
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
              <div className="flex-shrink-0">{getMovementIcon(movement.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {movement.productName}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
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
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{movement.reason}</span>
                  <span>{relativeTime(movement.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
