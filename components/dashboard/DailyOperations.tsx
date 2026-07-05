"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { formatARS } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  RefreshCw,
  Eye,
  TrendingUp,
  TrendingDown,
  Scale,
  Package,
  LucideIcon,
  User,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Header, CrudStats } from "@/components/adm";

interface DailyOperationsData {
  movements: Array<{
    id: string;
    type:
      | "INCOME"
      | "EXPENSE"
      | "OPENING"
      | "CLOSING"
      | "ADJUSTMENT"
      | "PURCHASE_VOUCHER";
    amount: number;
    method: string;
    methodName: string;
    referenceId?: string;
    referenceType?: string;
    reason?: string;
    createdAt: string;
    customer?: { id: string; name: string };
    relatedId?: string;
    relatedType?: "work_order" | "direct_sale";
  }>;
  summary: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
  };
}

export function DailyOperations() {
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    });
  });
  const [data, setData] = useState<DailyOperationsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOperations = useCallback(async (targetDate: string) => {
    setLoading(true);
    try {
      // Send plain YYYY-MM-DD date string; backend handles timezone conversion
      const response = await fetch(
        `/api/dashboard/operations?date=${encodeURIComponent(targetDate)}`,
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching operations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOperations(date);
    }, 0);
    return () => clearTimeout(timer);
  }, [date, fetchOperations]);

  const columns: ColumnDef<DailyOperationsData["movements"][0]>[] = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "Hora",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {new Date(row.original.createdAt).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Operación",
        cell: ({ row }) => {
          const type = row.original.type;
          const labels: Record<string, string> = {
            INCOME: "Ingreso",
            EXPENSE: "Egreso",
            OPENING: "Apertura",
            CLOSING: "Cierre",
            ADJUSTMENT: "Ajuste",
            PURCHASE_VOUCHER: "Compra",
          };

          const icons: Record<string, LucideIcon> = {
            INCOME: ArrowUpCircle,
            EXPENSE: ArrowDownCircle,
            OPENING: DollarSign,
            CLOSING: DollarSign,
            ADJUSTMENT: RefreshCw,
            PURCHASE_VOUCHER: Package,
          };

          const Icon = icons[type] || DollarSign;

          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center">
                <Icon
                  className="h-4 w-4 text-primary pointer-events-none"
                  aria-hidden="true"
                />
              </div>
              <span className="font-semibold tracking-tight">
                {labels[type] || type}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "customer.name",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
              <User
                className="h-4 w-4 text-primary pointer-events-none"
                aria-hidden="true"
              />
            </div>
            <div className="font-semibold tracking-tight">
              {row.original.customer?.name || "-"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "reason",
        header: "Referencia",
        cell: ({ row }) => {
          const reason = row.original.reason;
          if (!reason) return "-";
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="max-w-[200px] truncate cursor-help">
                  {reason}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {reason}
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        accessorKey: "methodName",
        header: "Método",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.methodName}</span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Monto",
        cell: ({ row }) => {
          const amount = row.original.amount;
          const isExpense =
            row.original.type === "EXPENSE" ||
            row.original.type === "PURCHASE_VOUCHER";
          return (
            <span
              className={cn(
                "font-mono font-medium",
                isExpense ? "text-red-700" : "text-emerald-700",
              )}
            >
              {isExpense ? "-" : "+"}
              {formatARS(amount)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          const { relatedId, relatedType } = row.original;
          if (!relatedId || !relatedType) return null;

          const href =
            relatedType === "work_order"
              ? `/adm/work-orders/${relatedId}`
              : `/adm/customers?id=${relatedId}`;

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Link href={href} aria-label="Ver detalle de la operación">
                    <Eye
                      className="h-4 w-4 pointer-events-none"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Ver detalle</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver detalle</TooltipContent>
            </Tooltip>
          );
        },
      },
    ],
    [],
  );

  const stats = useMemo(
    () => [
      {
        label: "Ingresos",
        value: formatARS(data?.summary.totalIncome || 0),
        icon: TrendingUp,
        iconColor: "#047857", // emerald-700
      },
      {
        label: "Egresos",
        value: formatARS(data?.summary.totalExpense || 0),
        icon: TrendingDown,
        iconColor: "#b91c1c", // red-700
      },
      {
        label: "Balance Neto",
        value: formatARS(data?.summary.netAmount || 0),
        icon: Scale,
        iconColor: (data?.summary.netAmount || 0) >= 0 ? "#1d4ed8" : "#b91c1c", // blue-700 or red-700
      },
    ],
    [data],
  );

  return (
    <div className="space-y-6">
      <Header
        title="Operaciones Diarias"
        description="Seguimiento de movimientos de caja y ventas"
        leftActions={
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1 shadow-sm h-9">
            <Calendar
              className="h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-0 focus-visible:ring-0 h-7 w-32 bg-transparent p-0 text-sm font-mono"
              aria-label="Seleccionar fecha de operaciones"
            />
          </div>
        }
        secondaryActions={[
          {
            label: "Actualizar",
            onClick: () => fetchOperations(date),
            icon: RefreshCw,
            loading: loading,
          },
        ]}
      />

      <CrudStats stats={stats} />

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={data?.movements || []}
            pageSize={50}
          />
        </CardContent>
      </Card>
    </div>
  );
}
