'use client';

import { useQuery } from '@tanstack/react-query';
import { SalesCard } from './SalesCard';
import { WorkOrdersCard } from './WorkOrdersCard';
import { StockAlertCard } from './StockAlertCard';
import { WorkshopKanbanCard } from './WorkshopKanbanCard';
import { ReadyForDeliveryCard } from './ReadyForDeliveryCard';
import { PaymentMethodsCard } from './PaymentMethodsCard';
import { RecentMovementsCard } from './RecentMovementsCard';
import { CashMovementsCard } from './CashMovementsCard';
import { Skeleton } from '@/components/ui/skeleton';

export function LazyDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary');
      if (!res.ok) throw new Error('Error al cargar el dashboard');
      return res.json();
    },
    // Refetch cada 1 minuto
    refetchInterval: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[140px]" />
          <Skeleton className="h-[140px]" />
          <Skeleton className="h-[140px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md text-center">
        Hubo un error al cargar el dashboard. Por favor, intente refrescar la página.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fila 1: 3 cards principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SalesCard
          total={data.sales.today.total}
          workOrderCount={data.sales.today.workOrderCount}
          vsYesterday={data.sales.today.vsYesterday}
          ticketAverage={data.sales.ticketAverage}
        />
        <WorkOrdersCard
          total={data.workOrders.active.total}
          byStatus={data.workOrders.active.byStatus}
          newToday={data.workOrders.active.newToday}
        />
        <StockAlertCard
          lowStockCount={data.stock.lowStockCount}
          lowStockItems={data.stock.lowStockItems}
        />
      </div>

      {/* Fila 2: Taller Kanban, Listos para Entrega y Medios de Pago */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <WorkshopKanbanCard byStatus={data.workOrders.active.byStatus} />
        <ReadyForDeliveryCard readyForDelivery={data.readyForDelivery} />
        <PaymentMethodsCard paymentsByMethod={data.paymentsByMethod} />
      </div>

      {/* Fila 3: Movimientos Recientes y Movimientos de Caja */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentMovementsCard recentMovements={data.recentMovements} />
        <CashMovementsCard cashMovements={data.cashMovements} />
      </div>
    </div>
  );
}
