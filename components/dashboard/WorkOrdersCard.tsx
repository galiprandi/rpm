import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, ArrowUp } from 'lucide-react';

interface WorkOrdersCardProps {
  total: number;
  byStatus: {
    pending: number;
    inProgress: number;
    ready: number;
  };
  newToday: number;
}

export function WorkOrdersCard({
  total,
  byStatus,
  newToday,
}: WorkOrdersCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          OTs Activas
        </CardTitle>
        <Wrench
          className="h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{total}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">
            {byStatus.pending} pendientes · {byStatus.inProgress} en proceso · {byStatus.ready} listas
          </p>
          {newToday > 0 && (
            <div className="flex items-center gap-1 text-xs text-emerald-700">
              <ArrowUp
                className="h-3 w-3 pointer-events-none"
                aria-hidden="true"
              />
              <span>{newToday} nueva{newToday !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
