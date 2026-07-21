"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/adm/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowUpRight,
  Clock,
  Briefcase,
  Users,
  Target,
  Download,
} from "lucide-react";
import { formatARS } from "@/lib/utils/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfitabilityReportData, type ProfitabilityGroupBy } from "@/lib/services/profitabilityReportService";
import { cn } from "@/lib/utils";
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
  | "thisYear"
  | "custom";

export default function ProfitabilityReportClient() {
  const [period, setPeriod] = useState<Period>("last30days");
  const [data, setData] = useState<ProfitabilityReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  useEffect(() => {
    if (!customStartDate || !customEndDate) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      setCustomStartDate(start.toISOString().split("T")[0]);
      setCustomEndDate(end.toISOString().split("T")[0]);
    }
  }, []);

  const getGroupByForPeriod = (p: Period): ProfitabilityGroupBy => {
    if (p === "today") return "hour";
    if (p === "thisYear" || p === "last12months") return "month";
    if (p === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate + "T00:00:00");
      const end = new Date(customEndDate + "T23:59:59.999");
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) return "hour";
      if (diffDays <= 31) return "day";
      return "month";
    }
    return "day";
  };

  const getDatesForPeriod = (p: Period) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let comparisonStartDate = new Date();
    let comparisonEndDate = new Date();

    if (p === "custom") {
      const start = customStartDate ? new Date(customStartDate + "T00:00:00") : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = customEndDate ? new Date(customEndDate + "T23:59:59.999") : new Date();
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const diff = end.getTime() - start.getTime();
      comparisonStartDate = new Date(start.getTime() - diff - 1);
      comparisonEndDate = new Date(start.getTime() - 1);
      return { startDate: start, endDate: end, comparisonStartDate, comparisonEndDate };
    }

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

    const response = await fetch(`/api/reports/profitability?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch report");
    return response.json();
  }, [period, customStartDate, customEndDate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
    if (previous === 0) return "Nuevo período con datos";
    const value = Math.abs(change).toFixed(1);
    return `${change > 0 ? "+" : change < 0 ? "-" : ""}${value}% vs período anterior`;
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = [
      data.groupBy === "hour" ? "Hora" : data.groupBy === "month" ? "Mes" : "Fecha",
      "Ingresos",
      "Costos",
      "Ganancia Bruta",
      "Margen Bruto",
    ];

    const rows = data.evolution
      .map((item) => [
        item.label,
        item.revenue.toFixed(2),
        item.cost.toFixed(2),
        item.profit.toFixed(2),
        (item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0).toFixed(1) + "%",
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
      `reporte_rentabilidad_${period}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxEvolutionValue = useMemo(() => {
    if (!data) return 0;
    return Math.max(...data.evolution.map((e) => Math.max(e.revenue, e.cost)), 1);
  }, [data]);

  return (
    <div className="space-y-6">
      <Header
        title="Reporte de Rentabilidad"
        description="Análisis de margen bruto, costos estimados y productos más rentables."
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
          <div className="flex flex-wrap items-center gap-3">
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
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === "custom" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Desde:</span>
                <input
                  type="date"
                  className="px-2 py-1 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 h-8"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
                <span className="text-xs text-muted-foreground font-medium">Hasta:</span>
                <input
                  type="date"
                  className="px-2 py-1 text-xs bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 h-8"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            )}

            {data && period === "today" && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Delay de hasta 10 min</span>
              </div>
            )}
          </div>
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20" />
              <CardContent className="h-16" />
            </Card>
          ))}
        </div>
      ) : (
        data && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Ganancia Bruta"
                value={formatARS(data.grossProfit.current)}
                icon={ArrowUpRight}
                trend={{
                  value: formatChange(
                    data.grossProfit.change,
                    data.grossProfit.current,
                    data.grossProfit.previous,
                  ),
                  isPositive: data.grossProfit.change >= 0,
                }}
                className="border-primary/20 bg-primary/5"
              />
              <MetricCard
                title="Margen Bruto"
                value={`${data.grossMargin.current.toFixed(1)}%`}
                icon={Target}
                trend={{
                  value: formatChange(
                    data.grossMargin.change,
                    data.grossMargin.current,
                    data.grossMargin.previous,
                  ),
                  isPositive: data.grossMargin.change >= 0,
                }}
              />
              <MetricCard
                title="Ingresos Totales"
                value={formatARS(data.revenue.current)}
                icon={DollarSign}
                trend={{
                  value: formatChange(
                    data.revenue.change,
                    data.revenue.current,
                    data.revenue.previous,
                  ),
                  isPositive: data.revenue.change >= 0,
                }}
              />
              <MetricCard
                title="Costos Totales (Est.)"
                value={formatARS(data.totalCost.current)}
                icon={Briefcase}
                trend={{
                  value: formatChange(
                    data.totalCost.change,
                    data.totalCost.current,
                    data.totalCost.previous,
                  ),
                  isPositive: data.totalCost.change <= 0,
                }}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Evolución de Rentabilidad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full flex flex-col justify-end">
                    <div className="flex-1 flex items-end justify-between gap-1 overflow-x-auto pb-2 scrollbar-hide">
                      {data.evolution.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground italic text-sm">
                          Sin datos para este período
                        </div>
                      ) : (
                        data.evolution.map((item, idx) => {
                          const revenueHeight = (item.revenue / maxEvolutionValue) * 100;
                          const costHeight = (item.cost / maxEvolutionValue) * 100;
                          const profitHeight = (item.profit / maxEvolutionValue) * 100;

                          return (
                            <div key={idx} className="group relative flex flex-col items-center justify-end h-full min-w-[35px] flex-1 max-w-[70px]">
                              <div className="w-full flex justify-center gap-[1px] h-full items-end">
                                <div
                                  className="w-[30%] bg-primary/30 hover:bg-primary/50 rounded-t-sm transition-all"
                                  style={{ height: `${Math.max(revenueHeight, 1)}%` }}
                                />
                                <div
                                  className="w-[30%] bg-red-400/30 hover:bg-red-400/50 rounded-t-sm transition-all"
                                  style={{ height: `${Math.max(costHeight, 1)}%` }}
                                />
                                <div
                                  className="w-[40%] bg-emerald-500 rounded-t-sm transition-all relative z-10"
                                  style={{ height: `${Math.max(profitHeight, 1)}%` }}
                                />
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-16 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md z-20 whitespace-nowrap border font-mono">
                                <div className="text-muted-foreground">Ingreso: {formatARS(item.revenue)}</div>
                                <div className="text-red-500">Costo: {formatARS(item.cost)}</div>
                                <div className="text-emerald-600 font-bold">Ganancia: {formatARS(item.profit)}</div>
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-2 truncate w-full text-center">
                                {item.label}
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-primary/30 rounded-sm" />
                        <span className="text-xs text-muted-foreground font-medium">Ingresos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-red-400/30 rounded-sm" />
                        <span className="text-xs text-muted-foreground font-medium">Costos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                        <span className="text-xs text-muted-foreground font-medium">Ganancia</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Margen por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.categoryProfitability.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground italic text-sm">
                        Sin datos de ventas
                      </div>
                    ) : (
                      data.categoryProfitability.slice(0, 8).map((item) => (
                        <div key={item.id} className="space-y-1.5 group">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold tracking-tight uppercase truncate mr-2">{item.name}</span>
                            <span className="font-mono font-bold text-primary">
                              {item.margin.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                            <span>{formatARS(item.profit)} ganancia</span>
                            <span>{formatARS(item.revenue)} vta.</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                item.margin >= 30 ? "bg-emerald-500" : item.margin >= 15 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.min(Math.max(item.margin, 2), 100)}%` }}
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
                  <CardTitle className="text-lg font-medium">Productos Más Rentables</CardTitle>
                  <CardDescription>Ranking por ganancia bruta absoluta</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="p-3 font-medium text-foreground">Producto / Servicio</TableHead>
                          <TableHead className="text-right p-3 font-medium text-foreground">Ganancia</TableHead>
                          <TableHead className="text-right p-3 font-medium text-foreground">Margen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.topProfitableItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="p-8 text-center text-muted-foreground italic">
                              Sin operaciones registradas
                            </TableCell>
                          </TableRow>
                        ) : (
                          data.topProfitableItems.map((item, idx) => (
                            <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="p-3">
                                <div className="font-medium truncate max-w-[200px]">{item.name}</div>
                                <div className="text-[10px] text-muted-foreground">{item.quantity} unidades</div>
                              </TableCell>
                              <TableCell className="p-3 text-right font-mono font-bold text-emerald-700">
                                {formatARS(item.profit)}
                              </TableCell>
                              <TableCell className="p-3 text-right font-mono text-muted-foreground">
                                {item.margin.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Ganancia por Técnico
                  </CardTitle>
                  <CardDescription>Rentabilidad generada en taller</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.technicianProfitability.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground italic text-sm">
                        Sin técnicos con OTs finalizadas
                      </div>
                    ) : (
                      data.technicianProfitability.map((tech) => (
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
                                Margen: {tech.margin.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-bold text-emerald-600">
                              {formatARS(tech.profit)}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Ganancia</p>
                          </div>
                        </div>
                      ))
                    )}
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
