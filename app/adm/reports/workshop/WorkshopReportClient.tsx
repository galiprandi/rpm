"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/adm/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Wrench,
  CheckCircle2,
  Clock,
  User,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkshopReportData, type WorkshopGroupBy } from "@/lib/services/workshopReportService";

type Period =
  | "today"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "last12months"
  | "thisYear";

export default function WorkshopReportClient() {
  const [period, setPeriod] = useState<Period>("last7days");
  const [data, setData] = useState<WorkshopReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const getGroupByForPeriod = (p: Period): WorkshopGroupBy => {
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

    const response = await fetch(`/api/reports/workshop?${params.toString()}`);
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
    if (previous === 0 && current === 0) return "Sin datos en este período";
    if (previous === 0) return "Nuevo período con actividad";
    const value = Math.abs(change).toFixed(1);
    return `${change > 0 ? "+" : change < 0 ? "-" : ""}${value}% vs período anterior`;
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(0)}h`;
  };

  return (
    <div className="space-y-6">
      <Header
        title="Reporte de Taller & Operación"
        description="Métricas de eficiencia, estados de OTs y performance de técnicos."
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
                title="OTs Creadas"
                value={data.totalOrders.current.toString()}
                icon={Wrench}
                trend={{
                  value: formatChange(
                    data.totalOrders.change,
                    data.totalOrders.current,
                    data.totalOrders.previous,
                  ),
                  isPositive: data.totalOrders.change >= 0,
                }}
              />
              <MetricCard
                title="OTs Completadas"
                value={data.completedOrders.current.toString()}
                icon={CheckCircle2}
                trend={{
                  value: formatChange(
                    data.completedOrders.change,
                    data.completedOrders.current,
                    data.completedOrders.previous,
                  ),
                  isPositive: data.completedOrders.change >= 0,
                }}
              />
              <MetricCard
                title="Tiempo de Resolución"
                value={formatHours(data.avgResolutionTime.current)}
                icon={Clock}
                trend={{
                  value: formatChange(
                    -data.avgResolutionTime.change, // Negative change is positive for time
                    data.avgResolutionTime.current,
                    data.avgResolutionTime.previous,
                  ),
                  isPositive: data.avgResolutionTime.change <= 0,
                }}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Distribución por Estado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.statusDistribution.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground italic">
                        Sin datos para este período
                      </div>
                    ) : (
                      data.statusDistribution.map((item, idx) => {
                        const maxCount = Math.max(
                          ...data.statusDistribution.map((s) => s.count),
                          1,
                        );
                        const percentage = (item.count / maxCount) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-muted-foreground font-mono">
                                {item.count}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Performance de Técnicos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.technicianPerformance.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground italic">
                        Sin técnicos con actividad
                      </div>
                    ) : (
                      data.technicianPerformance.map((tech, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {tech.technicianName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tech.assignedCount} asignadas
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-600">
                              {tech.completedCount}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Completadas
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolución de OTs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="relative h-[280px] w-full flex items-end justify-center gap-1 overflow-y-hidden">
                    {data.evolution.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic">
                        Sin datos para este período
                      </div>
                    ) : (
                      <>
                        {data.evolution.map((item, idx) => {
                          const maxVal = Math.max(
                            ...data.evolution.map((e) =>
                              Math.max(e.created, e.completed),
                            ),
                            1,
                          );
                          const createdHeight = (item.created / maxVal) * 100;
                          const completedHeight =
                            (item.completed / maxVal) * 100;
                          return (
                            <div
                              key={idx}
                              className="group relative flex-1 h-full min-w-[30px] max-w-[80px] flex items-end justify-center gap-[2px]"
                            >
                              <div
                                className="w-1/2 bg-blue-500/80 hover:bg-blue-500 rounded-t-sm transition-all relative"
                                style={{
                                  height: `${Math.max(createdHeight, 2)}%`,
                                }}
                                title={`Creadas: ${item.created}`}
                              />
                              <div
                                className="w-1/2 bg-emerald-500/80 hover:bg-emerald-500 rounded-t-sm transition-all relative"
                                style={{
                                  height: `${Math.max(completedHeight, 2)}%`,
                                }}
                                title={`Completadas: ${item.completed}`}
                              />
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-10 font-mono flex flex-col gap-1 border">
                                <span className="text-blue-600">
                                  Creadas: {item.created}
                                </span>
                                <span className="text-emerald-600">
                                  Completadas: {item.completed}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                  {data.evolution.length > 0 && (
                    <div className="flex gap-1 mt-2 justify-center border-t pt-2">
                      {data.evolution.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex-1 min-w-[30px] max-w-[80px] text-[10px] text-muted-foreground text-center"
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-center gap-6 mt-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                      <span>Creadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                      <span>Completadas</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  );
}
