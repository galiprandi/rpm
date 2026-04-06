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
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

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
  generatedAt: string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/dashboard/summary');
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del dashboard');
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);
      setLastUpdated(new Date());
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
          description="Cargando datos del dashboard..."
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
          description="Error al cargar datos"
        />
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || 'No se pudieron cargar los datos'}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Reintentar
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="Dashboard"
        description={`Última actualización: ${lastUpdated?.toLocaleTimeString('es-AR')}`}
      />

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

      {/* Fila 3: Movimientos Recientes */}
      <div className="grid gap-4 md:grid-cols-1">
        <RecentMovementsCard recentMovements={data.recentMovements} />
      </div>
    </div>
  );
}
