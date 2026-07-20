"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/adm/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  ShoppingCart,
  Clock,
  Download,
  Package,
  Layers,
} from "lucide-react";
import { formatARS } from "@/lib/utils/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SalesReportData, type GroupBy } from "@/lib/services/salesReportService";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Period =
  | "today"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "last12months"
  | "thisYear";

export default function SalesReportClient() {
  const [period, setPeriod] = useState<Period>("last7days");
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const getGroupByForPeriod = (p: Period): GroupBy => {
    if (p === "today") return "hour";
    if (p === "thisYear" || p === "last12months") return "month";
    return "day";
  };

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
        comparisonStartDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );
        comparisonEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        comparisonEndDate.setHours(23, 59, 59, 999);
        break;
      case "lastMonth":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        comparisonStartDate = new Date(
          now.getFullYear(),
          now.getMonth() - 2,
          1,
        );
        comparisonEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        comparisonEndDate.setHours(23, 59, 59, 999);
        break;
      case "last12months":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        comparisonStartDate = new Date(
          now.getFullYear() - 2,
          now.getMonth(),
          1,
        );
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

  const fetchReport = useCallback(async () => {
    const dates = getDatesForPeriod(period);
    const groupBy = getGroupByForPeriod(period);
    const params = new URLSearchParams({
      startDate: dates.startDate.toISOString(),
      endDate: dates.endDate.toISOString(),
      comparisonStartDate: dates.comparisonStartDate.toISOString(),
      comparisonEndDate: dates.comparisonEndDate.toISOString(),
      groupBy,
    });

    const response = await fetch(`/api/reports/sales?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch report");
    return response.json();
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    fetchReport()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error) => {
        console.error("Error fetching report:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchReport]);

  const formatChange = (
    change: number,
    current?: number,
    previous?: number,
  ) => {
    if (previous === 0 && current === 0) return "Sin ventas en este período";
    if (previous === 0) return "Nuevo período con ventas";
    const value = Math.abs(change).toFixed(1);
    return `${change > 0 ? "+" : change < 0 ? "-" : ""}${value}% vs período anterior`;
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = [
      data.groupBy === "hour" ? "Hora" : data.groupBy === "month" ? "Mes" : "Fecha",
      "Ventas",
      "Cantidad",
      "Promedio",
    ];

    const rows = data.evolution
      .filter((e) => e.total > 0)
      .slice()
      .reverse()
      .map((item) => [
        item.label,
        item.total.toFixed(2),
        item.count.toString(),
        (item.count > 0 ? item.total / item.count : 0).toFixed(2),
      ]);

    const csvContent = "\ufeff" + [
      headers.join(","),
      ...rows.map((r) => r.map((field) => `"${field.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte_ventas_${period}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Header
        title="Reporte de Ventas"
        description="Métricas y evolución de ingresos por ventas y taller."
        secondaryActions={[
          {
            label: "Exportar CSV",
            onClick: exportToCSV,
            disabled: !data || loading,
            icon: Download,
            variant: "outline",
          },
        ]}
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
            {data && period === "today" && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Datos con delay de hasta 10 min</span>
              </div>
            )}
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20" />
              <CardContent className="h-16" />
            </Card>
          ))}
        </div>
      ) : (
        data && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                title="Ventas Totales"
                value={formatARS(data.totalSales.current)}
                icon={DollarSign}
                trend={{
                  value: formatChange(
                    data.totalSales.change,
                    data.totalSales.current,
                    data.totalSales.previous,
                  ),
                  isPositive: data.totalSales.change >= 0,
                }}
              />
              <MetricCard
                title="Cantidad de Ventas"
                value={data.orderCount.current}
                icon={ShoppingCart}
                trend={{
                  value: formatChange(
                    data.orderCount.change,
                    data.orderCount.current,
                    data.orderCount.previous,
                  ),
                  isPositive: data.orderCount.change >= 0,
                }}
              />
              <MetricCard
                title="Ticket Promedio"
                value={formatARS(data.ticketAverage.current)}
                icon={BarChart3}
                trend={{
                  value: formatChange(
                    data.ticketAverage.change,
                    data.ticketAverage.current,
                    data.ticketAverage.previous,
                  ),
                  isPositive: data.ticketAverage.change >= 0,
                }}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {data.groupBy === "hour"
                      ? "Evolución por Hora"
                      : data.groupBy === "month"
                        ? "Evolución Mensual"
                        : "Evolución Diaria"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="relative h-[280px] w-full flex items-end justify-center gap-1 overflow-y-hidden">
                      {data.evolution.filter((e) => e.total > 0).length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic">
                          Sin datos para este período
                        </div>
                      ) : (
                        <>
                          {data.evolution
                            .filter((e) => e.total > 0)
                            .map((item, idx) => {
                              const maxTotal = Math.max(
                                ...data.evolution.map((e) => e.total),
                                1,
                              );
                              const height = (item.total / maxTotal) * 100;
                              return (
                                <div
                                  key={idx}
                                  className="group relative flex-1 h-full min-w-[20px] max-w-[60px] flex flex-col items-center justify-end"
                                >
                                  <div
                                    className="w-full bg-primary/80 hover:bg-primary rounded-t-sm transition-all relative"
                                    style={{ height: `${Math.max(height, 2)}%` }}
                                  >
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-10 font-mono">
                                      {formatARS(item.total)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </>
                      )}
                    </div>
                    {data.evolution.filter((e) => e.total > 0).length > 0 && (
                      <div className="flex gap-1 mt-1 justify-center">
                        {data.evolution
                          .filter((e) => e.total > 0)
                          .map((item, idx) => (
                            <div
                              key={idx}
                              className="flex-1 min-w-[20px] max-w-[60px] text-[10px] text-muted-foreground text-center whitespace-nowrap"
                            >
                              {item.label}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Ventas por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.categoryDistribution.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground italic text-sm">
                        Sin datos de categorías
                      </div>
                    ) : (
                      data.categoryDistribution.slice(0, 6).map((item) => (
                        <div key={item.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate mr-2">
                              {item.name}
                            </span>
                            <span className="font-mono font-bold text-primary">
                              {formatARS(item.total)}
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{
                                width: `${(item.total / (data.totalSales.current || 1)) * 100}%`,
                                backgroundColor: item.color || undefined,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Top Productos / Servicios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.topProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground italic text-sm">
                        Sin datos de productos
                      </div>
                    ) : (
                      data.topProducts.map((product, idx) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {idx + 1}
                            </div>
                            <div className="grid gap-0.5">
                              <p className="text-sm font-medium leading-none">
                                {product.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {product.quantity} unidades vendidas
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-bold">
                              {formatARS(product.total)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    {data.groupBy === "hour"
                      ? "Detalle por Hora"
                      : data.groupBy === "month"
                        ? "Detalle Mensual"
                        : "Detalle por Día"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="p-3 font-medium text-foreground">
                            {data.groupBy === "hour"
                              ? "Hora"
                              : data.groupBy === "month"
                                ? "Mes"
                                : "Fecha"}
                          </TableHead>
                          <TableHead className="text-right p-3 font-medium text-foreground">Ventas</TableHead>
                          <TableHead className="text-right p-3 font-medium text-foreground">Cantidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.evolution.filter((e) => e.total > 0).length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="p-8 text-center text-muted-foreground italic"
                            >
                              Sin datos para este período
                            </TableCell>
                          </TableRow>
                        ) : (
                          data.evolution
                            .filter((e) => e.total > 0)
                            .slice()
                            .reverse()
                            .slice(0, 5) // Limit to 5 for preview, more details in CSV
                            .map((item, idx) => (
                              <TableRow
                                key={idx}
                                className="hover:bg-muted/30 transition-colors"
                              >
                                <TableCell className="p-3 font-medium">{item.label}</TableCell>
                                <TableCell className="p-3 text-right font-mono font-semibold text-emerald-700">
                                  {formatARS(item.total)}
                                </TableCell>
                                <TableCell className="p-3 text-right">{item.count}</TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )
      )}
    </div>
  );
}
