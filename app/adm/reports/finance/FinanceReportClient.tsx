"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/adm/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
} from "lucide-react";
import { formatARS } from "@/lib/utils/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FinanceReportData, type FinanceGroupBy } from "@/lib/services/financeReportService";
import { cn } from "@/lib/utils";

type Period =
  | "today"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "last12months"
  | "thisYear";

export default function FinanceReportClient() {
  const [period, setPeriod] = useState<Period>("last30days");
  const [data, setData] = useState<FinanceReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const getGroupByForPeriod = (p: Period): FinanceGroupBy => {
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

    const response = await fetch(`/api/reports/finance?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch report");
    return response.json();
  }, [period]);

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
    if (previous === 0 && current === 0) return "Sin movimientos";
    if (previous === 0) return "Nuevo período con actividad";
    const value = Math.abs(change).toFixed(1);
    return `${change > 0 ? "+" : change < 0 ? "-" : ""}${value}% vs período anterior`;
  };

  const maxEvolutionValue = useMemo(() => {
    if (!data) return 0;
    return Math.max(...data.evolution.map((e) => Math.max(e.income, e.expense)), 1);
  }, [data]);

  return (
    <div className="space-y-6">
      <Header
        title="Reporte de Finanzas & Flujo"
        description="Análisis de ingresos, egresos y rentabilidad operativa."
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
                <span>Actualizado en tiempo real</span>
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
                title="Ingresos Totales"
                value={formatARS(data.totalIncome.current)}
                icon={ArrowUpRight}
                trend={{
                  value: formatChange(
                    data.totalIncome.change,
                    data.totalIncome.current,
                    data.totalIncome.previous,
                  ),
                  isPositive: data.totalIncome.change >= 0,
                }}
              />
              <MetricCard
                title="Egresos Totales"
                value={formatARS(data.totalExpense.current)}
                icon={ArrowDownRight}
                trend={{
                  value: formatChange(
                    data.totalExpense.change,
                    data.totalExpense.current,
                    data.totalExpense.previous,
                  ),
                  isPositive: data.totalExpense.change <= 0,
                }}
              />
              <MetricCard
                title="Flujo Neto"
                value={formatARS(data.netFlow.current)}
                icon={Wallet}
                trend={{
                  value: formatChange(
                    data.netFlow.change,
                    data.netFlow.current,
                    data.netFlow.previous,
                  ),
                  isPositive: data.netFlow.change >= 0,
                }}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Evolución de Caja
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full flex flex-col justify-end">
                    <div className="flex-1 flex items-end justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {data.evolution.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground italic text-sm">
                          Sin datos para este período
                        </div>
                      ) : (
                        data.evolution.map((item, idx) => {
                          const incomeHeight = (item.income / maxEvolutionValue) * 100;
                          const expenseHeight = (item.expense / maxEvolutionValue) * 100;
                          return (
                            <div key={idx} className="group relative flex flex-col items-center justify-end h-full min-w-[30px] flex-1 max-w-[60px]">
                              <div className="w-full flex justify-center gap-0.5 h-full items-end">
                                <div
                                  className="w-1/2 bg-emerald-500/80 hover:bg-emerald-500 rounded-t-sm transition-all"
                                  style={{ height: `${Math.max(incomeHeight, 1)}%` }}
                                />
                                <div
                                  className="w-1/2 bg-red-500/80 hover:bg-red-500 rounded-t-sm transition-all"
                                  style={{ height: `${Math.max(expenseHeight, 1)}%` }}
                                />
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md z-10 whitespace-nowrap border">
                                <div className="text-emerald-600 font-bold">Ingreso: {formatARS(item.income)}</div>
                                <div className="text-red-600 font-bold">Egreso: {formatARS(item.expense)}</div>
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
                        <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                        <span className="text-xs text-muted-foreground font-medium">Ingresos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-red-500 rounded-sm" />
                        <span className="text-xs text-muted-foreground font-medium">Egresos</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Por Medio de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.methodDistribution.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground italic text-sm">
                        Sin actividad de pago
                      </div>
                    ) : (
                      data.methodDistribution.map((item) => (
                        <div key={item.method} className="space-y-1.5 group">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold tracking-tight uppercase">{item.method}</span>
                            <span className={cn(
                              "font-mono font-bold",
                              item.net >= 0 ? "text-emerald-700" : "text-red-700"
                            )}>
                              {formatARS(item.net)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                            <span className="text-emerald-600">+{formatARS(item.income)}</span>
                            <span className="text-red-600">-{formatARS(item.expense)}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                item.net >= 0 ? "bg-emerald-500" : "bg-red-500"
                              )}
                              style={{
                                width: `${Math.min(Math.max((Math.abs(item.net) / Math.max(data.totalIncome.current, data.totalExpense.current)) * 100, 5), 100)}%`
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Detalle del Flujo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-3 font-medium">Período</th>
                        <th className="text-right p-3 font-medium">Ingresos</th>
                        <th className="text-right p-3 font-medium">Egresos</th>
                        <th className="text-right p-3 font-medium">Flujo Neto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.evolution.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                            No se encontraron movimientos
                          </td>
                        </tr>
                      ) : (
                        data.evolution.slice().reverse().map((item, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-medium">{item.label}</td>
                            <td className="p-3 text-right font-mono text-emerald-700">
                              {formatARS(item.income)}
                            </td>
                            <td className="p-3 text-right font-mono text-red-700">
                              {formatARS(item.expense)}
                            </td>
                            <td className={cn(
                              "p-3 text-right font-mono font-bold",
                              (item.income - item.expense) >= 0 ? "text-emerald-800" : "text-red-800"
                            )}>
                              {formatARS(item.income - item.expense)}
                            </td>
                          </tr>
                        ))
                      )}
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
