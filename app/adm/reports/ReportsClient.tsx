'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import {
  BarChart3,
  TrendingDown,
  Package,
  Wrench,
  Wallet,
  ShoppingCart,
  Users,
  ArrowRight,
  LucideIcon,
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  UserPlus,
  CheckCircle2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { formatARS } from '@/lib/utils/format';
import { OverviewReportData } from '@/lib/services/overviewReportService';

type Period =
  | "today"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "last12months"
  | "thisYear";

interface ReportCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  isAvailable?: boolean;
}

function ReportCard({ title, description, href, icon: Icon, isAvailable = true }: ReportCardProps) {
  const content = (
    <Card className={cn(
      "group transition-all duration-200",
      isAvailable
        ? "hover:border-primary/50 hover:shadow-md cursor-pointer"
        : "opacity-60 grayscale-[0.5]"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {isAvailable && (
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          )}
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!isAvailable && (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            Próximamente
          </span>
        )}
      </CardContent>
    </Card>
  );

  if (!isAvailable) return content;

  return (
    <Link href={href}>
      {content}
    </Link>
  );
}

export default function ReportsClient() {
  const [period, setPeriod] = useState<Period>("last30days");
  const [data, setData] = useState<OverviewReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const getDatesForPeriod = (p: Period) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let comparisonStartDate = new Date();
    let comparisonEndDate = new Date();

    switch (p) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        comparisonStartDate = new Date(startDate);
        comparisonStartDate.setDate(comparisonStartDate.getDate() - 1);
        comparisonEndDate = new Date(endDate);
        comparisonEndDate.setDate(comparisonEndDate.getDate() - 1);
        break;
      case "last7days":
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        comparisonStartDate = new Date(startDate);
        comparisonStartDate.setDate(comparisonStartDate.getDate() - 7);
        comparisonEndDate = new Date(startDate);
        comparisonEndDate.setDate(comparisonEndDate.getDate() - 1);
        comparisonEndDate.setHours(23, 59, 59, 999);
        break;
      case "last30days":
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        comparisonStartDate = new Date(startDate);
        comparisonStartDate.setDate(comparisonStartDate.getDate() - 30);
        comparisonEndDate = new Date(startDate);
        comparisonEndDate.setDate(comparisonEndDate.getDate() - 1);
        comparisonEndDate.setHours(23, 59, 59, 999);
        break;
      case "thisMonth":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        comparisonStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        comparisonEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        comparisonEndDate.setHours(23, 59, 59, 999);
        break;
      case "lastMonth":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        comparisonStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        comparisonEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        comparisonEndDate.setHours(23, 59, 59, 999);
        break;
      case "last12months":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        comparisonStartDate = new Date(now.getFullYear() - 2, now.getMonth(), 1);
        comparisonEndDate = new Date(now.getFullYear() - 1, now.getMonth(), 0);
        comparisonEndDate.setHours(23, 59, 59, 999);
        break;
      case "thisYear":
        startDate = new Date(now.getFullYear(), 0, 1);
        comparisonStartDate = new Date(now.getFullYear() - 1, 0, 1);
        comparisonEndDate = new Date(now.getFullYear() - 1, 11, 31);
        comparisonEndDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate, comparisonStartDate, comparisonEndDate };
  };

  const fetchOverview = useCallback(async () => {
    const dates = getDatesForPeriod(period);
    const params = new URLSearchParams({
      startDate: dates.startDate.toISOString(),
      endDate: dates.endDate.toISOString(),
      comparisonStartDate: dates.comparisonStartDate.toISOString(),
      comparisonEndDate: dates.comparisonEndDate.toISOString(),
    });

    const response = await fetch(`/api/reports/overview?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch overview");
    return response.json();
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchOverview()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error) => {
        console.error("Error fetching overview:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchOverview]);

  const formatChange = (change: number) => {
    const value = Math.abs(change).toFixed(1);
    return `${change > 0 ? "+" : change < 0 ? "-" : ""}${value}% vs período anterior`;
  };

  const reports = [
    {
      title: "Ventas",
      description: "Métricas de facturación, ticket promedio y evolución diaria de ingresos.",
      href: "/adm/reports/sales",
      icon: BarChart3,
      isAvailable: true
    },
    {
      title: "Deudores",
      description: "Listado de clientes con saldos pendientes y antigüedad de deuda.",
      href: "/adm/reports/debtors",
      icon: TrendingDown,
      isAvailable: true
    },
    {
      title: "Stock & Inventario",
      description: "Valorización de stock, rotación de productos y alertas de reposición.",
      href: "/adm/reports/stock",
      icon: Package,
      isAvailable: true
    },
    {
      title: "Taller & Operación",
      description: "Eficiencia de técnicos, tiempos de resolución y carga de trabajo.",
      href: "/adm/reports/workshop",
      icon: Wrench,
      isAvailable: true
    },
    {
      title: "Finanzas & Flujo",
      description: "Ingresos vs egresos, rentabilidad neta y análisis de medios de pago.",
      href: "/adm/reports/finance",
      icon: Wallet,
      isAvailable: true
    },
    {
      title: "Compras",
      description: "Análisis de abastecimiento, evolución de costos y compras por proveedor.",
      href: "/adm/reports/purchases",
      icon: ShoppingCart,
      isAvailable: true
    },
    {
      title: "Clientes",
      description: "Análisis de adquisición, recurrencia y ranking de clientes por facturación.",
      href: "/adm/reports/customers",
      icon: Users,
      isAvailable: true
    },
    {
      title: "Servicios",
      description: "Métricas de ingresos, demanda y performance de servicios realizados.",
      href: "/adm/reports/services",
      icon: Wrench,
      isAvailable: true
    }
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Centro de Reportes"
        description="Analiza el desempeño de tu negocio con métricas detalladas y visualizaciones."
        leftActions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as Period)}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="last7days">Últimos 7 días</SelectItem>
                  <SelectItem value="last30days">Últimos 30 días</SelectItem>
                  <SelectItem value="thisMonth">Este mes</SelectItem>
                  <SelectItem value="lastMonth">Mes pasado</SelectItem>
                  <SelectItem value="last12months">Últimos 12 meses</SelectItem>
                  <SelectItem value="thisYear">Este año</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20" />
              <CardContent className="h-16" />
            </Card>
          ))
        ) : (
          data && (
            <>
              <MetricCard
                title="Ingresos Totales"
                value={formatARS(data.revenue.current)}
                icon={DollarSign}
                trend={{
                  value: formatChange(data.revenue.change),
                  isPositive: data.revenue.change >= 0,
                }}
              />
              <MetricCard
                title="Rentabilidad Est."
                value={formatARS(data.estimatedProfit.current)}
                icon={TrendingUp}
                trend={{
                  value: formatChange(data.estimatedProfit.change),
                  isPositive: data.estimatedProfit.change >= 0,
                }}
                subtitle="Ingresos - Costos"
              />
              <MetricCard
                title="OTs Completadas"
                value={data.completedOrders.current}
                icon={CheckCircle2}
                trend={{
                  value: formatChange(data.completedOrders.change),
                  isPositive: data.completedOrders.change >= 0,
                }}
              />
              <MetricCard
                title="Clientes Nuevos"
                value={data.newCustomers.current}
                icon={UserPlus}
                trend={{
                  value: formatChange(data.newCustomers.change),
                  isPositive: data.newCustomers.change >= 0,
                }}
              />
            </>
          )
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Estado de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-24 animate-pulse bg-muted rounded" />
            ) : data && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valorización Total:</span>
                  <span className="text-lg font-bold font-mono">{formatARS(data.stockStatus.totalValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Alertas de Stock:</span>
                  <span className={cn(
                    "text-lg font-bold font-mono",
                    data.stockStatus.lowStockCount > 0 ? "text-red-600" : "text-emerald-600"
                  )}>
                    {data.stockStatus.lowStockCount}
                  </span>
                </div>
                <Link href="/adm/reports/stock">
                  <button className="w-full mt-2 text-xs text-primary font-medium flex items-center justify-center gap-1 hover:underline">
                    Ver reporte detallado <ArrowRight className="h-3 w-3" />
                  </button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
           <div className="grid gap-6 md:grid-cols-2">
             {/* This space could be used for a mini-chart if needed in the future */}
           </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h2 className="text-lg font-semibold mb-4">Módulos Detallados</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report, idx) => (
            <ReportCard key={idx} {...report} />
          ))}
        </div>
      </div>
    </div>
  );
}
