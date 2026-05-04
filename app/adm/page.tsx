import { SalesCard } from '@/components/dashboard/SalesCard';
import { WorkOrdersCard } from '@/components/dashboard/WorkOrdersCard';
import { StockAlertCard } from '@/components/dashboard/StockAlertCard';
import { WorkshopKanbanCard } from '@/components/dashboard/WorkshopKanbanCard';
import { ReadyForDeliveryCard } from '@/components/dashboard/ReadyForDeliveryCard';
import { RecentMovementsCard } from '@/components/dashboard/RecentMovementsCard';
import { PaymentMethodsCard } from '@/components/dashboard/PaymentMethodsCard';
import { CashMovementsCard } from '@/components/dashboard/CashMovementsCard';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { requireAuth } from '@/lib/auth-server';
import { UserRole } from '@/lib/auth/roles';
import { getDashboardData } from '@/lib/services/dashboardService';
import { unstable_cache } from 'next/cache';

export const revalidate = 0;

export default async function AdminDashboard() {
  // Validar sesión y rol
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error('Acceso denegado');
  }

  // Obtener datos del dashboard con cache para reducir operaciones DB
  // El cache se invalida selectivamente cuando se crean NCs, ventas, etc.
  const getCachedDashboardData = unstable_cache(
    getDashboardData,
    ['dashboard-data'],
    { revalidate: 60 }
  );
  const data = await getCachedDashboardData();

  return (
    <div className="space-y-6">
      <DashboardClient />

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
