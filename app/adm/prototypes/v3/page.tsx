import { getDashboardData } from '@/lib/services/dashboardService';
import { StockAlertCard } from '@/components/dashboard/StockAlertCard';
import { RecentMovementsCard } from '@/components/dashboard/RecentMovementsCard';
import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, BarChart3, Tag, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function InventoryDashboard() {
  const data = await getDashboardData({ forceMock: true });

  return (
    <div className="space-y-6">
      <Header
        title="Panel de Inventario"
        description="Control de stock, reposición y movimientos de productos"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stock.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Productos bajo el mínimo</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimientos Hoy</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Entradas y salidas registradas</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4.2M</div>
            <p className="text-xs text-muted-foreground">Costo de reposición estimado</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Ingresos</CardTitle>
            <Tag className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Productos agregados este mes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StockAlertCard
            lowStockCount={data.stock.lowStockCount}
            lowStockItems={data.stock.lowStockItems}
          />
        </div>
        <div className="lg:col-span-2">
          <RecentMovementsCard recentMovements={data.recentMovements} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Categorías más Vendidas (Unidades)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { category: 'Aceites', count: 124, percent: 85, color: 'bg-blue-500' },
              { category: 'Filtros', count: 98, percent: 70, color: 'bg-green-500' },
              { category: 'Baterías', count: 12, percent: 15, color: 'bg-amber-500' },
              { category: 'Repuestos Tren Delantero', count: 45, percent: 40, color: 'bg-purple-500' },
            ].map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{cat.category}</span>
                  <span className="text-muted-foreground">{cat.count} uds.</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", cat.color)} style={{ width: `${cat.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
