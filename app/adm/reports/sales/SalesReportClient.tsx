"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/adm/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatARS } from "@/lib/utils/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SalesReportData } from "@/lib/services/reportService";

type Period =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "thisYear";

export default function SalesReportClient() {
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const dates = getDatesForPeriod(period);
      const params = new URLSearchParams({
        startDate: dates.startDate.toISOString(),
        endDate: dates.endDate.toISOString(),
        comparisonStartDate: dates.comparisonStartDate.toISOString(),
        comparisonEndDate: dates.comparisonEndDate.toISOString(),
      });

      const response = await fetch(`/api/reports/sales?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch report");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
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
      case "yesterday":
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
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
      case "thisYear":
        startDate = new Date(now.getFullYear(), 0, 1);
        comparisonStartDate = new Date(now.getFullYear() - 1, 0, 1);
        comparisonEndDate = new Date(now.getFullYear() - 1, 11, 31);
        comparisonEndDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate, comparisonStartDate, comparisonEndDate };
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-3 w-3 mr-1" />;
    if (change < 0) return <ArrowDownRight className="h-3 w-3 mr-1" />;
    return null;
  };

  const formatChange = (change: number) => {
    const value = Math.abs(change).toFixed(1);
    return `${change > 0 ? "+" : change < 0 ? "-" : ""}${value}%`;
  };

  return (
    <div className="space-y-6">
      <Header
        title="Reporte de Ventas"
        description="Métricas y evolución de ingresos por ventas y taller."
        leftActions={
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
                <SelectItem value="yesterday">Ayer</SelectItem>
                <SelectItem value="last7days">Últimos 7 días</SelectItem>
                <SelectItem value="last30days">Últimos 30 días</SelectItem>
                <SelectItem value="thisMonth">Este mes</SelectItem>
                <SelectItem value="lastMonth">Mes pasado</SelectItem>
                <SelectItem value="thisYear">Este año</SelectItem>
              </SelectContent>
            </Select>
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
                  value: `${formatChange(data.totalSales.change)} vs período anterior`,
                  isPositive: data.totalSales.change >= 0,
                }}
              />
              <MetricCard
                title="Cantidad de Ventas"
                value={data.orderCount.current}
                icon={ShoppingCart}
                trend={{
                  value: `${formatChange(data.orderCount.change)} vs período anterior`,
                  isPositive: data.orderCount.change >= 0,
                }}
              />
              <MetricCard
                title="Ticket Promedio"
                value={formatARS(data.ticketAverage.current)}
                icon={BarChart3}
                trend={{
                  value: `${formatChange(data.ticketAverage.change)} vs período anterior`,
                  isPositive: data.ticketAverage.change >= 0,
                }}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolución Diaria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-[300px] w-full flex items-end gap-1 pt-8">
                  {data.evolution.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic">
                      Sin datos para este período
                    </div>
                  ) : (
                    <>
                      {data.evolution.map((item, idx) => {
                        const maxTotal = Math.max(
                          ...data.evolution.map((e) => e.total),
                          1,
                        );
                        const height = (item.total / maxTotal) * 100;
                        return (
                          <div
                            key={idx}
                            className="group relative flex-1 h-full flex flex-col items-center justify-end gap-2"
                          >
                            <div
                              className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-all relative"
                              style={{ height: `${Math.max(height, 2)}%` }}
                            >
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-10 font-mono">
                                {formatARS(item.total)}
                              </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground rotate-45 origin-left whitespace-nowrap mt-2">
                              {item.date.split("-").slice(1).join("/")}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Detalle por Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-3 font-medium">Fecha</th>
                        <th className="text-right p-3 font-medium">Ventas</th>
                        <th className="text-right p-3 font-medium">Cantidad</th>
                        <th className="text-right p-3 font-medium">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.evolution
                        .slice()
                        .reverse()
                        .map((item, idx) => (
                          <tr
                            key={idx}
                            className="border-b hover:bg-muted/30 transition-colors"
                          >
                            <td className="p-3 font-medium">{item.date}</td>
                            <td className="p-3 text-right font-mono">
                              {formatARS(item.total)}
                            </td>
                            <td className="p-3 text-right">{item.count}</td>
                            <td className="p-3 text-right font-mono">
                              {formatARS(
                                item.count > 0 ? item.total / item.count : 0,
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  );
}
