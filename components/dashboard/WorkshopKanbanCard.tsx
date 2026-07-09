import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Clock, Wrench, CheckCircle2 } from 'lucide-react';

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
  const statuses = [
    {
      label: 'Pendientes',
      value: byStatus.pending,
      icon: Clock,
      colorClass: 'text-amber-700',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-100',
    },
    {
      label: 'En proceso',
      value: byStatus.inProgress,
      icon: Wrench,
      colorClass: 'text-blue-700',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-100',
    },
    {
      label: 'Listas',
      value: byStatus.ready,
      icon: CheckCircle2,
      colorClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-100',
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Taller (Kanban)
        </CardTitle>
        <Car
          className="h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {statuses.map((status) => (
            <div
              key={status.label}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border ${status.bgClass} ${status.borderClass} transition-all hover:shadow-sm hover:scale-[1.02] group`}
            >
              <status.icon
                className={`h-4 w-4 ${status.colorClass} mb-2 opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none`}
                aria-hidden="true"
              />
              <div className={`text-2xl font-bold font-mono ${status.colorClass}`}>
                {status.value}
              </div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
                {status.label}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
