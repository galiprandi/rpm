"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/adm/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserPlus,
  RefreshCw,
  TrendingUp,
  Calendar,
  Trophy,
  Eye,
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
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { type CustomerReportData, type GroupBy } from "@/lib/services/customerReportService";
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

export default function CustomersReportClient() {
  const [period, setPeriod] = useState<Period>("last30days");
  const [data, setData] = useState<CustomerReportData | null>(null);
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

    const response = await fetch(`/api/reports/customers?${params.toString()}`);
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

  const formatChange = (change: number) => {
    const value = Math.abs(change).toFixed(1);
    return `${change > 0 ? "+" : change < 0 ? "-" : ""}${value}% vs período anterior`;
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = ["Cliente", "Facturación Total", "Cantidad Operaciones", "Última Operación"];
    const rows = data.topCustomers.map((c) => [
      c.name,
      c.totalBilling.toFixed(2),
      c.ordersCount,
      c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("es-AR") : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_clientes_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Header
          title="Reporte de Clientes"
          description="Análisis de adquisición, recurrencia y ranking de clientes."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20" />
              <CardContent className="h-16" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Header
        title="Reporte de Clientes"
        description="Análisis de adquisición, recurrencia y ranking de clientes."
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
              disabled={!data || data.topCustomers.length === 0}
              className="h-8 gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Clientes Nuevos"
          value={data.newCustomers.current}
          icon={UserPlus}
          trend={{
            value: formatChange(data.newCustomers.change),
            isPositive: data.newCustomers.change >= 0,
          }}
        />
        <MetricCard
          title="Clientes Activos"
          value={data.activeCustomers.current}
          icon={Users}
          trend={{
            value: formatChange(data.activeCustomers.change),
            isPositive: data.activeCustomers.change >= 0,
          }}
        />
        <MetricCard
          title="Tasa de Recurrencia"
          value={`${data.recurrenceRate.current.toFixed(1)}%`}
          icon={RefreshCw}
          trend={{
            value: formatChange(data.recurrenceRate.change),
            isPositive: data.recurrenceRate.change >= 0,
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolución de Clientes Nuevos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="relative h-[200px] w-full flex items-end justify-center gap-1 overflow-y-hidden">
              {data.evolution.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic">
                  Sin datos para este período
                </div>
              ) : (
                <>
                        {(() => {
                    const maxCount = Math.max(...data.evolution.map((e) => e.count), 1);
                          return data.evolution.map((item, idx) => {
                            const height = item.count > 0 ? Math.max((item.count / maxCount) * 100, 5) : 0;
                            return (
                        <div
                                key={idx}
                                className="group relative flex-1 h-full min-w-[20px] max-w-[60px] flex flex-col items-center justify-end"
                        >
                                <div
                                  className="w-full bg-primary/80 hover:bg-primary rounded-t-sm transition-all relative"
                                  style={{ height: `${height}%` }}
                                >
                                  <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-10 font-mono">
                                    {item.count} clientes
                                  </div>
                          </div>
                        </div>
                            );
                          });
                        })()}
                </>
              )}
            </div>
            <div className="flex gap-1 mt-1 justify-center">
              {data.evolution.map((item, idx) => (
                <div
                  key={idx}
                  className="flex-1 min-w-[20px] max-w-[60px] text-[10px] text-muted-foreground text-center"
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 10 Clientes por Facturación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="p-3 font-medium text-foreground">Cliente</TableHead>
                  <TableHead className="text-right p-3 font-medium text-foreground">Facturación</TableHead>
                  <TableHead className="text-right p-3 font-medium text-foreground">Operaciones</TableHead>
                  <TableHead className="text-right p-3 font-medium text-foreground">Última Op.</TableHead>
                  <TableHead className="text-right p-3 font-medium text-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-8 text-center text-muted-foreground italic">
                      No se encontraron operaciones en este período
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="p-3 font-medium">{customer.name}</TableCell>
                      <TableCell className="p-3 text-right font-mono text-emerald-700 font-semibold">
                        {formatARS(customer.totalBilling)}
                      </TableCell>
                      <TableCell className="p-3 text-right font-mono">
                        {customer.ordersCount}
                      </TableCell>
                      <TableCell className="p-3 text-right text-muted-foreground">
                        {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('es-AR') : '-'}
                      </TableCell>
                      <TableCell className="p-3 text-right">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`/adm/customers/${customer.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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
  );
}
