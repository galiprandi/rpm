"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Header } from "@/components/adm/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
} from "lucide-react";
import Link from "next/link";

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

const categoryLabels: Record<string, string> = {
  CAR: "Auto/Camioneta",
  SUV: "SUV/4x4",
  PICKUP: "Pickup",
  TRUCK: "Camión",
  MOTORCYCLE: "Moto",
  TRAILER: "Trailer/Acoplado",
  AUDIO_EQUIPMENT: "Equipo de Audio",
  ELECTRIC_SCOOTER: "Monopatín Eléctrico",
  OTHER: "Otro Equipo",
};

export default function VehicleDetailPage() {
  const { id: vehicleId } = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (!confirm("¿Está seguro de que desea eliminar este vehículo?")) return;
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/adm/customers");
      } else {
        const error = await res.json();
        alert(error.error || "Error al eliminar el vehículo");
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      alert("Error al eliminar el vehículo");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive"; className: string }> = {
      CONFIRMED: { label: "Confirmada", variant: "outline", className: "text-blue-700 border-blue-200 bg-blue-50" },
      WAITING: { label: "En espera", variant: "outline", className: "text-amber-700 border-amber-200 bg-amber-50" },
      IN_PROGRESS: { label: "En progreso", variant: "outline", className: "text-orange-700 border-orange-200 bg-orange-50" },
      QC_CHECK: { label: "Control de Calidad", variant: "outline", className: "text-purple-700 border-purple-200 bg-purple-50" },
      READY: { label: "Listo", variant: "outline", className: "text-emerald-700 border-emerald-200 bg-emerald-50" },
      PAID: { label: "Pagado", variant: "outline", className: "text-emerald-700 border-emerald-200 bg-emerald-50" },
      DELIVERED: { label: "Entregado", variant: "secondary", className: "" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary", className: "" };

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
              <ClipboardList className="h-4 w-4 text-primary pointer-events-none" aria-hidden="true" />
            </div>
            <span className="font-semibold tracking-tight font-mono">{row.original.id.slice(-6).toUpperCase()}</span>
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
          <span className="font-mono">
            {Number(row.original.total).toLocaleString("es-AR", {
              style: "currency",
              currency: "ARS",
            })}
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
    []
  );

  const workOrderRowActions = useCallback(
    (row: WorkOrder) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/adm/work-orders/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Ver detalles de la Orden de Trabajo">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>Ver detalles</TooltipContent>
      </Tooltip>
    ),
    []
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
        title={isEquipment ? vehicle.equipmentName || vehicle.identifier : vehicle.identifier}
        titleClassName="font-mono tracking-tight"
        description={`${categoryLabels[vehicle.category] || vehicle.category}${vehicle.make?.name ? ` • ${vehicle.make.name} ${vehicle.model?.name || ""}` : ""}`}
        showBackButton
        onBack={() => router.back()}
        primaryAction={{
          label: "Nueva OT",
          href: `/adm/work-orders/new?vehicleId=${vehicleId}`,
          icon: Plus,
          ariaLabel: "Crear nueva orden de trabajo para este vehículo"
        }}
        secondaryActions={[
          {
            label: "Eliminar",
            onClick: handleDelete,
            variant: "outline",
            icon: Trash2,
            className: "text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20",
            ariaLabel: "Eliminar este vehículo o equipo"
          },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground">
            <Tag className="h-3.5 w-3.5 pointer-events-none" aria-hidden="true" />
            {categoryLabels[vehicle.category] || vehicle.category}
          </div>
          {vehicle.year && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground font-mono">
              <Calendar className="h-3.5 w-3.5 pointer-events-none" aria-hidden="true" />
              {vehicle.year}
            </div>
          )}
          {vehicle.color && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground">
              <Palette className="h-3.5 w-3.5 pointer-events-none" aria-hidden="true" />
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
                    <Phone className="h-3.5 w-3.5 pointer-events-none" aria-hidden="true" /> {vehicle.customer.phone}
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
                      <Mail className="h-3.5 w-3.5 pointer-events-none" aria-hidden="true" /> {vehicle.customer.email}
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
              <Car className="h-5 w-5 text-primary pointer-events-none" aria-hidden="true" />
              Información del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {!isEquipment && vehicle.year && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">Año:</span>
                  <span className="font-medium font-mono">{vehicle.year}</span>
                </div>
              )}
              {vehicle.color && (
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">Color:</span>
                  <span className="font-medium">{vehicle.color}</span>
                </div>
              )}
              {isEquipment && vehicle.equipmentType && (
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{vehicle.equipmentType}</span>
                </div>
              )}
            </div>
            {vehicle.notes && (
              <div className="p-3 bg-muted/30 border rounded-md">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 pointer-events-none" aria-hidden="true" />
                  Notas
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{vehicle.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Card - Contactos Accionables */}
        {vehicle.customer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary pointer-events-none" aria-hidden="true" />
                Propietario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm ring-1 ring-primary/20">
                  {vehicle.customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg tracking-tight leading-none">{vehicle.customer.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Cliente Registrado</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={`tel:${vehicle.customer.phone}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
                >
                  <Phone className="h-4 w-4 pointer-events-none" aria-hidden="true" /> {vehicle.customer.phone}
                </a>
                {vehicle.customer.email && (
                  <a
                    href={`mailto:${vehicle.customer.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
                  >
                    <Mail className="h-4 w-4 pointer-events-none" aria-hidden="true" /> {vehicle.customer.email}
                  </a>
                )}
              </div>
              <div className="pt-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/adm/customers/${vehicle.customer.id}`}>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" aria-label="Ver ficha detallada del cliente">
                        <Eye className="h-4 w-4 mr-2 pointer-events-none" aria-hidden="true" />
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

      {/* Work Orders - DataTable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ClipboardList className="h-5 w-5 text-primary pointer-events-none" aria-hidden="true" />
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
                <Wrench className="h-8 w-8 text-muted-foreground/20 pointer-events-none" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-foreground">Sin historial</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  No hay órdenes de trabajo registradas para este vehículo o equipo.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/adm/work-orders/new?vehicleId=${vehicleId}`)}
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
