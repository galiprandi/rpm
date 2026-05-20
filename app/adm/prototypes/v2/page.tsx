import { getDashboardData } from '@/lib/services/dashboardService';
import { SalesCard } from '@/components/dashboard/SalesCard';
import { PaymentMethodsCard } from '@/components/dashboard/PaymentMethodsCard';
import { CashMovementsCard } from '@/components/dashboard/CashMovementsCard';
import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { PriceDisplay } from '@/components/ui/price-display';
import { Badge } from '@/components/ui/badge';

export default async function FinancialDashboard() {
  const data = await getDashboardData({ forceMock: true });

  const totalIncome = data.cashMovements?.filter(m => m.type === 'INCOME').reduce((acc, m) => acc + m.amount, 0) || 0;
  const totalExpense = data.cashMovements?.filter(m => m.type === 'EXPENSE').reduce((acc, m) => acc + m.amount, 0) || 0;

  return (
    <div className="space-y-6">
      <Header
        title="Panel Financiero"
        description="Seguimiento de ingresos, gastos y flujo de caja"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SalesCard
          total={data.sales.today.total}
          workOrderCount={data.sales.today.workOrderCount}
          vsYesterday={data.sales.today.vsYesterday}
          ticketAverage={data.sales.ticketAverage}
        />
        <Card className="bg-green-50/50 border-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Ingresos Hoy</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              <PriceDisplay value={totalIncome} />
            </div>
            <p className="text-xs text-green-600 mt-1">Suma de todos los cobros</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Total Egresos Hoy</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              <PriceDisplay value={totalExpense} />
            </div>
            <p className="text-xs text-red-600 mt-1">Gastos y pagos a proveedores</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PaymentMethodsCard paymentsByMethod={data.paymentsByMethod} />
        </div>
        <div className="lg:col-span-2">
          <CashMovementsCard cashMovements={data.cashMovements} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Proyección de Cierre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-muted/30 rounded-xl gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">Ventas Proyectadas</p>
              <p className="text-3xl font-bold"><PriceDisplay value={data.sales.today.total * 1.2} /></p>
            </div>
            <div className="h-px w-full md:w-px md:h-12 bg-border" />
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">Margen Bruto Estimado</p>
              <p className="text-3xl font-bold text-green-600">32.5%</p>
            </div>
            <div className="h-px w-full md:w-px md:h-12 bg-border" />
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">Punto de Equilibrio</p>
              <Badge variant="outline" className="text-lg px-4 py-1 mt-1 text-blue-600 border-blue-200 bg-blue-50">Alcanzado</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
