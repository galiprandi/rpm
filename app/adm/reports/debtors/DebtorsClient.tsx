"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUI } from "@/components/ui/UIProvider";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Header, CrudStats } from "@/components/adm";
import {
  TrendingDown,
  Users,
  Receipt,
  DollarSign,
  Phone,
  Eye,
  Clock,
  User,
  MessageSquare,
  Download,
  ArrowDownLeft,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getWhatsAppLink, getDebtReminderMessage } from "@/lib/utils/whatsapp";
import { formatARS, relativeTime } from "@/lib/utils/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Debtor {
  customerId: string;
  customerName: string;
  phone: string | null;
  phoneAlt: string | null;
  email: string | null;
  balance: number;
  workOrderDebt: number;
  directSaleDebt: number;
  creditNoteCredit: number;
  workOrderCount: number;
  directSaleCount: number;
  oldestDebtDate: string | null;
  pendingWorkOrdersTotal: number;
  vehicles: string[];
  recentWorkOrders: Array<{
    id: string;
    createdAt: string;
    total: number;
    status: string;
  }>;
}

interface Summary {
  totalDebt: number;
  totalCustomers: number;
  totalWorkOrders: number;
  totalDirectSales: number;
  averageDebt: number;
}

export default function DebtorsClient() {
  const { alert } = useUI();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"amount" | "oldest" | "newest">(
    "amount",
  );

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const fetchDebtors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/debtors?sortBy=${sortBy}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setDebtors(data.debtors || []);
        setSummary(data.summary || null);
      } else {
        const error = await res.json();
        await alert({
          title: "Error",
          description: error.error || "No se pudo cargar el reporte",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching debtors:", error);
      await alert({
        title: "Error",
        description: "Error al cargar el reporte de deudores",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [sortBy, alert]);

  useEffect(() => {
    fetchDebtors();
  }, [fetchDebtors]);

  const handlePaymentSubmit = async () => {
    if (isSubmittingPayment || !selectedDebtor) return;

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      await alert({
        title: "Error",
        description: "Ingrese un monto válido",
        variant: "error",
      });
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await fetch(
        `/api/customers/${selectedDebtor.customerId}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            method: paymentMethod,
            notes: paymentNotes,
          }),
        },
      );

      if (res.ok) {
        setIsPaymentModalOpen(false);
        setPaymentAmount("");
        setPaymentNotes("");
        setSelectedDebtor(null);
        await fetchDebtors(); // Refresh report data
        await alert({
          title: "Pago registrado",
          description: "El pago se ha registrado correctamente",
          variant: "success",
        });
      } else {
        const error = await res.json();
        await alert({
          title: "Error",
          description: error.error || "Error al registrar pago",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      await alert({
        title: "Error",
        description: "Error al registrar pago",
        variant: "error",
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-AR");
  };

  const getDaysSince = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const exportToCSV = () => {
    if (!debtors || debtors.length === 0) return;

    const headers = [
      "Cliente",
      "Teléfono",
      "Email",
      "Deuda Total",
      "Deuda OT",
      "Deuda VD",
      "NC Crédito",
      "# OTs",
      "# VD",
      "Antigüedad de Deuda",
      "Fecha Deuda Antigua",
      "Vehículos",
    ];

    const rows = debtors.map((debtor) => [
      debtor.customerName,
      debtor.phone || debtor.phoneAlt || "",
      debtor.email || "",
      debtor.balance.toFixed(2),
      (debtor.workOrderDebt || 0).toFixed(2),
      (debtor.directSaleDebt || 0).toFixed(2),
      (debtor.creditNoteCredit || 0).toFixed(2),
      debtor.workOrderCount.toString(),
      (debtor.directSaleCount || 0).toString(),
      debtor.oldestDebtDate
        ? `${getDaysSince(debtor.oldestDebtDate)} de antigüedad`
        : "-",
      debtor.oldestDebtDate
        ? new Date(debtor.oldestDebtDate).toLocaleDateString("es-AR")
        : "-",
      debtor.vehicles.join(" | "),
    ]);

    const csvContent =
      "\ufeff" +
      [
        headers.join(","),
        ...rows.map((r) =>
          r.map((field) => `"${field.replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte_deudores_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = summary
    ? [
        {
          label: "Deuda Total",
          value: formatARS(summary.totalDebt),
          icon: TrendingDown,
          iconColor: "#ef4444", // red-500
        },
        {
          label: "Clientes Deudores",
          value: summary.totalCustomers,
          icon: Users,
          iconColor: "#3b82f6", // blue-500
        },
        {
          label: "OTs Impagas",
          value: summary.totalWorkOrders,
          icon: Receipt,
          iconColor: "#f59e0b", // amber-500
        },
        {
          label: "Ventas Directas",
          value: summary.totalDirectSales || 0,
          icon: ShoppingCart,
          iconColor: "#0891b2", // cyan-600
        },
        {
          label: "Deuda Promedio",
          value: formatARS(summary.averageDebt),
          icon: DollarSign,
          iconColor: "#9333ea", // purple-600
        },
      ]
    : [];

  const columns: ColumnDef<Debtor>[] = useMemo(
    () => [
      {
        accessorKey: "customerName",
        header: "Cliente",
        cell: ({ row }) => {
          const debtor = row.original;
          const contactPhone = debtor.phone || debtor.phoneAlt;
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center">
                <User
                  className="h-4 w-4 text-primary pointer-events-none"
                  aria-hidden="true"
                />
              </div>
              <div>
                <div className="font-semibold tracking-tight">
                  {debtor.customerName}
                </div>
                {contactPhone && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                    <Phone
                      className="h-3 w-3 pointer-events-none"
                      aria-hidden="true"
                    />
                    {contactPhone}
                    {debtor.phoneAlt && !debtor.phone && (
                      <span className="text-[10px] ml-1 opacity-70">(alt)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "vehicles",
        header: "Vehículos",
        cell: ({ row }) => {
          const vehicles = row.original.vehicles;
          if (!vehicles.length) return "-";
          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {vehicles.slice(0, 2).map((plate) => (
                <Badge
                  key={plate}
                  variant="outline"
                  className="font-mono text-[10px] px-1 py-0 h-4 bg-muted/50"
                >
                  {plate}
                </Badge>
              ))}
              {vehicles.length > 2 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                  +{vehicles.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "workOrderCount",
        header: "# OTs",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-xs">
            {row.original.workOrderCount}
          </Badge>
        ),
      },
      {
        accessorKey: "directSaleCount",
        header: "# VD",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.directSaleCount || 0}
          </Badge>
        ),
      },
      {
        accessorKey: "workOrderDebt",
        header: "Deuda OT",
        cell: ({ row }) => {
          const debt = row.original.workOrderDebt || 0;
          if (debt === 0)
            return <span className="text-muted-foreground">-</span>;
          return (
            <span className="font-mono text-sm text-red-600">
              {formatARS(debt)}
            </span>
          );
        },
      },
      {
        accessorKey: "directSaleDebt",
        header: "Deuda VD",
        cell: ({ row }) => {
          const debt = row.original.directSaleDebt || 0;
          if (debt === 0)
            return <span className="text-muted-foreground">-</span>;
          return (
            <span className="font-mono text-sm text-red-600">
              {formatARS(debt)}
            </span>
          );
        },
      },
      {
        accessorKey: "creditNoteCredit",
        header: "NC Crédito",
        cell: ({ row }) => {
          const credit = row.original.creditNoteCredit || 0;
          if (credit === 0)
            return <span className="text-muted-foreground">-</span>;
          return (
            <span className="font-mono text-sm text-emerald-600">
              -{formatARS(credit)}
            </span>
          );
        },
      },
      {
        accessorKey: "balance",
        header: "Deuda Total",
        cell: ({ row }) => {
          const date = row.original.oldestDebtDate;
          const daysSince = getDaysSince(date);
          const isVeryOld = daysSince !== null && daysSince > 30;

          return (
            <div
              className={cn(
                "font-mono font-semibold px-2 py-1 rounded-md inline-block",
                isVeryOld
                  ? "text-red-700 bg-red-50 border border-red-100"
                  : "text-red-600",
              )}
            >
              {formatARS(row.original.balance)}
            </div>
          );
        },
      },
      {
        accessorKey: "oldestDebtDate",
        header: "Deuda Más Antigua",
        cell: ({ row }) => {
          const date = row.original.oldestDebtDate;
          const daysSince = getDaysSince(date);
          return (
            <div className="space-y-1">
              <div className="text-sm flex items-center gap-1.5 font-mono">
                <Clock
                  className="h-3.5 w-3.5 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                {date ? relativeTime(date) : "-"}
              </div>
              {daysSince && (
                <div
                  className={cn(
                    "text-xs font-medium",
                    daysSince > 30 ? "text-red-600" : "text-muted-foreground",
                  )}
                >
                  {formatDate(date)} ({daysSince} días)
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const debtor = row.original;
          const whatsappPhone = debtor.phone || debtor.phoneAlt;
          return (
            <div className="flex items-center justify-end gap-1">
              {whatsappPhone && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                    >
                      <a
                        href={getWhatsAppLink(
                          whatsappPhone,
                          getDebtReminderMessage(
                            debtor.customerName,
                            debtor.balance,
                          ),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Notificar deuda por WhatsApp"
                      >
                        <MessageSquare
                          className="h-4 w-4 pointer-events-none"
                          aria-hidden="true"
                        />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notificar deuda</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      setSelectedDebtor(debtor);
                      setPaymentAmount(debtor.balance.toString());
                      setPaymentNotes(
                        `Pago registrado desde Reporte de Deudores`,
                      );
                      setPaymentMethod("CASH");
                      setIsPaymentModalOpen(true);
                    }}
                    aria-label="Registrar Pago de este cliente"
                  >
                    <ArrowDownLeft
                      className="h-4 w-4 pointer-events-none"
                      aria-hidden="true"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Registrar Pago</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Link
                      href={`/adm/customers/${debtor.customerId}`}
                      aria-label="Ver cliente"
                    >
                      <Eye
                        className="h-4 w-4 pointer-events-none"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Ver cliente</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver cliente</TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [
      setSelectedDebtor,
      setPaymentAmount,
      setPaymentNotes,
      setPaymentMethod,
      setIsPaymentModalOpen,
    ],
  );

  return (
    <div className="space-y-6">
      <Header
        title="Reporte de Deudores"
        description="Clientes con saldo pendiente de pago"
        secondaryActions={[
          {
            label: "Exportar CSV",
            onClick: exportToCSV,
            disabled: loading || debtors.length === 0,
            icon: Download,
            variant: "outline" as const,
          },
        ]}
        leftActions={
          <div key="sort-select" className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ordenar por:</span>
            <Select
              value={sortBy}
              onValueChange={(v) =>
                setSortBy(v as "amount" | "oldest" | "newest")
              }
            >
              <SelectTrigger className="w-44 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">Mayor Deuda</SelectItem>
                <SelectItem value="oldest">Más Antiguo</SelectItem>
                <SelectItem value="newest">Más Reciente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <CrudStats stats={stats} />

      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={debtors}
            pageSize={50}
            emptyMessage={
              loading
                ? "Cargando reporte..."
                : "No hay clientes con deuda pendiente"
            }
          />
        </CardContent>
      </Card>

      {/* Modal de Pago */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Cliente: {selectedDebtor?.customerName}
              <br />
              Deuda pendiente:{" "}
              {selectedDebtor && formatARS(selectedDebtor.balance, 2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="payment-amount">Monto a Abonar *</Label>
                {selectedDebtor && selectedDebtor.balance > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() =>
                      setPaymentAmount(selectedDebtor.balance.toString())
                    }
                  >
                    Saldar total
                  </Button>
                )}
              </div>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={selectedDebtor?.balance}
                placeholder="Ej: 5000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="font-mono"
                aria-required="true"
              />
              {selectedDebtor && selectedDebtor.balance > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo: {formatARS(selectedDebtor.balance, 2)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="payment-method">Método de Pago *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Seleccione método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="CARD">Tarjeta</SelectItem>
                  <SelectItem value="CHECK">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment-notes">Notas (opcional)</Label>
              <Input
                id="payment-notes"
                placeholder="Referencia, comprobante, etc."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsPaymentModalOpen(false);
                setPaymentAmount("");
                setPaymentNotes("");
                setSelectedDebtor(null);
              }}
              disabled={isSubmittingPayment}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePaymentSubmit}
              disabled={isSubmittingPayment || !paymentAmount}
            >
              {isSubmittingPayment ? "Procesando..." : "Confirmar Pago"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
