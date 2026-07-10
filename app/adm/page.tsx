import { SalesCard } from "@/components/dashboard/SalesCard";
import { WorkOrdersCard } from "@/components/dashboard/WorkOrdersCard";
import { StockAlertCard } from "@/components/dashboard/StockAlertCard";
import { ReadyForDeliveryCard } from "@/components/dashboard/ReadyForDeliveryCard";
import { PaymentMethodsCard } from "@/components/dashboard/PaymentMethodsCard";
import { CashMovementsCard } from "@/components/dashboard/CashMovementsCard";
import { CashStatusCard } from "@/components/dashboard/CashStatusCard";
import { DebtorsCard } from "@/components/dashboard/DebtorsCard";
import { TopProductsCard } from "@/components/dashboard/TopProductsCard";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { requireAuth } from "@/lib/auth-server";
import { UserRole } from "@/lib/auth/roles";
import { getDashboardData } from "@/lib/services/dashboardService";
import { unstable_cache } from "next/cache";

export const revalidate = 0;

export default async function AdminDashboard() {
  // Validar sesión y rol
  const session = await requireAuth();
  const userRole =
    ((session.user as { role?: string }).role as UserRole) || UserRole.USER;

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
    throw new Error("Acceso denegado");
  }

  // Obtener datos del dashboard con cache para reducir operaciones DB
  // El cache se invalida selectivamente cuando se crean NCs, ventas, etc.
  const getCachedDashboardData = unstable_cache(
    getDashboardData,
    ["dashboard-data"],
    { revalidate: 60, tags: ["dashboard-data"] },
  );
  const data = await getCachedDashboardData();

  return (
    <div className="space-y-6">
      <DashboardClient />

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
    </div>
  );
}
