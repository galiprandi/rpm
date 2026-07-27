import { SalesCard } from "@/components/dashboard/SalesCard";
import { WorkOrdersCard } from "@/components/dashboard/WorkOrdersCard";
import { StockAlertCard } from "@/components/dashboard/StockAlertCard";
import { ReadyForDeliveryCard } from "@/components/dashboard/ReadyForDeliveryCard";
import { PaymentMethodsCard } from "@/components/dashboard/PaymentMethodsCard";
import { CashMovementsCard } from "@/components/dashboard/CashMovementsCard";
import { CashStatusCard } from "@/components/dashboard/CashStatusCard";
import { DebtorsCard } from "@/components/dashboard/DebtorsCard";
import { TopProductsCard } from "@/components/dashboard/TopProductsCard";
import { WorkshopKanbanCard } from "@/components/dashboard/WorkshopKanbanCard";
import { AskNitroCard } from "@/components/dashboard/AskNitroCard";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { requireAuth } from "@/lib/auth-server";
import { UserRole } from "@/lib/auth/roles";
import { getDashboardData } from "@/lib/services/dashboardService";
import { unstable_cache } from "next/cache";

export const revalidate = 0;

/** Role-tailored NITRO example queries — the copilot invitation speaks the user's language. */
const NITRO_QUERIES: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    "¿Cuál es el stock de filtros de aire?",
    "¿Quiénes me deben más de $50k?",
    "¿Cuántas OTs hay en progreso?",
    "¿Qué vendí hoy?",
  ],
  [UserRole.VENDEDOR]: [
    "¿Cuál es el stock de filtros de aire?",
    "¿Qué vendí hoy?",
    "¿Qué OTs están listas para entregar?",
    "¿Cuánto cobré con tarjeta hoy?",
  ],
  [UserRole.STAFF]: [
    "¿Cuál es el stock de filtros de aire?",
    "¿Qué vendí hoy?",
    "¿Qué OTs están listas para entregar?",
    "¿Cuánto cobré con tarjeta hoy?",
  ],
  [UserRole.USER]: [
    "¿Cuántas OTs hay en progreso?",
    "¿Qué OTs están listas para entregar?",
    "¿Qué novedades hay en el taller?",
    "¿Qué trabajos pendientes tengo?",
  ],
};

export default async function AdminDashboard() {
  // Validar sesión y rol
  const session = await requireAuth();
  const userRole =
    ((session.user as { role?: string }).role as UserRole) || UserRole.USER;

  // Obtener datos del dashboard con cache para reducir operaciones DB
  // El cache se invalida selectivamente cuando se crean NCs, ventas, etc.
  const getCachedDashboardData = unstable_cache(
    getDashboardData,
    ["dashboard-data"],
    { revalidate: 60, tags: ["dashboard-data"] },
  );
  const data = await getCachedDashboardData();

  const nitroQueries = NITRO_QUERIES[userRole] ?? NITRO_QUERIES[UserRole.USER];

  return (
    <div className="space-y-6">
      <DashboardClient role={userRole} />

      {/* NITRO copilot invitation — celebrated, not buried */}
      <AskNitroCard queries={nitroQueries} />

      {userRole === UserRole.ADMIN && (
        <>
          {/* Fila 1: 4 KPIs compactos */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SalesCard
              total={data.sales.today.total}
              workOrderCount={data.sales.today.workOrderCount}
              vsYesterday={data.sales.today.vsYesterday}
              ticketAverage={data.sales.ticketAverage}
            />
            <CashStatusCard
              isOpen={data.cashStatus.isOpen}
              openedAt={data.cashStatus.openedAt}
              balance={data.cashStatus.balance}
            />
            <DebtorsCard
              totalDebt={data.debtors.totalDebt}
              count={data.debtors.count}
              topDebtors={data.debtors.topDebtors}
            />
            <StockAlertCard
              lowStockCount={data.stock.lowStockCount}
              lowStockItems={data.stock.lowStockItems}
            />
          </div>

          {/* Fila 2: Taller (col-span-2) + Listos para Entrega */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WorkOrdersCard
                total={data.workOrders.active.total}
                byStatus={data.workOrders.active.byStatus}
                newToday={data.workOrders.active.newToday}
                oldestPending={data.workOrders.active.oldestPending}
              />
            </div>
            <ReadyForDeliveryCard readyForDelivery={data.readyForDelivery} />
          </div>

          {/* Fila 3: Top Productos, Medios de Pago, Movimientos de Caja */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TopProductsCard topProducts={data.topProducts} />
            <PaymentMethodsCard paymentsByMethod={data.paymentsByMethod} />
            <CashMovementsCard cashMovements={data.cashMovements} />
          </div>
        </>
      )}

      {userRole === UserRole.STAFF && (
        <>
          {/* Fila 1: Ventas + Stock */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SalesCard
              total={data.sales.today.total}
              workOrderCount={data.sales.today.workOrderCount}
              vsYesterday={data.sales.today.vsYesterday}
              ticketAverage={data.sales.ticketAverage}
            />
            <StockAlertCard
              lowStockCount={data.stock.lowStockCount}
              lowStockItems={data.stock.lowStockItems}
            />
            <ReadyForDeliveryCard readyForDelivery={data.readyForDelivery} />
          </div>

          {/* Fila 2: Medios de Pago */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PaymentMethodsCard paymentsByMethod={data.paymentsByMethod} />
            <CashMovementsCard cashMovements={data.cashMovements} />
          </div>
        </>
      )}

      {userRole === UserRole.USER && (
        <>
          {/* Fila 1: Workshop kanban (col-span-2) + Listos para Entrega */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WorkshopKanbanCard byStatus={data.workOrders.active.byStatus} />
            </div>
            <ReadyForDeliveryCard readyForDelivery={data.readyForDelivery} />
          </div>

          {/* Fila 2: Órdenes de Trabajo activas (full width) */}
          <WorkOrdersCard
            total={data.workOrders.active.total}
            byStatus={data.workOrders.active.byStatus}
            newToday={data.workOrders.active.newToday}
            oldestPending={data.workOrders.active.oldestPending}
          />
        </>
      )}
    </div>
  );
}
