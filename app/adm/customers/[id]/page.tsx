"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  Car,
  Wrench,
  Pencil,
  Eye,
  Wallet,
  ArrowDownLeft,
  Receipt,
  MessageSquare,
  Tag,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/adm/Header";
import { formatARS } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { VehicleDialog } from "@/components/vehicles/VehicleDialog";
import { getWhatsAppLink, getDebtReminderMessage } from "@/lib/utils/whatsapp";
import { CustomerCreditNoteDialog } from "@/components/credit-notes/CustomerCreditNoteDialog";

interface Vehicle {
  id: string;
  identifier: string;
  category: string;
  make?: { name: string };
  model?: { name: string };
  year?: number;
}

interface WorkOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  vehicle: { identifier: string };
}

interface DirectSale {
  id: string;
  total: number;
  createdAt: string;
  customerName: string;
  items: Array<{ name: string; quantity: number }>;
}

interface CreditNote {
  id: string;
  total: number;
  createdAt: string;
  status: string;
  items: Array<{ name: string; quantity: number }>;
}

type TransactionType = "DIRECT_SALE" | "CREDIT_NOTE" | "INVOICE" | "PAYMENT";

interface Transaction {
  id: string;
  type: TransactionType;
  total: number;
  createdAt: string;
  items?: Array<{ name: string; quantity: number }>;
  status?: string;
  method?: string;
  notes?: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  phone?: string;
  phoneAlt?: string;
  email?: string;
  address?: string;
  notes?: string;
  billingData?: {
    cuit: string;
    invoiceType: string;
  };
  createdAt: string;
  balance: number;
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
  directSales: DirectSale[];
  creditNotes: CreditNote[];
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    notes?: string;
    createdAt: string;
  }>;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");

  const handleOpenPaymentForWO = (total: number, id: string) => {
    setPaymentAmount(total.toString());
    setPaymentNotes(`Pago OT #${id.slice(-6).toUpperCase()}`);
    setIsPaymentModalOpen(true);
  };

  const [vehicleFilter, setVehicleFilter] = useState("");
  const [workOrderFilter, setWorkOrderFilter] = useState("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [preselectedSaleId, setPreselectedSaleId] = useState<
    string | undefined
  >(undefined);


  const fetchCustomer = useCallback(async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setCustomer(data);
    } catch (error) {
      console.error("Error fetching customer:", error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      CONFIRMED: { color: "bg-blue-100 text-blue-800", label: "Confirmada" },
      WAITING: { color: "bg-yellow-100 text-yellow-800", label: "Esperando" },
      IN_PROGRESS: {
        color: "bg-orange-100 text-orange-800",
        label: "En Progreso",
      },
      QC_CHECK: {
        color: "bg-purple-100 text-purple-800",
        label: "Control de Calidad",
      },
      READY: { color: "bg-green-100 text-green-800", label: "Lista" },
      PAID: { color: "bg-emerald-100 text-emerald-800", label: "Pagada" },
      DELIVERED: { color: "bg-gray-100 text-gray-800", label: "Entregada" },
    };
    const config = statusConfig[status] || {
      color: "bg-gray-100",
      label: status,
    };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Columnas para DataTable de vehículos
  const vehicleColumns: ColumnDef<Vehicle>[] = useMemo(
    () => [
      {
        accessorKey: "identifier",
        header: "Vehículo",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
              <Car
                className="h-4 w-4 text-primary pointer-events-none"
                aria-hidden="true"
              />
            </div>
            <span className="font-semibold font-mono tracking-tight">
              {row.original.identifier}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "make.name",
        header: "Marca/Modelo",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.make?.name} {row.original.model?.name}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">
              {row.original.category}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "year",
        header: "Año",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.year || "-"}</span>
        ),
      },
      {
        id: "actions_quick",
        header: "",
        cell: ({ row }) => (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            title="Nueva Orden para este vehículo"
          >
            <Link
              href={`/adm/work-orders/new?customerId=${customerId}&vehicleId=${row.original.id}`}
            >
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        ),
      },
    ],
    [customerId],
  );

  // Columnas para DataTable de OTs
  const workOrderColumns: ColumnDef<WorkOrder>[] = useMemo(
    () => [
      {
        accessorKey: "vehicle.identifier",
        header: "Vehículo",
        cell: ({ row }) => row.original.vehicle.identifier,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-mono font-semibold">
            {formatARS(Number(row.original.total), 2)}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString("es-AR"),
      },
    ],
    [],
  );

  // Combinar ventas directas y notas de crédito en transacciones unificadas
  const transactions: Transaction[] = useMemo(() => {
    if (!customer) return [];

    const sales: Transaction[] = customer.directSales.map((sale) => ({
      id: sale.id,
      type: "DIRECT_SALE" as TransactionType,
      total: sale.total,
      createdAt: sale.createdAt,
      items: sale.items,
    }));

    const creditNotes: Transaction[] = customer.creditNotes.map((cn) => ({
      id: cn.id,
      type: "CREDIT_NOTE" as TransactionType,
      total: cn.total,
      createdAt: cn.createdAt,
      items: cn.items,
      status: cn.status,
    }));

    const payments: Transaction[] = customer.payments.map((p) => ({
      id: p.id,
      type: "PAYMENT" as TransactionType,
      total: p.amount,
      createdAt: p.createdAt,
      method: p.method,
      notes: p.notes,
    }));

    // Combinar y ordenar por fecha (más reciente primero)
    return [...sales, ...creditNotes, ...payments].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [customer]);

  // Columnas para DataTable de Transacciones
  const transactionColumns: ColumnDef<Transaction>[] = useMemo(
    () => [
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => {
          const type = row.original.type;
          const typeConfig: Record<
            TransactionType,
            { label: string; color: string; icon: React.ElementType }
          > = {
            DIRECT_SALE: {
              label: "Venta",
              color: "bg-blue-100 text-blue-800",
              icon: Tag,
            },
            CREDIT_NOTE: {
              label: "NC",
              color: "bg-orange-100 text-orange-800",
              icon: Receipt,
            },
            INVOICE: {
              label: "Factura",
              color: "bg-green-100 text-green-800",
              icon: FileText,
            },
            PAYMENT: {
              label: "Pago",
              color: "bg-emerald-100 text-emerald-800",
              icon: ArrowDownLeft,
            },
          };
          const config = typeConfig[type];
          const Icon = config.icon;
          return (
            <Badge className={cn("gap-1 px-2", config.color)}>
              <Icon className="h-3 w-3" aria-hidden="true" />
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => row.original.id.slice(-6),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.original.status;
          if (!status) return <span className="text-muted-foreground">-</span>;
          const statusConfig: Record<string, { label: string; color: string }> =
            {
              ISSUED: {
                label: "Emitida",
                color: "bg-green-100 text-green-800",
              },
              CANCELLED: {
                label: "Cancelada",
                color: "bg-red-100 text-red-800",
              },
            };
          const config = statusConfig[status] || {
            label: status,
            color: "bg-gray-100 text-gray-800",
          };
          return <Badge className={config.color}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: "items",
        header: "Concepto / Items",
        cell: ({ row }) => {
          if (row.original.type === "PAYMENT") {
            return (
              <div className="flex flex-col">
                <span className="font-medium text-emerald-700">
                  Pago Recibido ({row.original.method})
                </span>
                {row.original.notes && (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {row.original.notes}
                  </span>
                )}
              </div>
            );
          }
          return (
            row.original.items
              ?.map((i: { name: string }) => i.name)
              .join(", ") || "-"
          );
        },
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => {
          const total = Number(row.original.total);
          const isCreditNote = row.original.type === "CREDIT_NOTE";
          const isPayment = row.original.type === "PAYMENT";
          return (
            <span
              className={cn(
                "font-mono font-semibold",
                isCreditNote ? "text-orange-700" : "",
                isPayment ? "text-emerald-700" : "",
              )}
            >
              {isCreditNote ? "-" : ""}
              {formatARS(total, 2)}
            </span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString("es-AR"),
      },
    ],
    [],
  );

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Cargando...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Cliente no encontrado</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header con componente estandar */}
      <Header
        title={customer.name}
        description={`Cliente desde ${new Date(customer.createdAt).toLocaleDateString("es-AR")}${customer.billingData ? ` • Factura ${customer.billingData.invoiceType} (CUIT: ${customer.billingData.cuit})` : ""}`}
        showBackButton
        onBack={() => router.push('/adm/customers')}
        primaryAction={{
          label: "Editar",
          onClick: () => setIsEditModalOpen(true),
          icon: Pencil,
        }}
        secondaryActions={[
          {
            label: "Nota de Crédito",
            onClick: () => setIsCreditNoteModalOpen(true),
            icon: Receipt,
            variant: "outline",
          },
          {
            label: "Vehículo",
            onClick: () => setIsVehicleModalOpen(true),
            icon: Plus,
            variant: "outline",
          },
        ]}
      >
        {/* Contactos clickeables */}
        <div className="flex flex-wrap gap-4 mt-2">
          {customer.phone && (
            <div className="flex items-center gap-2">
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-1 text-sm hover:underline text-primary font-mono"
              >
                <Phone className="h-4 w-4" /> {customer.phone}
              </a>
              <a
                href={getWhatsAppLink(customer.phone, `Hola ${customer.name}!`)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-md hover:bg-emerald-50 text-emerald-700 transition-colors"
                title="Enviar WhatsApp"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
            </div>
          )}
          {customer.phoneAlt && (
            <div className="flex items-center gap-2">
              <a
                href={`tel:${customer.phoneAlt}`}
                className="flex items-center gap-1 text-sm hover:underline text-primary font-mono"
              >
                <Phone className="h-4 w-4" /> {customer.phoneAlt} (alt)
              </a>
              <a
                href={getWhatsAppLink(
                  customer.phoneAlt,
                  `Hola ${customer.name}!`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-md hover:bg-emerald-50 text-emerald-700 transition-colors"
                title="Enviar WhatsApp"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
            </div>
          )}
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-1 text-sm hover:underline text-primary"
            >
              <Mail className="h-4 w-4" /> {customer.email}
            </a>
          )}
          {customer.address && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(customer.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm hover:underline text-primary"
            >
              <MapPin className="h-4 w-4" /> {customer.address}
            </a>
          )}
        </div>
      </Header>

      {/* Cuenta Corriente - Solo visible si hay saldo pendiente o a favor */}
      {customer.balance !== 0 && (
        <Card
          className={
            customer.balance > 0
              ? "border-red-200 bg-red-50/30"
              : "border-emerald-200 bg-emerald-50/30"
          }
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Cuenta Corriente
              </CardTitle>
              <div className="flex items-center gap-2">
                {customer.balance > 0 &&
                  (customer.phone || customer.phoneAlt) && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <a
                        href={getWhatsAppLink(
                          (customer.phone || customer.phoneAlt)!,
                          getDebtReminderMessage(
                            customer.name,
                            customer.balance,
                          ),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Notificar
                      </a>
                    </Button>
                  )}
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  className="border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-800"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar PDF
                </Button>
                <Button
                  onClick={() => setIsPaymentModalOpen(true)}
                  size="sm"
                  className={
                    customer.balance > 0
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }
                >
                  <ArrowDownLeft className="h-4 w-4 mr-1" />
                  Registrar Pago
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  Saldo Actual
                </div>
                <div
                  className={cn(
                    "text-3xl font-bold font-mono",
                    customer.balance > 0 ? "text-red-700" : "text-emerald-700",
                  )}
                >
                  {formatARS(customer.balance, 2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {customer.balance > 0
                    ? "Cliente con deuda pendiente"
                    : customer.balance < 0
                      ? "Cliente con saldo a favor"
                      : "Cliente al día"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">OTs Impagas</div>
                <div className="text-2xl font-semibold">
                  {
                    customer.workOrders.filter(
                      (wo) =>
                        wo.status !== "PAID" &&
                        wo.status !== "DELIVERED" &&
                        wo.status !== "CANCELLED",
                    ).length
                  }
                </div>
              </div>
            </div>

            {/* Lista de OTs con saldo pendiente */}
            {customer.workOrders.filter(
              (wo) => wo.status !== "PAID" && wo.status !== "CANCELLED",
            ).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-2">
                  Órdenes de trabajo con saldo:
                </div>
                <div className="space-y-2">
                  {customer.workOrders
                    .filter(
                      (wo) => wo.status !== "PAID" && wo.status !== "CANCELLED",
                    )
                    .map((wo) => (
                      <div
                        key={wo.id}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <div>
                          <Link
                            href={`/adm/work-orders/${wo.id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            OT #{wo.id.slice(-6)} - {wo.vehicle.identifier}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {new Date(wo.createdAt).toLocaleDateString("es-AR")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold font-mono">
                            {formatARS(Number(wo.total), 2)}
                          </span>
                          {getStatusBadge(wo.status)}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleOpenPaymentForWO(Number(wo.total), wo.id)}
                          >
                            Pagar
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notas */}
      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Vehículos y Equipos - DataTable */}
      {customer.vehicles.length === 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehículos y Equipos (0)
          </h2>
          <div className="text-center py-8 text-muted-foreground">
            No hay vehículos registrados
          </div>
        </div>
      ) : (
        <DataTable
          data={customer.vehicles}
          columns={vehicleColumns}
          enableGlobalFilter={true}
          globalFilterPlaceholder="Buscar vehículo..."
          externalGlobalFilter={vehicleFilter}
          onExternalGlobalFilterChange={setVehicleFilter}
          pageSize={5}
          title={
            <span className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehículos y Equipos ({customer.vehicles.length})
            </span>
          }
          headerActions={[
            {
              label: "+ Vehículo",
              onClick: () => setIsVehicleModalOpen(true),
            },
          ]}
          rowActions={(vehicle) => (
            <Link href={`/adm/vehicles/${vehicle.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          )}
        />
      )}

      {/* Historial de OTs - DataTable */}
      {customer.workOrders.length === 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Historial de Órdenes de Trabajo (0)
          </h2>
          <div className="text-center py-8 text-muted-foreground">
            No hay órdenes de trabajo registradas
          </div>
        </div>
      ) : (
        <DataTable
          data={customer.workOrders}
          columns={workOrderColumns}
          enableGlobalFilter={true}
          globalFilterPlaceholder="Buscar OT..."
          externalGlobalFilter={workOrderFilter}
          onExternalGlobalFilterChange={setWorkOrderFilter}
          pageSize={5}
          title={
            <span className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Historial de Órdenes de Trabajo ({customer.workOrders.length})
            </span>
          }
          headerActions={[
            {
              label: "+ OT",
              onClick: () =>
                (window.location.href = `/adm/work-orders/new?customerId=${customerId}`),
            },
          ]}
          rowActions={(workOrder) => (
            <Link href={`/adm/work-orders/${workOrder.id}`}>
              <Button variant="ghost" size="sm">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
          )}
        />
      )}

      {/* Historial de Transacciones - DataTable */}
      {transactions.length === 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Historial de Transacciones (0)
          </h2>
          <div className="text-center py-8 text-muted-foreground">
            No hay transacciones registradas
          </div>
        </div>
      ) : (
        <DataTable
          data={transactions}
          columns={transactionColumns}
          enableGlobalFilter={true}
          globalFilterPlaceholder="Buscar transacción..."
          pageSize={5}
          title={
            <span className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Historial de Transacciones ({transactions.length})
            </span>
          }
          rowActions={(transaction) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTransaction(transaction);
                setIsTransactionModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        />
      )}

      {/* Modal de Pago */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Cliente: {customer?.name}
              <br />
            Saldo actual: {customer && formatARS(customer.balance, 2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Monto a Abonar *</Label>
                {customer && customer.balance > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setPaymentAmount(customer.balance.toString())}
                  >
                    Saldar total
                  </Button>
                )}
              </div>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={customer?.balance}
                placeholder="Ej: 5000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="font-mono"
              />
              {customer && customer.balance > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo: {formatARS(customer.balance, 2)}
                </p>
              )}
            </div>
            <div>
              <Label>Método de Pago *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
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
              <Label>Notas (opcional)</Label>
              <Input
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
              }}
              disabled={isSubmittingPayment}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const amount = parseFloat(paymentAmount);
                if (!amount || amount <= 0) {
                  alert("Ingrese un monto válido");
                  return;
                }

                setIsSubmittingPayment(true);
                try {
                  const res = await fetch(
                    `/api/customers/${customerId}/payments`,
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
                    fetchCustomer(); // Refresh customer data
                  } else {
                    const error = await res.json();
                    alert(error.error || "Error al registrar pago");
                  }
                } catch (error) {
                  console.error("Error:", error);
                  alert("Error al registrar pago");
                } finally {
                  setIsSubmittingPayment(false);
                }
              }}
              disabled={isSubmittingPayment || !paymentAmount}
            >
              {isSubmittingPayment ? "Procesando..." : "Confirmar Pago"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Vehículo */}
      <VehicleDialog
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        customerId={customerId}
        customerName={customer?.name || ""}
        onSuccess={fetchCustomer}
      />

      {/* Modal de edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos del cliente incluyendo información de contacto
              y facturación.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            initialData={{
              name: customer.name,
              phone: customer.phone,
              phoneAlt: customer.phoneAlt,
              email: customer.email,
              address: customer.address,
              notes: customer.notes,
              billingData: customer.billingData || undefined,
            }}
            onSubmit={async (formData) => {
              setIsEditing(true);
              try {
                const payload = {
                  ...formData,
                  billingData: formData.billingData?.cuit
                    ? formData.billingData
                    : undefined,
                };

                const response = await fetch(`/api/customers/${customerId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });

                if (!response.ok) throw new Error("Failed to update customer");

                setIsEditModalOpen(false);
                fetchCustomer();
              } catch (error) {
                console.error("Error updating customer:", error);
                alert("Error al actualizar cliente");
              } finally {
                setIsEditing(false);
              }
            }}
            onCancel={() => setIsEditModalOpen(false)}
            submitLabel="Guardar Cambios"
            isSubmitting={isEditing}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Nota de Crédito */}
      <CustomerCreditNoteDialog
        open={isCreditNoteModalOpen}
        onOpenChange={(open) => {
          setIsCreditNoteModalOpen(open);
          if (!open) setPreselectedSaleId(undefined);
        }}
        customerId={customerId}
        customerName={customer.name}
        onSuccess={fetchCustomer}
        preselectedSaleId={preselectedSaleId}
      />

      {/* Modal de Detalle de Transacción */}
      <Dialog
        open={isTransactionModalOpen}
        onOpenChange={(open) => {
          setIsTransactionModalOpen(open);
          if (!open) {
            setCancelReason("");
            setIsCancelling(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Transacción</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <Badge
                  className={
                    selectedTransaction.type === "DIRECT_SALE"
                      ? "bg-blue-100 text-blue-800"
                      : selectedTransaction.type === "CREDIT_NOTE"
                        ? "bg-orange-100 text-orange-800"
                        : selectedTransaction.type === "PAYMENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-green-100 text-green-800"
                  }
                >
                  {selectedTransaction.type === "DIRECT_SALE"
                    ? "Venta"
                    : selectedTransaction.type === "CREDIT_NOTE"
                      ? "NC"
                      : selectedTransaction.type === "PAYMENT"
                        ? "Pago"
                        : "Factura"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID</span>
                <span className="font-mono text-sm">
                  {selectedTransaction.id.slice(-6)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fecha</span>
                <span className="text-sm">
                  {new Date(selectedTransaction.createdAt).toLocaleDateString(
                    "es-AR",
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span
                  className={cn(
                    "font-mono font-semibold",
                    selectedTransaction.type === "CREDIT_NOTE"
                      ? "text-orange-700"
                      : "",
                    selectedTransaction.type === "PAYMENT"
                      ? "text-emerald-700"
                      : "",
                  )}
                >
                  {selectedTransaction.type === "CREDIT_NOTE" ? "-" : ""}
                  {formatARS(Number(selectedTransaction.total), 2)}
                </span>
              </div>
              {selectedTransaction.status && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <span className="text-sm">
                    {selectedTransaction.status === "ISSUED"
                      ? "Emitida"
                      : selectedTransaction.status === "CANCELLED"
                        ? "Cancelada"
                        : selectedTransaction.status}
                  </span>
                </div>
              )}
              {selectedTransaction.type === "PAYMENT" ? (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Método</span>
                    <span className="font-medium">
                      {selectedTransaction.method}
                    </span>
                  </div>
                  {selectedTransaction.notes && (
                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        Notas
                      </div>
                      <p className="text-sm bg-muted p-2 rounded">
                        {selectedTransaction.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Items</div>
                  <div className="space-y-2">
                    {selectedTransaction.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón para cancelar NC si está emitida */}
              {selectedTransaction.type === "CREDIT_NOTE" &&
                selectedTransaction.status === "ISSUED" && (
                  <div className="border-t pt-4 space-y-3">
                    <div>
                      <Label className="text-sm">Motivo de cancelación</Label>
                      <Input
                        placeholder="Ej: Error en la nota de crédito"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={async () => {
                        if (!cancelReason.trim()) {
                          alert(
                            "Por favor ingresa un motivo para la cancelación",
                          );
                          return;
                        }

                        setIsCancelling(true);
                        try {
                          const res = await fetch(
                            `/api/credit-notes/${selectedTransaction.id}/cancel`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ reason: cancelReason }),
                            },
                          );

                          if (res.ok) {
                            setIsTransactionModalOpen(false);
                            setCancelReason("");
                            fetchCustomer();
                          } else {
                            const error = await res.json();
                            alert(
                              error.error ||
                                "Error al cancelar nota de crédito",
                            );
                          }
                        } catch (error) {
                          console.error("Error:", error);
                          alert("Error al cancelar nota de crédito");
                        } finally {
                          setIsCancelling(false);
                        }
                      }}
                      disabled={isCancelling || !cancelReason.trim()}
                    >
                      {isCancelling
                        ? "Cancelando..."
                        : "Cancelar Nota de Crédito"}
                    </Button>
                  </div>
                )}

              {/* Botón para crear NC desde venta directa */}
              {selectedTransaction.type === "DIRECT_SALE" && (
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setPreselectedSaleId(selectedTransaction.id);
                      setIsTransactionModalOpen(false);
                      setIsCreditNoteModalOpen(true);
                    }}
                  >
                    Crear Nota de Crédito
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sección de Impresión de Cuenta Corriente (Solo visible al imprimir) */}
      <div className="hidden print:block font-sans p-6 text-black" id="print-section">
        {/* Header de la Empresa */}
        <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">RPM ACCESORIOS</h1>
            <p className="text-xs text-zinc-500 uppercase font-medium mt-0.5">Taller de Equipamiento y Estética Vehicular</p>
            <p className="text-[11px] text-zinc-400 font-mono mt-1">Sarmiento 1234, Rosario, Santa Fe | Tel: 341-5556789</p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="border-zinc-900 text-zinc-900 font-semibold text-xs py-1 px-3">
              RESUMEN DE CUENTA CLIENTE
            </Badge>
            <p className="text-xs text-zinc-500 font-mono mt-2">
              Fecha: {new Date().toLocaleDateString("es-AR")}
            </p>
          </div>
        </div>

        {/* Información General del Cliente */}
        <div className="grid grid-cols-2 gap-6 border border-zinc-300 rounded-lg p-4 mb-6">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">DATOS DEL CLIENTE</h3>
            <div className="grid grid-cols-3 text-sm gap-y-1">
              <span className="text-zinc-500 font-medium">Nombre:</span>
              <span className="col-span-2 font-bold text-zinc-900">{customer.name}</span>

              {customer.phone && (
                <>
                  <span className="text-zinc-500 font-medium">Teléfono:</span>
                  <span className="col-span-2 font-mono">{customer.phone}</span>
                </>
              )}

              {customer.phoneAlt && (
                <>
                  <span className="text-zinc-500 font-medium">Tel. Alt:</span>
                  <span className="col-span-2 font-mono">{customer.phoneAlt}</span>
                </>
              )}

              {customer.email && (
                <>
                  <span className="text-zinc-500 font-medium">Email:</span>
                  <span className="col-span-2 font-mono truncate">{customer.email}</span>
                </>
              )}

              {customer.address && (
                <>
                  <span className="text-zinc-500 font-medium">Dirección:</span>
                  <span className="col-span-2">{customer.address}</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5 border-l border-zinc-300 pl-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">INFORMACIÓN FISCAL & ADICIONAL</h3>
            <div className="grid grid-cols-3 text-sm gap-y-1">
              {customer.billingData ? (
                <>
                  <span className="text-zinc-500 font-medium">Tipo Fact:</span>
                  <span className="col-span-2 font-semibold">Factura {customer.billingData.invoiceType}</span>

                  <span className="text-zinc-500 font-medium">CUIT/CUIL:</span>
                  <span className="col-span-2 font-mono">{customer.billingData.cuit}</span>
                </>
              ) : (
                <>
                  <span className="text-zinc-500 font-medium">Condición:</span>
                  <span className="col-span-2">Consumidor Final</span>
                </>
              )}

              <span className="text-zinc-500 font-medium">Vehículos:</span>
              <span className="col-span-2 font-medium">
                {customer.vehicles.length > 0
                  ? customer.vehicles.map((v) => v.identifier).join(", ")
                  : "Ninguno registrado"}
              </span>
            </div>
          </div>
        </div>

        {/* Detalle de Órdenes de Trabajo Impagas */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-3">
            Órdenes de Trabajo Pendientes de Pago
          </h2>
          <table className="w-full border-collapse border border-zinc-300 text-sm">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 border-b border-zinc-300">
                <th className="py-2.5 px-3 text-left font-bold border-r border-zinc-300">Nro. OT</th>
                <th className="py-2.5 px-3 text-left font-bold border-r border-zinc-300">Vehículo / Patente</th>
                <th className="py-2.5 px-3 text-left font-bold border-r border-zinc-300">Fecha de Ingreso</th>
                <th className="py-2.5 px-3 text-left font-bold border-r border-zinc-300">Estado de OT</th>
                <th className="py-2.5 px-3 text-right font-bold">Monto Total</th>
              </tr>
            </thead>
            <tbody>
              {customer.workOrders.filter(
                (wo) => wo.status !== "PAID" && wo.status !== "CANCELLED",
              ).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 px-3 text-center text-zinc-500 italic">
                    No hay órdenes de trabajo pendientes de pago.
                  </td>
                </tr>
              ) : (
                customer.workOrders
                  .filter((wo) => wo.status !== "PAID" && wo.status !== "CANCELLED")
                  .map((wo) => (
                    <tr key={wo.id} className="border-b border-zinc-300">
                      <td className="py-2 px-3 font-mono font-semibold border-r border-zinc-300 text-zinc-900">
                        #{wo.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-2 px-3 font-mono border-r border-zinc-300 text-zinc-800">
                        {wo.vehicle?.identifier || "-"}
                      </td>
                      <td className="py-2 px-3 font-mono border-r border-zinc-300 text-zinc-600">
                        {new Date(wo.createdAt).toLocaleDateString("es-AR")}
                      </td>
                      <td className="py-2 px-3 border-r border-zinc-300 text-zinc-700">
                        {wo.status === "CONFIRMED" ? "Confirmada" :
                         wo.status === "WAITING" ? "En espera" :
                         wo.status === "IN_PROGRESS" ? "En progreso" :
                         wo.status === "QC_CHECK" ? "Control de Calidad" :
                         wo.status === "READY" ? "Listo" :
                         wo.status === "DELIVERED" ? "Entregado" : wo.status}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-zinc-900">
                        {formatARS(Number(wo.total), 2)}
                      </td>
                    </tr>
                  ))
              )}
              {/* Fila del Total Acumulado */}
              <tr className="bg-zinc-50 border-t-2 border-zinc-900 font-bold">
                <td colSpan={4} className="py-3 px-3 text-right text-zinc-700">
                  TOTAL SALDO DEUDOR:
                </td>
                <td className="py-3 px-3 text-right text-lg text-zinc-900 font-mono">
                  {formatARS(customer.balance, 2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Términos y Firmas */}
        <div className="mt-12">
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md text-xs text-zinc-500 mb-10 leading-relaxed">
            <p className="font-semibold text-zinc-700 mb-1">TÉRMINOS Y CONDICIONES:</p>
            <p>1. Este documento representa el estado de cuenta corriente unificado del cliente a la fecha de emisión indicada.</p>
            <p>2. Los montos expresados corresponden a órdenes de trabajo y/o transacciones autorizadas y pendientes de cobro.</p>
            <p>3. El saldo adeudado deberá cancelarse conforme a las condiciones pactadas. La empresa se reserva el derecho de suspender la entrega de unidades o la realización de nuevos trabajos en caso de mora.</p>
          </div>

          <div className="grid grid-cols-2 gap-20 pt-8">
            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-zinc-400 h-10" />
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mt-2">
                Firma Autorizada RPM
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-zinc-400 h-10" />
              <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mt-2">
                Firma del Cliente
              </span>
            </div>
          </div>
        </div>

        <div className="mt-14 text-center border-t border-zinc-200 pt-4 text-[10px] text-zinc-400 font-mono">
          RPM Accesorios © {new Date().getFullYear()} - Documento de control interno no válido como factura fiscal.
        </div>
      </div>

      {/* Estilos para impresión (Oculta sidebar, botones, widgets, etc.) */}
      <style media="print">
        {`
          @media print {
            aside,
            [data-sidebar="sidebar"],
            .print\\:hidden,
            button,
            header,
            footer,
            nav,
            .web-mcp-tools,
            #chat-floating-button {
              display: none !important;
            }

            main, .container, body {
              padding: 0 !important;
              margin: 0 !important;
              max-width: none !important;
              background: white !important;
              color: black !important;
            }

            .container {
              width: 100% !important;
            }
          }
        `}
      </style>
    </div>
  );
}
