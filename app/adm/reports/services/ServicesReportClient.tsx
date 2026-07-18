"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/adm/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Wrench,
  Download,
  Users,
  Car,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { formatARS } from "@/lib/utils/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceReportData, type ServiceGroupBy } from "@/lib/services/serviceReportService";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

export default function ServicesReportClient() {
  const [period, setPeriod] = useState<Period>("last30days");
  const [data, setData] = useState<ServiceReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const getGroupByForPeriod = (p: Period): ServiceGroupBy => {
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

    const response = await fetch(`/api/reports/services?${params.toString()}`);
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

  const formatChange = (change: number, current?: number, previous?: number) => {
    if (previous === 0 && current === 0) return "Sin datos";
    if (previous === 0) return "Nuevo período con actividad";
    const value = Math.abs(change).toFixed(1);
    return `${change > 0 ? "+" : change < 0 ? "-" : ""}${value}% vs período anterior`;
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = ["Servicio", "Ingresos", "Cantidad"];
    const rows = data.topServices.map((s) => [
      s.name,
      s.total.toFixed(2),
      s.quantity.toString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `reporte_servicios_${period}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxEvolutionValue = useMemo(() => {
    if (!data || data.evolution.length === 0) return 0;
    return Math.max(...data.evolution.map((e) => e.total), 1);
  }, [data]);

  return (
    <div className="space-y-6">
      <Header
        title="Reporte de Servicios"
        description="Métricas de ingresos, demanda y performance de servicios realizados."
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
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={!data || loading}
              className="h-8 gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
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
                title="Ingresos por Servicios"
                value={formatARS(data.totalServiceRevenue.current)}
                icon={DollarSign}
                trend={{
                  value: formatChange(
                    data.totalServiceRevenue.change,
                    data.totalServiceRevenue.current,
                    data.totalServiceRevenue.previous,
                  ),
                  isPositive: data.totalServiceRevenue.change >= 0,
                }}
              />
              <MetricCard
                title="Cantidad de Servicios"
                value={data.serviceCount.current}
                icon={Wrench}
                trend={{
                  value: formatChange(
                    data.serviceCount.change,
                    data.serviceCount.current,
                    data.serviceCount.previous,
                  ),
                  isPositive: data.serviceCount.change >= 0,
                }}
              />
              <MetricCard
                title="Precio Promedio"
                value={formatARS(data.averageServicePrice.current)}
                icon={TrendingUp}
                trend={{
                  value: formatChange(
                    data.averageServicePrice.change,
                    data.averageServicePrice.current,
                    data.averageServicePrice.previous,
                  ),
                  isPositive: data.averageServicePrice.change >= 0,
                }}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Evolución de Ingresos
                  </CardTitle>
                  <CardDescription>
                    {data.groupBy === "hour"
                      ? "Ingresos horarios"
                      : data.groupBy === "month"
                      ? "Ingresos mensuales"
                      : "Ingresos diarios"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] w-full flex flex-col justify-end">
                    <div className="flex-1 flex items-end justify-between gap-1 overflow-x-auto pb-2 scrollbar-hide">
                      {data.evolution.filter((e) => e.total > 0).length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground italic text-sm">
                          Sin datos para este período
                        </div>
                      ) : (
                        data.evolution.map((item, idx) => {
                          const height = (item.total / maxEvolutionValue) * 100;
                          return (
                            <div
                              key={idx}
                              className="group relative flex-1 h-full min-w-[25px] max-w-[60px] flex flex-col items-center justify-end"
                            >
                              <div
                                className="w-full bg-primary/80 hover:bg-primary rounded-t-sm transition-all"
                                style={{ height: `${Math.max(height, 2)}%` }}
                              />
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md z-10 whitespace-nowrap border font-mono">
                                {formatARS(item.total)} ({item.count})
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-2 truncate w-full text-center">
                                {item.label}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    Por Tipo de Vehículo
                  </CardTitle>
                  <CardDescription>Distribución de ingresos por categoría</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.vehicleCategoryDistribution.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground italic text-sm">
                        Sin datos registrados
                      </div>
                    ) : (
                      data.vehicleCategoryDistribution.map((item) => (
                        <div key={item.category} className="space-y-1.5 group">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold tracking-tight uppercase">
                              {item.category}
                            </span>
                            <span className="font-mono font-bold text-primary">
                              {formatARS(item.total)}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{
                                width: `${(item.total / (data.totalServiceRevenue.current || 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                            <span>{item.count} servicios</span>
                            <span>
                              {((item.total / (data.totalServiceRevenue.current || 1)) * 100).toFixed(1)}%
                            </span>
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
                    <Users className="h-5 w-5 text-primary" />
                    Performance de Técnicos
                  </CardTitle>
                  <CardDescription>Ingresos generados por técnico</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.technicianPerformance.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground italic text-sm">
                        Sin técnicos con servicios asignados
                      </div>
                    ) : (
                      data.technicianPerformance.map((tech) => (
                        <div
                          key={tech.technicianId}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-none">
                                {tech.technicianName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {tech.serviceCount} servicios realizados
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-bold text-emerald-600">
                              {formatARS(tech.totalRevenue)}
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium">Top Servicios</CardTitle>
                    <Link
                      href="/adm/work-orders"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Ver todos
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <CardDescription>Ranking por facturación total</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="p-3 font-medium text-foreground">Servicio</TableHead>
                          <TableHead className="text-right p-3 font-medium text-foreground">Cant.</TableHead>
                          <TableHead className="text-right p-3 font-medium text-foreground">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.topServices.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="p-8 text-center text-muted-foreground italic"
                            >
                              Sin actividad registrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          data.topServices.map((service) => (
                            <TableRow
                              key={service.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="p-3 font-medium truncate max-w-[150px]">
                                {service.name}
                              </TableCell>
                              <TableCell className="p-3 text-right font-mono">{service.quantity}</TableCell>
                              <TableCell className="p-3 text-right font-mono font-bold text-emerald-700">
                                {formatARS(service.total)}
                              </TableCell>
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
