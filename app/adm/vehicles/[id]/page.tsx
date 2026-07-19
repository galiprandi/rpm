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
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  entryPhotos?: string[];
  exitPhotos?: string[];
  photo?: Array<{
    id: string;
    type: string;
    url: string;
    description?: string;
    createdAt?: string;
  }>;
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

  // Galería de fotos consolidada
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [woFilter, setWoFilter] = useState<string>("ALL");
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const vehiclePhotos = useMemo(() => {
    if (!vehicle || !vehicle.workOrders) return [];

    const photos: Array<{
      url: string;
      type: "ENTRY" | "EXIT" | "GENERAL";
      workOrderId: string;
      workOrderCode: string;
      createdAt: string;
      description?: string;
    }> = [];

    const seenUrls = new Set<string>();

    vehicle.workOrders.forEach((wo) => {
      const code = wo.id.slice(-6).toUpperCase();

      // 1. Extra/General Photos from work order relation
      if (wo.photo) {
        wo.photo.forEach((p) => {
          if (!seenUrls.has(p.url)) {
            seenUrls.add(p.url);
            photos.push({
              url: p.url,
              type: p.type as "ENTRY" | "EXIT" | "GENERAL" || "GENERAL",
              workOrderId: wo.id,
              workOrderCode: code,
              createdAt: p.createdAt || wo.createdAt,
              description: p.description || undefined,
            });
          }
        });
      }

      // 2. Entry Photos
      if (wo.entryPhotos) {
        wo.entryPhotos.forEach((url) => {
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            photos.push({
              url,
              type: "ENTRY",
              workOrderId: wo.id,
              workOrderCode: code,
              createdAt: wo.createdAt,
              description: "Foto de ingreso del vehículo",
            });
          }
        });
      }

      // 3. Exit Photos
      if (wo.exitPhotos) {
        wo.exitPhotos.forEach((url) => {
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            photos.push({
              url,
              type: "EXIT",
              workOrderId: wo.id,
              workOrderCode: code,
              createdAt: wo.createdAt,
              description: "Foto de egreso del vehículo",
            });
          }
        });
      }
    });

    // Ordenar de más reciente a más antigua
    return photos.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [vehicle]);

  const workOrdersWithPhotos = useMemo(() => {
    if (!vehicle || !vehicle.workOrders) return [];
    return vehicle.workOrders.filter((wo) => {
      const hasEntry = wo.entryPhotos && wo.entryPhotos.length > 0;
      const hasExit = wo.exitPhotos && wo.exitPhotos.length > 0;
      const hasGeneral = wo.photo && wo.photo.length > 0;
      return hasEntry || hasExit || hasGeneral;
    });
  }, [vehicle]);

  const filteredPhotos = useMemo(() => {
    return vehiclePhotos.filter((p) => {
      const matchesType = typeFilter === "ALL" || p.type === typeFilter;
      const matchesWO = woFilter === "ALL" || p.workOrderId === woFilter;
      return matchesType && matchesWO;
    });
  }, [vehiclePhotos, typeFilter, woFilter]);

  const handleNextPhoto = useCallback(() => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((prev) =>
      prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0
    );
  }, [activePhotoIndex, filteredPhotos.length]);

  const handlePrevPhoto = useCallback(() => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1
    );
  }, [activePhotoIndex, filteredPhotos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePhotoIndex === null) return;
      if (e.key === "ArrowRight") {
        handleNextPhoto();
      } else if (e.key === "ArrowLeft") {
        handlePrevPhoto();
      } else if (e.key === "Escape") {
        setActivePhotoIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhotoIndex, handleNextPhoto, handlePrevPhoto]);

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
    <div className="container mx-auto py-6 space-y-6 print:py-0 print:space-y-0">
      <div className="print:hidden space-y-6">
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
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                  className="border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-800"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar PDF
                </Button>
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

      {/* Tabs Layout: Historial y Galería */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="orders" className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4" />
            Órdenes de Trabajo ({vehicle.workOrders?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-1.5">
            <Camera className="h-4 w-4" />
            Fotos y Adjuntos ({vehiclePhotos.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Orders List */}
        <TabsContent value="orders" className="mt-4 outline-none">
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
        </TabsContent>

        {/* Tab: Photos and Attachments Gallery */}
        <TabsContent value="gallery" className="mt-4 outline-none">
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Camera className="h-5 w-5 text-primary" />
                    Fotos y Archivos Adjuntos
                    <Badge variant="secondary" className="ml-2 font-mono">
                      {vehiclePhotos.length}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Historial fotográfico de ingresos, egresos y reparaciones asociadas al vehículo.
                  </p>
                </div>

                {/* Filters */}
                {vehiclePhotos.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filter by Category */}
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[130px] h-8 text-xs font-medium">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todas las fotos</SelectItem>
                        <SelectItem value="ENTRY">Ingreso</SelectItem>
                        <SelectItem value="EXIT">Egreso</SelectItem>
                        <SelectItem value="GENERAL">General</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Filter by Work Order */}
                    <Select value={woFilter} onValueChange={setWoFilter}>
                      <SelectTrigger className="w-[150px] h-8 text-xs font-medium font-mono">
                        <SelectValue placeholder="Orden de Trabajo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todas las OTs</SelectItem>
                        {workOrdersWithPhotos.map((wo) => (
                          <SelectItem key={wo.id} value={wo.id} className="font-mono text-xs">
                            OT #{wo.id.slice(-6).toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {(typeFilter !== "ALL" || woFilter !== "ALL") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setTypeFilter("ALL");
                          setWoFilter("ALL");
                        }}
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {vehiclePhotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-medium text-foreground">
                      Sin registro visual
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Aún no se han cargado fotos de ingreso, egreso o registros técnicos para este vehículo.
                    </p>
                  </div>
                </div>
              ) : filteredPhotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                  <p className="text-lg font-semibold">Sin resultados</p>
                  <p className="text-sm text-muted-foreground">
                    Ninguna foto coincide con los filtros de búsqueda seleccionados.
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary mt-2"
                    onClick={() => {
                      setTypeFilter("ALL");
                      setWoFilter("ALL");
                    }}
                  >
                    Restablecer filtros
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredPhotos.map((photo, index) => (
                    <div
                      key={photo.url}
                      className="group relative aspect-video overflow-hidden rounded-xl border bg-muted shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/30"
                    >
                      <img
                        src={photo.url}
                        alt={photo.description || `Foto de vehículo ${photo.workOrderCode}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                      />

                      {/* Top Overlay Badges */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-semibold tracking-wide py-0.5 px-1.5 uppercase shadow-sm border",
                            photo.type === "ENTRY"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : photo.type === "EXIT"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                          )}
                        >
                          {photo.type === "ENTRY"
                            ? "Ingreso"
                            : photo.type === "EXIT"
                              ? "Egreso"
                              : "General"}
                        </Badge>
                      </div>

                      {/* Bottom Overlay Info on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                        <div className="text-xs font-semibold font-mono flex items-center justify-between">
                          <Link
                            href={`/adm/work-orders/${photo.workOrderId}`}
                            className="hover:underline flex items-center gap-1 text-primary-foreground/90 hover:text-white"
                          >
                            OT #{photo.workOrderCode}
                          </Link>
                          <span className="text-[10px] text-white/70">
                            {new Date(photo.createdAt).toLocaleDateString("es-AR")}
                          </span>
                        </div>
                        {photo.description && (
                          <p className="text-[10px] text-white/90 line-clamp-1 mt-1 font-medium italic">
                            {photo.description}
                          </p>
                        )}

                        {/* Quick View Button */}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full h-7 text-[11px] font-semibold mt-2 bg-white text-black hover:bg-white/90"
                          onClick={() => setActivePhotoIndex(index)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ampliar Foto
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

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
              RESUMEN DE CUENTA
            </Badge>
            <p className="text-xs text-zinc-500 font-mono mt-2">
              Fecha: {new Date().toLocaleDateString("es-AR")}
            </p>
          </div>
        </div>

        {/* Información General (Cliente y Vehículo) */}
        <div className="grid grid-cols-2 gap-6 border border-zinc-300 rounded-lg p-4 mb-6">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">DATOS DEL VEHÍCULO</h3>
            <div className="grid grid-cols-3 text-sm gap-y-1">
              <span className="text-zinc-500 font-medium">Patente:</span>
              <span className="col-span-2 font-bold font-mono text-zinc-900">{vehicle.identifier}</span>

              <span className="text-zinc-500 font-medium">Categoría:</span>
              <span className="col-span-2 font-medium">{getVehicleCategoryLabel(vehicle.category)}</span>

              {(vehicle.make?.name || vehicle.model?.name) && (
                <>
                  <span className="text-zinc-500 font-medium">Marca/Mod:</span>
                  <span className="col-span-2 font-medium">
                    {vehicle.make?.name} {vehicle.model?.name}
                  </span>
                </>
              )}

              {vehicle.year && (
                <>
                  <span className="text-zinc-500 font-medium">Año:</span>
                  <span className="col-span-2 font-mono">{vehicle.year}</span>
                </>
              )}

              {vehicle.color && (
                <>
                  <span className="text-zinc-500 font-medium">Color:</span>
                  <span className="col-span-2 font-medium">{vehicle.color}</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1.5 border-l border-zinc-300 pl-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">DATOS DEL PROPIETARIO</h3>
            <div className="grid grid-cols-3 text-sm gap-y-1">
              <span className="text-zinc-500 font-medium">Nombre:</span>
              <span className="col-span-2 font-bold text-zinc-900">{vehicle.customer?.name}</span>

              {vehicle.customer?.phone && (
                <>
                  <span className="text-zinc-500 font-medium">Teléfono:</span>
                  <span className="col-span-2 font-mono">{vehicle.customer.phone}</span>
                </>
              )}

              {vehicle.customer?.email && (
                <>
                  <span className="text-zinc-500 font-medium">Email:</span>
                  <span className="col-span-2 font-mono truncate">{vehicle.customer.email}</span>
                </>
              )}
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
                <th className="py-2.5 px-3 text-left font-bold border-r border-zinc-300">Fecha de Ingreso</th>
                <th className="py-2.5 px-3 text-left font-bold border-r border-zinc-300">Estado de OT</th>
                <th className="py-2.5 px-3 text-right font-bold">Monto Total</th>
              </tr>
            </thead>
            <tbody>
              {unpaidWorkOrders.map((wo) => (
                <tr key={wo.id} className="border-b border-zinc-300">
                  <td className="py-2 px-3 font-mono font-semibold border-r border-zinc-300 text-zinc-955">
                    #{wo.id.slice(-6).toUpperCase()}
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
                  <td className="py-2 px-3 text-right font-mono font-semibold text-zinc-955">
                    {formatARS(Number(wo.total), 2)}
                  </td>
                </tr>
              ))}
              {/* Fila del Total Acumulado */}
              <tr className="bg-zinc-50 border-t-2 border-zinc-900 font-bold">
                <td colSpan={3} className="py-3 px-3 text-right text-zinc-700">
                  TOTAL DEUDA ACUMULADA:
                </td>
                <td className="py-3 px-3 text-right text-lg text-zinc-955 font-mono">
                  {formatARS(vehicleDebt, 2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Términos y Firmas */}
        <div className="mt-12">
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md text-xs text-zinc-500 mb-10 leading-relaxed">
            <p className="font-semibold text-zinc-700 mb-1">TÉRMINOS Y CONDICIONES:</p>
            <p>1. Este documento es un resumen de la cuenta corriente asociada exclusivamente al vehículo con patente <span className="font-mono font-semibold text-zinc-700">{vehicle.identifier}</span> a la fecha indicada.</p>
            <p>2. Los montos expresados corresponden a trabajos efectivamente autorizados, presupuestados o realizados sobre la unidad.</p>
            <p>3. El saldo adeudado deberá cancelarse conforme a los plazos acordados para evitar recargos o demoras en la entrega de futuros trabajos.</p>
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
          RPM Accesorios © {new Date().getFullYear()} - Documento no válido como factura fiscal.
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

      {/* Lightbox / Fullscreen Preview Modal */}
      {activePhotoIndex !== null && filteredPhotos[activePhotoIndex] && (
        <Dialog open={activePhotoIndex !== null} onOpenChange={(open) => !open && setActivePhotoIndex(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none text-white sm:rounded-2xl">
            <div className="relative w-full aspect-video flex items-center justify-center p-4 min-h-[50vh]">
              {/* Image */}
              <img
                src={filteredPhotos[activePhotoIndex].url}
                alt={filteredPhotos[activePhotoIndex].description || "Vista de detalle"}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
              />

              {/* Navigation arrows */}
              {filteredPhotos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10"
                    onClick={handlePrevPhoto}
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10"
                    onClick={handleNextPhoto}
                    aria-label="Siguiente foto"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>

            {/* Lightbox Footer Metadata */}
            <div className="bg-zinc-900 p-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] font-semibold py-0.5 px-1.5 uppercase",
                      filteredPhotos[activePhotoIndex].type === "ENTRY"
                        ? "bg-blue-500 text-white"
                        : filteredPhotos[activePhotoIndex].type === "EXIT"
                          ? "bg-amber-500 text-white"
                          : "bg-purple-500 text-white"
                    )}
                  >
                    {filteredPhotos[activePhotoIndex].type === "ENTRY"
                      ? "Ingreso"
                      : filteredPhotos[activePhotoIndex].type === "EXIT"
                        ? "Egreso"
                        : "General"}
                  </Badge>
                  <Link
                    href={`/adm/work-orders/${filteredPhotos[activePhotoIndex].workOrderId}`}
                    className="text-primary-foreground font-mono font-semibold hover:underline"
                    onClick={() => setActivePhotoIndex(null)}
                  >
                    OT #{filteredPhotos[activePhotoIndex].workOrderCode}
                  </Link>
                  <span className="text-zinc-400 font-mono text-xs">
                    • {new Date(filteredPhotos[activePhotoIndex].createdAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
                {filteredPhotos[activePhotoIndex].description && (
                  <p className="text-xs text-zinc-300 italic font-medium">
                    {filteredPhotos[activePhotoIndex].description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-100"
                  asChild
                >
                  <a
                    href={filteredPhotos[activePhotoIndex].url}
                    download={`RPM-${filteredPhotos[activePhotoIndex].workOrderCode}-${filteredPhotos[activePhotoIndex].type}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Descargar
                  </a>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white"
                  onClick={() => setActivePhotoIndex(null)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
