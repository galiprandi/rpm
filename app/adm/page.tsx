'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/adm/Header';
import { SalesCard } from '@/components/dashboard/SalesCard';
import { WorkOrdersCard } from '@/components/dashboard/WorkOrdersCard';
import { StockAlertCard } from '@/components/dashboard/StockAlertCard';
import { WorkshopKanbanCard } from '@/components/dashboard/WorkshopKanbanCard';
import { ReadyForDeliveryCard } from '@/components/dashboard/ReadyForDeliveryCard';
import { RecentMovementsCard } from '@/components/dashboard/RecentMovementsCard';
import { PaymentMethodsCard } from '@/components/dashboard/PaymentMethodsCard';
import { CashMovementsCard } from '@/components/dashboard/CashMovementsCard';
import { QuickSaleModal } from '@/components/dashboard/QuickSaleModal';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShoppingCart } from 'lucide-react';

interface DashboardSummary {
  sales: {
    today: {
      total: number;
      workOrderCount: number;
      vsYesterday: number;
    };
    ticketAverage: number;
  };
  workOrders: {
    active: {
      total: number;
      byStatus: {
        pending: number;
        inProgress: number;
        ready: number;
      };
      newToday: number;
    };
  };
  stock: {
    lowStockCount: number;
    lowStockItems: Array<{
      id: string;
      name: string;
      stock: number;
      minStock: number;
    }>;
  };
  readyForDelivery: Array<{
    workOrderId: string;
    vehicle: {
      type: 'COMPACT' | 'SEDAN' | 'SUV' | 'PICKUP' | 'TRUCK';
      description: string;
    };
    customer: {
      name: string;
      phone: string;
    };
    total: number;
    completedAt: string;
    invoiceStatus: 'ISSUED' | 'PENDING';
  }>;
  recentMovements: Array<{
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    productName: string;
    quantity: number;
    reason: string;
    timestamp: string;
    userName: string;
  }>;
  paymentsByMethod?: Array<{
    code: string;
    name: string;
    total: number;
  }>;
  cashMovements?: Array<{
    id: string;
    type: 'INCOME' | 'EXPENSE' | 'OPENING' | 'CLOSING';
    amount: number;
    method: string;
    methodName: string;
    referenceId?: string;
    referenceType?: string;
    reason?: string;
    createdAt: string;
    createdBy: string;
  }>;
  generatedAt: string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickSaleModalOpen, setQuickSaleModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/dashboard/summary');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del dashboard');
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Polling cada 60 segundos
    const interval = setInterval(fetchDashboardData, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Header
          title="Dashboard"
          description="Bienvenido al panel de administración de RPM Accesorios"
        />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Header
          title="Dashboard"
          description="Bienvenido al panel de administración de RPM Accesorios"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{error || 'Error al cargar datos'}</p>
            <Button onClick={fetchDashboardData}>Reintentar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Header
          title="Dashboard"
          description="Bienvenido al panel de administración de RPM Accesorios"
        />
        <Button
          onClick={() => setQuickSaleModalOpen(true)}
          className="gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Venta Rápida
        </Button>
      </div>

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

      <QuickSaleModal
        open={quickSaleModalOpen}
        onOpenChange={setQuickSaleModalOpen}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
