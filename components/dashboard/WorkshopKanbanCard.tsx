import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';

interface WorkshopKanbanCardProps {
  byStatus: {
    pending: number;
    inProgress: number;
    ready: number;
  };
}

export function WorkshopKanbanCard({
  byStatus,
}: WorkshopKanbanCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Taller (Kanban)
        </CardTitle>
        <Car className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mt-2">
          <div className="flex-1">
            <div className="text-2xl font-bold text-yellow-600">{byStatus.pending}</div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-blue-600">{byStatus.inProgress}</div>
            <p className="text-xs text-muted-foreground">En proceso</p>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-emerald-600">{byStatus.ready}</div>
            <p className="text-xs text-muted-foreground">Listas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
