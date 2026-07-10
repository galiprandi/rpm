"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/adm/Header";
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

type TransactionType = 'DIRECT_SALE' | 'CREDIT_NOTE' | 'INVOICE' | 'PAYMENT';

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
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [workOrderFilter, setWorkOrderFilter] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [preselectedSaleId, setPreselectedSaleId] = useState<string | undefined>(undefined);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

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
      IN_PROGRESS: { color: "bg-orange-100 text-orange-800", label: "En Progreso" },
      QC_CHECK: { color: "bg-purple-100 text-purple-800", label: "Control de Calidad" },
      READY: { color: "bg-green-100 text-green-800", label: "Lista" },
      PAID: { color: "bg-emerald-100 text-emerald-800", label: "Pagada" },
      DELIVERED: { color: "bg-gray-100 text-gray-800", label: "Entregada" },
    };
    const config = statusConfig[status] || { color: "bg-gray-100", label: status };
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Columnas para DataTable de vehículos
  const vehicleColumns: ColumnDef<Vehicle>[] = useMemo(
    () => [
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
            <Link href={`/adm/work-orders/new?customerId=${customerId}&vehicleId=${row.original.id}`}>
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        ),
      },
      {
        accessorKey: "identifier",
        header: "Identificador",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.identifier}</span>
        ),
      },
      {
        accessorKey: "category",
        header: "Categoría",
      },
      {
        accessorKey: "make.name",
        header: "Marca/Modelo",
        cell: ({ row }) => (
          <span>
            {row.original.make?.name} {row.original.model?.name}
          </span>
        ),
      },
      {
        accessorKey: "year",
        header: "Año",
        cell: ({ row }) => row.original.year || "-",
      },
    ],
    []
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
        cell: ({ row }) =>
          `$${Number(row.original.total).toLocaleString("es-AR")}`,
      },
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString("es-AR"),
      },
    ],
    []
  );

  // Combinar ventas directas y notas de crédito en transacciones unificadas
  const transactions: Transaction[] = useMemo(() => {
    if (!customer) return [];

    const sales: Transaction[] = customer.directSales.map(sale => ({
      id: sale.id,
      type: 'DIRECT_SALE' as TransactionType,
      total: sale.total,
      createdAt: sale.createdAt,
      items: sale.items,
    }));

    const creditNotes: Transaction[] = customer.creditNotes.map(cn => ({
      id: cn.id,
      type: 'CREDIT_NOTE' as TransactionType,
      total: cn.total,
      createdAt: cn.createdAt,
      items: cn.items,
      status: cn.status,
    }));

    const payments: Transaction[] = customer.payments.map(p => ({
      id: p.id,
      type: 'PAYMENT' as TransactionType,
      total: p.amount,
      createdAt: p.createdAt,
      method: p.method,
      notes: p.notes,
    }));

    // Combinar y ordenar por fecha (más reciente primero)
    return [...sales, ...creditNotes, ...payments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
          const typeConfig: Record<TransactionType, { label: string; color: string }> = {
            DIRECT_SALE: { label: "Venta", color: "bg-blue-100 text-blue-800" },
            CREDIT_NOTE: { label: "NC", color: "bg-orange-100 text-orange-800" },
            INVOICE: { label: "Factura", color: "bg-green-100 text-green-800" },
            PAYMENT: { label: "Pago", color: "bg-emerald-100 text-emerald-800" },
          };
          const config = typeConfig[type];
          return (
            <Badge className={config.color}>
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
          const statusConfig: Record<string, { label: string; color: string }> = {
            ISSUED: { label: "Emitida", color: "bg-green-100 text-green-800" },
            CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800" },
          };
          const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800" };
          return (
            <Badge className={config.color}>
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "items",
        header: "Concepto / Items",
        cell: ({ row }) => {
          if (row.original.type === 'PAYMENT') {
            return (
              <div className="flex flex-col">
                <span className="font-medium text-emerald-700">Pago Recibido ({row.original.method})</span>
                {row.original.notes && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{row.original.notes}</span>}
              </div>
            );
          }
          return row.original.items?.map((i: { name: string }) => i.name).join(", ") || "-";
        },
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => {
          const total = row.original.total;
          const isCreditNote = row.original.type === 'CREDIT_NOTE';
          const isPayment = row.original.type === 'PAYMENT';
          return (
            <span className={isCreditNote ? 'text-orange-700' : ''}>
              {isCreditNote ? '-' : ''}$${Number(total).toLocaleString("es-AR")}
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
    []
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
            label: "+ Vehículo",
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
                href={getWhatsAppLink(customer.phoneAlt, `Hola ${customer.name}!`)}
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
        <Card className={customer.balance > 0 ? "border-red-200 bg-red-50/30" : "border-emerald-200 bg-emerald-50/30"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Cuenta Corriente
            </CardTitle>
            <div className="flex items-center gap-2">
              {customer.balance > 0 && (customer.phone || customer.phoneAlt) && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <a
                    href={getWhatsAppLink(
                      (customer.phone || customer.phoneAlt)!,
                      getDebtReminderMessage(customer.name, customer.balance)
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
                onClick={() => setIsPaymentModalOpen(true)}
                size="sm"
                className={customer.balance > 0 ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
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
              <div className="text-sm text-muted-foreground">Saldo Actual</div>
              <div className={`text-3xl font-bold ${customer.balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {formatCurrency(customer.balance)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {customer.balance > 0 
                  ? 'Cliente con deuda pendiente'
                  : customer.balance < 0
                  ? 'Cliente con saldo a favor'
                  : 'Cliente al día'
                }
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">OTs Impagas</div>
              <div className="text-2xl font-semibold">
                {customer.workOrders.filter(wo => wo.status !== 'PAID' && wo.status !== 'DELIVERED' && wo.status !== 'CANCELLED').length}
              </div>
            </div>
          </div>

          {/* Lista de OTs con saldo pendiente */}
          {customer.workOrders.filter(wo => wo.status !== 'PAID' && wo.status !== 'CANCELLED').length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium mb-2">Órdenes de trabajo con saldo:</div>
              <div className="space-y-2">
                {customer.workOrders
                  .filter(wo => wo.status !== 'PAID' && wo.status !== 'CANCELLED')
                  .map(wo => (
                    <div key={wo.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <Link href={`/adm/work-orders/${wo.id}`} className="text-sm font-medium hover:underline">
                          OT #{wo.id.slice(-6)} - {wo.vehicle.identifier}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {new Date(wo.createdAt).toLocaleDateString('es-AR')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatCurrency(wo.total)}</span>
                        {getStatusBadge(wo.status)}
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
              onClick: () => window.location.href = `/adm/work-orders/new?customerId=${customerId}`,
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
              Saldo actual: {customer && formatCurrency(customer.balance)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Monto a Abonar *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={customer?.balance}
                placeholder="Ej: 5000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              {customer && customer.balance > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo: {formatCurrency(customer.balance)}
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
                setPaymentAmount('');
                setPaymentNotes('');
              }}
              disabled={isSubmittingPayment}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const amount = parseFloat(paymentAmount);
                if (!amount || amount <= 0) {
                  alert('Ingrese un monto válido');
                  return;
                }

                setIsSubmittingPayment(true);
                try {
                  const res = await fetch(`/api/customers/${customerId}/payments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      amount,
                      method: paymentMethod,
                      notes: paymentNotes,
                    }),
                  });

                  if (res.ok) {
                    setIsPaymentModalOpen(false);
                    setPaymentAmount('');
                    setPaymentNotes('');
                    fetchCustomer(); // Refresh customer data
                  } else {
                    const error = await res.json();
                    alert(error.error || 'Error al registrar pago');
                  }
                } catch (error) {
                  console.error('Error:', error);
                  alert('Error al registrar pago');
                } finally {
                  setIsSubmittingPayment(false);
                }
              }}
              disabled={isSubmittingPayment || !paymentAmount}
            >
              {isSubmittingPayment ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Vehículo */}
      <VehicleDialog
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        customerId={customerId}
        customerName={customer?.name || ''}
        onSuccess={fetchCustomer}
      />

      {/* Modal de edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos del cliente incluyendo información de contacto y facturación.
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
      <Dialog open={isTransactionModalOpen} onOpenChange={(open) => {
        setIsTransactionModalOpen(open);
        if (!open) {
          setCancelReason('');
          setIsCancelling(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de Transacción</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <Badge className={
                  selectedTransaction.type === 'DIRECT_SALE' ? 'bg-blue-100 text-blue-800' :
                  selectedTransaction.type === 'CREDIT_NOTE' ? 'bg-orange-100 text-orange-800' :
                  selectedTransaction.type === 'PAYMENT' ? 'bg-emerald-100 text-emerald-800' :
                  'bg-green-100 text-green-800'
                }>
                  {selectedTransaction.type === 'DIRECT_SALE' ? 'Venta' :
                   selectedTransaction.type === 'CREDIT_NOTE' ? 'NC' :
                   selectedTransaction.type === 'PAYMENT' ? 'Pago' : 'Factura'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID</span>
                <span className="font-mono text-sm">{selectedTransaction.id.slice(-6)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fecha</span>
                <span className="text-sm">{new Date(selectedTransaction.createdAt).toLocaleDateString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className={`font-semibold ${selectedTransaction.type === 'CREDIT_NOTE' ? 'text-orange-700' : ''}`}>
                  {selectedTransaction.type === 'CREDIT_NOTE' ? '-' : ''}${Number(selectedTransaction.total).toLocaleString('es-AR')}
                </span>
              </div>
              {selectedTransaction.status && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <span className="text-sm">
                    {selectedTransaction.status === 'ISSUED' ? 'Emitida' :
                     selectedTransaction.status === 'CANCELLED' ? 'Cancelada' :
                     selectedTransaction.status}
                  </span>
                </div>
              )}
              {selectedTransaction.type === 'PAYMENT' ? (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Método</span>
                    <span className="font-medium">{selectedTransaction.method}</span>
                  </div>
                  {selectedTransaction.notes && (
                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground mb-1">Notas</div>
                      <p className="text-sm bg-muted p-2 rounded">{selectedTransaction.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Items</div>
                  <div className="space-y-2">
                    {selectedTransaction.items?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón para cancelar NC si está emitida */}
              {selectedTransaction.type === 'CREDIT_NOTE' && selectedTransaction.status === 'ISSUED' && (
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
                        alert('Por favor ingresa un motivo para la cancelación');
                        return;
                      }

                      setIsCancelling(true);
                      try {
                        const res = await fetch(`/api/credit-notes/${selectedTransaction.id}/cancel`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ reason: cancelReason }),
                        });

                        if (res.ok) {
                          setIsTransactionModalOpen(false);
                          setCancelReason('');
                          fetchCustomer();
                        } else {
                          const error = await res.json();
                          alert(error.error || 'Error al cancelar nota de crédito');
                        }
                      } catch (error) {
                        console.error('Error:', error);
                        alert('Error al cancelar nota de crédito');
                      } finally {
                        setIsCancelling(false);
                      }
                    }}
                    disabled={isCancelling || !cancelReason.trim()}
                  >
                    {isCancelling ? 'Cancelando...' : 'Cancelar Nota de Crédito'}
                  </Button>
                </div>
              )}

              {/* Botón para crear NC desde venta directa */}
              {selectedTransaction.type === 'DIRECT_SALE' && (
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
    </div>
  );
}
