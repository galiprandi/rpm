import { getDashboardData } from '@/lib/services/dashboardService';
import { WorkshopKanbanCard } from '@/components/dashboard/WorkshopKanbanCard';
import { ReadyForDeliveryCard } from '@/components/dashboard/ReadyForDeliveryCard';
import { WorkOrdersCard } from '@/components/dashboard/WorkOrdersCard';
import { Header } from '@/components/adm/Header';
import { Wrench, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default async function OperationalDashboard() {
  const data = await getDashboardData({ forceMock: true });

  return (
    <div className="space-y-6">
      <Header
        title="Panel Operativo"
        description="Enfoque en el flujo del taller y productividad"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <WorkOrdersCard
          total={data.workOrders.active.total}
          byStatus={data.workOrders.active.byStatus}
          newToday={data.workOrders.active.newToday}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">+4% desde la semana pasada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retrasos Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">3</div>
            <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Ocupada</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14 / 20</div>
            <div className="w-full bg-secondary h-2 rounded-full mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkshopKanbanCard byStatus={data.workOrders.active.byStatus} />
        </div>
        <div className="space-y-4">
          <ReadyForDeliveryCard readyForDelivery={data.readyForDelivery} />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Técnicos Activos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Juan Pérez', tasks: 3, status: 'busy' },
                { name: 'Carlos Gómez', tasks: 1, status: 'available' },
                { name: 'Mateo Ruiz', tasks: 4, status: 'busy' },
              ].map((t) => (
                <div key={t.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", t.status === 'busy' ? 'bg-orange-500' : 'bg-green-500')} />
                    <span className="text-sm font-medium">{t.name}</span>
                  </div>
                  <Badge variant="outline">{t.tasks} OTs</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
