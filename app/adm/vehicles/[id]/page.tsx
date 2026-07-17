"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Header } from "@/components/adm/Header";
import { formatARS } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Car,
  User,
  Wrench,
  Calendar,
  Palette,
  Phone,
  Mail,
  Trash2,
  Plus,
  Eye,
  ClipboardList,
  Tag,
  FileText,
  Pencil,
  Wallet,
  ArrowDownLeft,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import {
  getVehicleCategoryLabel,
  buildVehicleDescription,
} from "@/lib/constants/vehicle-categories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { useUI } from "@/components/ui/UIProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWhatsAppLink, getDebtReminderMessage } from "@/lib/utils/whatsapp";

interface WorkOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
}

interface VehicleDetail {
  id: string;
  identifier: string;
  category: string;
  year?: number;
  color?: string;
  equipmentName?: string;
  equipmentType?: string;
  description?: string;
  notes?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  make?: {
    name: string;
  };
  model?: {
    name: string;
  };
  workOrders: WorkOrder[];
}

export default function VehicleDetailPage() {
  const { id: vehicleId } = useParams();
  const router = useRouter();
  const { alert, confirm } = useUI();
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Lógica de pagos
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");

  const handleOpenPaymentForWO = useCallback((total: number, id: string) => {
    setPaymentAmount(total.toString());
    setPaymentNotes(`Pago OT #${id.slice(-6).toUpperCase()}`);
    setIsPaymentModalOpen(true);
  }, []);

  // Cálculo de deuda acumulada
  const unpaidWorkOrders = useMemo(() => {
    if (!vehicle || !vehicle.workOrders) return [];
    return vehicle.workOrders.filter(
      (wo) => wo.status !== "PAID" && wo.status !== "CANCELLED",
    );
  }, [vehicle]);

  const vehicleDebt = useMemo(() => {
    return unpaidWorkOrders.reduce((sum, wo) => sum + Number(wo.total), 0);
  }, [unpaidWorkOrders]);

  const fetchVehicle = useCallback(async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      if (res.ok) {
        const data = await res.json();
        setVehicle(data);
      } else {
        throw new Error("Error al obtener datos del vehículo");
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Eliminar vehículo",
      description: "¿Está seguro de que desea eliminar este vehículo?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/adm/customers");
      } else {
        const error = await res.json();
        await alert({
          title: "Error",
          description: error.error || "Error al eliminar el vehículo",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      await alert({
        title: "Error",
        description: "Error al eliminar el vehículo",
        variant: "error",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: "default" | "outline" | "secondary" | "destructive";
        className: string;
      }
    > = {
      CONFIRMED: {
        label: "Confirmada",
        variant: "outline",
        className: "text-blue-700 border-blue-200 bg-blue-50",
      },
      WAITING: {
        label: "En espera",
        variant: "outline",
        className: "text-amber-700 border-amber-200 bg-amber-50",
      },
      IN_PROGRESS: {
        label: "En progreso",
        variant: "outline",
        className: "text-orange-700 border-orange-200 bg-orange-50",
      },
      QC_CHECK: {
        label: "Control de Calidad",
        variant: "outline",
        className: "text-purple-700 border-purple-200 bg-purple-50",
      },
      READY: {
        label: "Listo",
        variant: "outline",
        className: "text-emerald-700 border-emerald-200 bg-emerald-50",
      },
      PAID: {
        label: "Pagado",
        variant: "outline",
        className: "text-emerald-700 border-emerald-200 bg-emerald-50",
      },
      DELIVERED: { label: "Entregado", variant: "secondary", className: "" },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "secondary",
      className: "",
    };

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Columnas para DataTable de OTs
  const workOrderColumns: ColumnDef<WorkOrder>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "OT",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
              <ClipboardList
                className="h-4 w-4 text-primary pointer-events-none"
                aria-hidden="true"
              />
            </div>
            <span className="font-semibold tracking-tight font-mono">
              {row.original.id.slice(-6).toUpperCase()}
            </span>
          </div>
        ),
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
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString("es-AR")}
          </span>
        ),
      },
    ],
    [],
  );

  const workOrderRowActions = useCallback(
    (row: WorkOrder) => (
      <div className="flex items-center gap-1">
        {row.status !== "PAID" && row.status !== "CANCELLED" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => handleOpenPaymentForWO(Number(row.total), row.id)}
                aria-label="Registrar Pago de esta Orden de Trabajo"
              >
                <ArrowDownLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Registrar Pago</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/adm/work-orders/${row.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Ver detalles de la Orden de Trabajo"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>Ver detalles</TooltipContent>
        </Tooltip>
      </div>
    ),
    [handleOpenPaymentForWO],
  );

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Header title="Cargando..." showBackButton />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl font-bold">Vehículo/Equipo no encontrado</h1>
        <Button onClick={() => router.back()} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const isEquipment = [
    "AUDIO_EQUIPMENT",
    "ELECTRIC_SCOOTER",
    "OTHER",
    "TRAILER",
  ].includes(vehicle.category);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Header
        title={
          isEquipment
            ? vehicle.equipmentName || vehicle.identifier
            : vehicle.identifier
        }
        titleClassName="font-mono tracking-tight"
        description={buildVehicleDescription({
          category: vehicle.category,
          make: vehicle.make?.name,
          model: vehicle.model?.name,
          color: vehicle.color,
          year: vehicle.year,
        })}
        showBackButton
        onBack={() => router.back()}
        primaryAction={{
          label: "Nueva OT",
          href: `/adm/work-orders/new?vehicleId=${vehicleId}`,
          icon: Plus,
          ariaLabel: "Crear nueva orden de trabajo para este vehículo",
        }}
        secondaryActions={[
          {
            label: "Editar",
            onClick: () => setIsEditModalOpen(true),
            variant: "outline",
            icon: Pencil,
            ariaLabel: "Editar los datos de este vehículo o equipo",
          },
          {
            label: "Eliminar",
            onClick: handleDelete,
            variant: "outline",
            icon: Trash2,
            className:
              "text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20",
            ariaLabel: "Eliminar este vehículo o equipo",
          },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground">
            <Tag
              className="h-3.5 w-3.5 pointer-events-none"
              aria-hidden="true"
            />
            {getVehicleCategoryLabel(vehicle.category)}
          </div>
          {vehicle.year && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground font-mono">
              <Calendar
                className="h-3.5 w-3.5 pointer-events-none"
                aria-hidden="true"
              />
              {vehicle.year}
            </div>
          )}
          {vehicle.color && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground">
              <Palette
                className="h-3.5 w-3.5 pointer-events-none"
                aria-hidden="true"
              />
              {vehicle.color}
            </div>
          )}

          {vehicle.customer && (
            <>
              <div className="h-4 w-px bg-border mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={`tel:${vehicle.customer.phone}`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/50 border border-blue-100 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors font-mono"
                  >
                    <Phone
                      className="h-3.5 w-3.5 pointer-events-none"
                      aria-hidden="true"
                    />{" "}
                    {vehicle.customer.phone}
                  </a>
                </TooltipTrigger>
                <TooltipContent>Llamar al cliente</TooltipContent>
              </Tooltip>

              {vehicle.customer.email && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`mailto:${vehicle.customer.email}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50/50 border border-slate-100 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors font-mono"
                    >
                      <Mail
                        className="h-3.5 w-3.5 pointer-events-none"
                        aria-hidden="true"
                      />{" "}
                      {vehicle.customer.email}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Enviar correo electrónico</TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </Header>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car
                className="h-5 w-5 text-primary pointer-events-none"
                aria-hidden="true"
              />
              Información del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {!isEquipment && vehicle.year && (
                <div className="flex items-center gap-2">
                  <Calendar
                    className="h-4 w-4 text-muted-foreground pointer-events-none"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-muted-foreground">Año:</span>
                  <span className="font-medium font-mono">{vehicle.year}</span>
                </div>
              )}
              {vehicle.color && (
                <div className="flex items-center gap-2">
                  <Palette
                    className="h-4 w-4 text-muted-foreground pointer-events-none"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-muted-foreground">Color:</span>
                  <span className="font-medium">{vehicle.color}</span>
                </div>
              )}
              {isEquipment && vehicle.equipmentType && (
                <div className="flex items-center gap-2">
                  <Wrench
                    className="h-4 w-4 text-muted-foreground pointer-events-none"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{vehicle.equipmentType}</span>
                </div>
              )}
            </div>
            {vehicle.notes && (
              <div className="p-3 bg-muted/30 border rounded-md">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText
                    className="h-3.5 w-3.5 pointer-events-none"
                    aria-hidden="true"
                  />
                  Notas
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {vehicle.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Card - Contactos Accionables */}
        {vehicle.customer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User
                  className="h-5 w-5 text-primary pointer-events-none"
                  aria-hidden="true"
                />
                Propietario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm ring-1 ring-primary/20">
                  {vehicle.customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg tracking-tight leading-none">
                    {vehicle.customer.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cliente Registrado
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={`tel:${vehicle.customer.phone}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
                >
                  <Phone
                    className="h-4 w-4 pointer-events-none"
                    aria-hidden="true"
                  />{" "}
                  {vehicle.customer.phone}
                </a>
                {vehicle.customer.email && (
                  <a
                    href={`mailto:${vehicle.customer.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
                  >
                    <Mail
                      className="h-4 w-4 pointer-events-none"
                      aria-hidden="true"
                    />{" "}
                    {vehicle.customer.email}
                  </a>
                )}
              </div>
              <div className="pt-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/adm/customers/${vehicle.customer.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        aria-label="Ver ficha detallada del cliente"
                      >
                        <Eye
                          className="h-4 w-4 mr-2 pointer-events-none"
                          aria-hidden="true"
                        />
                        Ver Ficha Cliente
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Ir al perfil del cliente</TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cuenta Corriente del Vehículo */}
      {vehicleDebt > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-red-700" />
                Cuenta Corriente del Vehículo
              </CardTitle>
              <div className="flex items-center gap-2">
                {vehicle.customer && vehicle.customer.phone && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    <a
                      href={getWhatsAppLink(
                        vehicle.customer.phone,
                        getDebtReminderMessage(
                          vehicle.customer.name,
                          vehicleDebt,
                        ),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Notificar Deuda
                    </a>
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setPaymentAmount(vehicleDebt.toString());
                    setPaymentNotes(`Saldo deudor de vehículo ${vehicle.identifier}`);
                    setIsPaymentModalOpen(true);
                  }}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <ArrowDownLeft className="h-4 w-4 mr-1" />
                  Saldar Vehículo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  Deuda Pendiente de este Vehículo
                </div>
                <div className="text-3xl font-bold font-mono text-red-700">
                  {formatARS(vehicleDebt, 2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Monto acumulado por órdenes de trabajo pendientes de pago.
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">OTs Impagas</div>
                <div className="text-2xl font-semibold font-mono">
                  {unpaidWorkOrders.length}
                </div>
              </div>
            </div>

            {/* List of Unpaid OTs */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium mb-2">
                Órdenes de trabajo impagas:
              </div>
              <div className="space-y-2">
                {unpaidWorkOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div>
                      <Link
                        href={`/adm/work-orders/${wo.id}`}
                        className="text-sm font-medium hover:underline text-primary"
                      >
                        OT #{wo.id.slice(-6).toUpperCase()}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {new Date(wo.createdAt).toLocaleDateString("es-AR")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold font-mono text-red-700">
                        {formatARS(Number(wo.total), 2)}
                      </span>
                      {getStatusBadge(wo.status)}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium"
                        onClick={() => handleOpenPaymentForWO(Number(wo.total), wo.id)}
                      >
                        Pagar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Pago */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Propietario: {vehicle.customer?.name}
              <br />
              Deuda de este vehículo: {formatARS(vehicleDebt, 2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Monto a Abonar *</Label>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setPaymentAmount(vehicleDebt.toString())}
                >
                  Saldar total
                </Button>
              </div>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ej: 5000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="font-mono"
              />
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
                  await alert({
                    title: "Error",
                    description: "Ingrese un monto válido",
                    variant: "error",
                  });
                  return;
                }

                if (!vehicle.customer) return;

                setIsSubmittingPayment(true);
                try {
                  const res = await fetch(
                    `/api/customers/${vehicle.customer.id}/payments`,
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
                    fetchVehicle(); // Refresh vehicle data
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
              }}
              disabled={isSubmittingPayment || !paymentAmount}
            >
              {isSubmittingPayment ? "Procesando..." : "Confirmar Pago"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Vehículo / Equipo</DialogTitle>
            <DialogDescription>
              Modifica los datos técnicos y especificaciones del vehículo o
              equipo.
            </DialogDescription>
          </DialogHeader>
          <VehicleForm
            initialData={{
              identifier: vehicle.identifier,
              category: vehicle.category,
              makeName: vehicle.make?.name,
              modelName: vehicle.model?.name,
              year: vehicle.year,
              color: vehicle.color,
              equipmentName: vehicle.equipmentName,
              equipmentType: vehicle.equipmentType,
              description: vehicle.description,
              notes: vehicle.notes,
            }}
            onSubmit={async (formData) => {
              setIsEditing(true);
              try {
                const response = await fetch(`/api/vehicles/${vehicleId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...formData,
                    year: formData.year
                      ? parseInt(formData.year.toString())
                      : undefined,
                  }),
                });

                if (!response.ok) throw new Error("Failed to update vehicle");

                setIsEditModalOpen(false);
                fetchVehicle();
              } catch (error) {
                console.error("Error updating vehicle:", error);
                await alert({
                  title: "Error",
                  description: "Error al actualizar vehículo",
                  variant: "error",
                });
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

      {/* Work Orders - DataTable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ClipboardList
              className="h-5 w-5 text-primary pointer-events-none"
              aria-hidden="true"
            />
            Historial de Órdenes de Trabajo
            <Badge variant="secondary" className="ml-2 font-mono">
              {vehicle.workOrders?.length ?? 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(vehicle.workOrders?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Wrench
                  className="h-8 w-8 text-muted-foreground/20 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-foreground">
                  Sin historial
                </p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  No hay órdenes de trabajo registradas para este vehículo o
                  equipo.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/adm/work-orders/new?vehicleId=${vehicleId}`)
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear primera OT
              </Button>
            </div>
          ) : (
            <DataTable
              data={vehicle.workOrders}
              columns={workOrderColumns}
              rowActions={workOrderRowActions}
              title="Órdenes de Trabajo"
              enableGlobalFilter={true}
              globalFilterPlaceholder="Buscar OT..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
