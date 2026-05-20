import { getDashboardData } from '@/lib/services/dashboardService';
import { BentoCard } from '@/components/dashboard/prototypes/BentoCard';
import { Header } from '@/components/adm/Header';
import { ShoppingBag, Wrench, Package, Wallet, Users, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { PriceDisplay, formatPrice } from '@/components/ui/price-display';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function BentoDashboard() {
  const data = await getDashboardData({ forceMock: true });

  return (
    <div className="space-y-6">
      <Header
        title="Panel Ejecutivo"
        description="Resumen visual de alto impacto de los indicadores clave"
      />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-4 md:grid-rows-4 h-[auto] min-h-[800px]">
        {/* Ventas Hoy - Grande */}
        <div className="md:col-span-2 md:row-span-2">
          <BentoCard
            title="Ventas del Día"
            value={formatPrice(data.sales.today.total)}
            subtitle={`${data.sales.today.workOrderCount} operaciones finalizadas`}
            icon={ShoppingBag}
            variant="primary"
            trend={{ value: `${data.sales.today.vsYesterday}%`, isPositive: data.sales.today.vsYesterday >= 0 }}
          >
            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  <p className="text-xl font-bold"><PriceDisplay value={data.sales.ticketAverage} /></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Proyección Mensual</p>
                  <p className="text-xl font-bold text-blue-600">$12.5M</p>
                </div>
              </div>
              <div className="w-full bg-blue-100 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[65%]" />
              </div>
              <p className="text-xs text-muted-foreground italic text-center">65% del objetivo mensual alcanzado</p>
            </div>
          </BentoCard>
        </div>

        {/* OTs Activas - Mediana */}
        <div className="md:col-span-2 md:row-span-1">
          <BentoCard
            title="Órdenes en Taller"
            value={data.workOrders.active.total}
            subtitle={`${data.workOrders.active.newToday} nuevas hoy`}
            icon={Wrench}
            variant="warning"
          >
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-50">Confirmadas: {data.workOrders.active.byStatus.pending}</Badge>
              <Badge variant="outline" className="bg-orange-50">En Proceso: {data.workOrders.active.byStatus.inProgress}</Badge>
              <Badge variant="outline" className="bg-green-50">Listas: {data.workOrders.active.byStatus.ready}</Badge>
            </div>
          </BentoCard>
        </div>

        {/* Stock Crítico - Pequeña */}
        <div className="md:col-span-1 md:row-span-1">
          <BentoCard
            title="Stock Bajo"
            value={data.stock.lowStockCount}
            icon={Package}
            variant="destructive"
            subtitle="Acción requerida"
          />
        </div>

        {/* Clientes - Pequeña */}
        <div className="md:col-span-1 md:row-span-1">
          <BentoCard
            title="Clientes"
            value="142"
            icon={Users}
            subtitle="+8 esta semana"
          />
        </div>

        {/* Caja - Grande Ancha */}
        <div className="md:col-span-3 md:row-span-1">
          <BentoCard
            title="Estado de Caja"
            value={formatPrice(data.cashMovements?.filter(m => m.type === 'INCOME').reduce((acc, m) => acc + m.amount, 0) || 0)}
            icon={Wallet}
            variant="success"
            subtitle="Ingresos brutos hoy"
          >
            <div className="flex justify-around items-center pt-4 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-semibold">EFECTIVO</p>
                <p className="font-bold text-green-600">$45.200</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-semibold">TRANSF.</p>
                <p className="font-bold text-blue-600">$128.000</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-semibold">TARJETA</p>
                <p className="font-bold text-purple-600">$312.000</p>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Insights - Mediana Vertical */}
        <div className="md:col-span-1 md:row-span-2">
          <Card className="h-full bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-tighter opacity-70">RPM Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Pico de ventas</p>
                  <p className="text-xs opacity-70">Martes 10:00 - 12:00</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Filtro de Aceite X</p>
                  <p className="text-xs opacity-70">Rotación lenta (45 días)</p>
                </div>
              </div>
              <div className="mt-8">
                <p className="text-xs font-semibold mb-2 opacity-50">SATISFACCIÓN</p>
                <div className="text-4xl font-black">4.8/5</div>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(i => <Zap key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ranking - Pequeña Ancha */}
        <div className="md:col-span-3 md:row-span-1">
          <Card className="h-full">
            <CardHeader className="py-3">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Productos Estrella</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center py-2">
              {[
                { name: 'Aceite 10W40', val: '+24%' },
                { name: 'Kit Distribución', val: '+18%' },
                { name: 'Batería 75Ah', val: '+12%' },
              ].map(p => (
                <div key={p.name} className="flex flex-col items-center">
                  <p className="text-sm font-bold">{p.name}</p>
                  <span className="text-xs text-green-600 font-bold">{p.val}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
