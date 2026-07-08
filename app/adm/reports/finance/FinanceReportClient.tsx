"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/adm/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Clock,
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
  const [period, setPeriod] = useState<Period>("last7days");
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

    const response = await fetch(`/api/reports/finance?${params.toString()}`);
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
    if (previous === 0 && current === 0) return "Sin movimientos";
    if (previous === 0) return "Nuevo período con actividad";
    const value = Math.abs(change).toFixed(1);
    return `${change > 0 ? "+" : change < 0 ? "-" : ""}${value}% vs período anterior`;
  };

  return (
    <div className="space-y-6">
      <Header
        title="Finanzas & Flujo"
        description="Análisis de ingresos, egresos y medios de pago."
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
                <span>Delay de hasta 10 min</span>
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
                icon={ArrowUpCircle}
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
                value={formatARS(data.totalExpenses.current)}
                icon={ArrowDownCircle}
                trend={{
                  value: formatChange(
                    data.totalExpenses.change,
                    data.totalExpenses.current,
                    data.totalExpenses.previous,
                  ),
                  isPositive: data.totalExpenses.change <= 0, // Negative change in expenses is good
                }}
              />
              <MetricCard
                title="Flujo Neto"
                value={formatARS(data.netFlow.current)}
                icon={DollarSign}
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolución: Ingresos vs Egresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="relative h-[300px] w-full flex items-end justify-center gap-2 min-w-[600px] pb-6">
                    {data.evolution.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic">
                        Sin datos para este período
                      </div>
                    ) : (
                      <>
                        {data.evolution.map((item, idx) => {
                          const maxVal = Math.max(
                            ...data.evolution.flatMap((e) => [e.income, e.expenses]),
                            1,
                          );
                          const incomeHeight = (item.income / maxVal) * 100;
                          const expenseHeight = (item.expenses / maxVal) * 100;

                          return (
                            <div
                              key={idx}
                              className="group relative flex-1 flex flex-col items-center justify-end h-full max-w-[80px]"
                            >
                              <div className="flex items-end gap-1 w-full h-full">
                                <div
                                  className="flex-1 bg-emerald-500/80 hover:bg-emerald-500 rounded-t-sm transition-all relative group/income"
                                  style={{ height: `${Math.max(incomeHeight, 1)}%` }}
                                >
                                  <div className="opacity-0 group-hover/income:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-20 font-mono">
                                    In: {formatARS(item.income)}
                                  </div>
                                </div>
                                <div
                                  className="flex-1 bg-red-500/80 hover:bg-red-500 rounded-t-sm transition-all relative group/expense"
                                  style={{ height: `${Math.max(expenseHeight, 1)}%` }}
                                >
                                  <div className="opacity-0 group-hover/expense:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-20 font-mono">
                                    Out: {formatARS(item.expenses)}
                                  </div>
                                </div>
                              </div>
                              <div className="absolute -bottom-6 text-[10px] text-muted-foreground text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                {item.label}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                    <span>Ingresos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-sm" />
                    <span>Egresos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Desglose por Medio de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium">Medio</th>
                          <th className="text-right p-3 font-medium text-emerald-700">Ingresos (+)</th>
                          <th className="text-right p-3 font-medium text-red-700">Egresos (-)</th>
                          <th className="text-right p-3 font-medium">Flujo Neto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.methodBreakdown.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                              No hay movimientos registrados
                            </td>
                          </tr>
                        ) : (
                          data.methodBreakdown.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-semibold uppercase tracking-wider text-xs">{item.method}</td>
                              <td className="p-3 text-right font-mono text-emerald-600">
                                {formatARS(item.income)}
                              </td>
                              <td className="p-3 text-right font-mono text-red-600">
                                {formatARS(item.expenses)}
                              </td>
                              <td className={cn(
                                "p-3 text-right font-mono font-bold",
                                item.net > 0 ? "text-emerald-700" : item.net < 0 ? "text-red-700" : ""
                              )}>
                                {formatARS(item.net)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
