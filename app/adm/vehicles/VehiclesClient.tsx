"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Header, CrudAdmin, CrudStats, type StatItem } from "@/components/adm";
import {
  Car,
  Eye,
  Plus,
  User,
  Tag,
  X,
  Filter,
  MessageSquare,
  Download,
  Wallet,
  TrendingDown,
  ArrowDownLeft,
} from "lucide-react";
import Link from "next/link";
import { type ColumnDef, type FilterFn } from "@tanstack/react-table";
import {
  getVehicleCategoryLabel,
  VEHICLE_CATEGORIES,
} from "@/lib/constants/vehicle-categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getWhatsAppLink } from "@/lib/utils/whatsapp";
import { formatARS } from "@/lib/utils/format";
import { getCategoryIcon } from "@/components/vehicles/CategoryIcon";
import { VehicleDialog } from "@/components/vehicles/VehicleDialog";
import { useUI } from "@/components/ui/UIProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WorkOrder {
  id: string;
  status: string;
  total: number | string;
}

interface Vehicle {
  id: string;
  identifier: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  vehicleMake: {
    name: string;
  } | null;
  vehicleModel: {
    name: string;
  } | null;
  equipmentName: string | null;
  workOrders?: WorkOrder[];
  _count: {
    workOrders: number;
  };
}

interface VehiclesClientProps {
  initialVehicles: Vehicle[];
  totalVehicles: number;
}

export default function VehiclesClient({
  initialVehicles,
  totalVehicles,
}: VehiclesClientProps) {
  const { alert } = useUI();
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [total, setTotal] = useState(totalVehicles);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showOnlyWithDebt, setShowOnlyWithDebt] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const getVehicleDebt = (v: Vehicle) => {
    if (!v.workOrders) return 0;
    return v.workOrders
      .filter((wo) => wo.status !== "PAID" && wo.status !== "CANCELLED")
      .reduce((sum, wo) => sum + Number(wo.total), 0);
  };

  const filteredVehicles = useMemo(() => {
    let result = vehicles;
    if (categoryFilter !== "all") {
      result = result.filter((v) => v.category === categoryFilter);
    }
    if (showOnlyWithDebt) {
      result = result.filter((v) => getVehicleDebt(v) > 0);
    }
    if (startDate) {
      const start = new Date(startDate + "T00:00:00");
      result = result.filter((v) => {
        if (!v.createdAt) return false;
        const vDate = new Date(v.createdAt);
        return vDate >= start;
      });
    }
    if (endDate) {
      const end = new Date(endDate + "T23:59:59");
      result = result.filter((v) => {
        if (!v.createdAt) return false;
        const vDate = new Date(v.createdAt);
        return vDate <= end;
      });
    }
    return result;
  }, [vehicles, categoryFilter, showOnlyWithDebt, startDate, endDate]);

  const exportToCSV = useCallback(() => {
    if (!filteredVehicles || filteredVehicles.length === 0) return;

    const headers = [
      "Patente / Identificador",
      "Categoría",
      "Marca",
      "Modelo",
      "Nombre de Equipo",
      "Propietario",
      "Fecha de Ingreso",
      "Deuda",
      "Cantidad de OTs",
    ];

    const rows = filteredVehicles.map((v) => {
      const isEquipment = [
        "AUDIO_EQUIPMENT",
        "ELECTRIC_SCOOTER",
        "OTHER",
        "TRAILER",
      ].includes(v.category);

      const makeName = !isEquipment && v.vehicleMake ? v.vehicleMake.name : "";
      const modelName = !isEquipment && v.vehicleModel ? v.vehicleModel.name : "";
      const equipmentName = isEquipment ? (v.equipmentName || "") : "";
      const debt = getVehicleDebt(v);
      const entryDate = v.createdAt ? new Date(v.createdAt).toLocaleDateString("es-AR") : "";

      return [
        v.identifier,
        getVehicleCategoryLabel(v.category),
        makeName,
        modelName,
        equipmentName,
        v.customer?.name || "",
        entryDate,
        debt.toString(),
        v._count.workOrders.toString(),
      ];
    });

    const csvContent = "\ufeff" + [
      headers.join(","),
      ...rows.map((r) => r.map((field) => `"${field.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte_vehiculos_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredVehicles]);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");

      const response = await fetch(`/api/vehicles?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setVehicles(data.vehicles);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const vehicleFilterFn = useCallback<FilterFn<Vehicle>>((row, id, value) => {
    if (!value) return true;
    const terms = String(value).toLowerCase().split(/[\s+]+/).filter(Boolean);
    if (terms.length === 0) return true;
    const vehicle = row.original;
    return terms.every((search) => {
      return !!(
        (vehicle.identifier?.toLowerCase() ?? "").includes(search) ||
        (vehicle.customer?.name?.toLowerCase() ?? "").includes(search) ||
        (vehicle.equipmentName?.toLowerCase() ?? "").includes(search) ||
        (vehicle.vehicleMake?.name?.toLowerCase() ?? "").includes(search) ||
        (vehicle.vehicleModel?.name?.toLowerCase() ?? "").includes(search)
      );
    });
  }, []);

  const columns = useMemo<ColumnDef<Vehicle & { id: string }>[]>(
    () => [
      {
        accessorKey: "identifier",
        header: "Identificador",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
              <Car
                className="h-4 w-4 text-primary pointer-events-none"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="font-semibold tracking-tight font-mono">
                {row.original.identifier}
              </div>
              <div className="text-[11px] text-muted-foreground uppercase">
                {getVehicleCategoryLabel(row.original.category)}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "make_model",
        header: "Marca/Modelo",
        cell: ({ row }) => {
          const isEquipment = [
            "AUDIO_EQUIPMENT",
            "ELECTRIC_SCOOTER",
            "OTHER",
            "TRAILER",
          ].includes(row.original.category);
          if (isEquipment && row.original.equipmentName) {
            return (
              <span className="font-medium">{row.original.equipmentName}</span>
            );
          }
          if (row.original.vehicleMake) {
            return (
              <span className="font-medium">
                {row.original.vehicleMake.name}{" "}
                {row.original.vehicleModel?.name || ""}
              </span>
            );
          }
          return <span className="text-muted-foreground">-</span>;
        },
      },
      {
        accessorKey: "customer.name",
        header: "Propietario",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 group/owner">
            <User
              className="h-3.5 w-3.5 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Link
              href={`/adm/customers/${row.original.customer.id}`}
              className="hover:underline font-medium text-primary"
            >
              {row.original.customer.name}
            </Link>
            {row.original.customer.phone && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={getWhatsAppLink(
                      row.original.customer.phone,
                      `Hola ${row.original.customer.name}!`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-md hover:bg-emerald-50 text-emerald-700 opacity-0 group-hover/owner:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Enviar WhatsApp a ${row.original.customer.name}`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>Enviar WhatsApp</TooltipContent>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        id: "createdAt",
        header: "Fecha Ingreso",
        accessorFn: (row) => row.createdAt,
        cell: ({ row }) => {
          const date = row.original.createdAt;
          if (!date) return <span className="text-muted-foreground">-</span>;
          return (
            <span className="font-mono text-xs text-muted-foreground">
              {new Date(date).toLocaleDateString("es-AR")}
            </span>
          );
        },
      },
      {
        id: "debt",
        header: "Deuda",
        cell: ({ row }) => {
          const debt = getVehicleDebt(row.original);
          if (debt === 0) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <span className="font-mono font-semibold text-red-700">
              {formatARS(debt, 2)}
            </span>
          );
        },
      },
      {
        accessorKey: "_count.workOrders",
        header: "OTs",
        cell: ({ row }) => (
          <span className="font-mono font-medium">
            {row.original._count.workOrders}
          </span>
        ),
      },
    ],
    [],
  );

  const stats: StatItem[] = useMemo(
    () => {
      const vehiclesWithDebt = vehicles.filter((v) => getVehicleDebt(v) > 0);
      const totalDebtValue = vehicles.reduce((acc, v) => acc + getVehicleDebt(v), 0);

      return [
        {
          label: "Total Vehículos",
          value: total,
          icon: Car,
          iconColor: "#3b82f6", // blue-500
        },
        {
          label: "Categorías Activas",
          value: new Set(vehicles.map((v) => v.category)).size,
          icon: Tag,
          iconColor: "#10b981", // emerald-500
        },
        {
          label: "Con Deuda",
          value: vehiclesWithDebt.length,
          icon: Wallet,
          iconColor: vehiclesWithDebt.length > 0 ? "#f97316" : undefined, // orange-500 if someone owes
        },
        {
          label: "Deuda Total",
          value: formatARS(totalDebtValue, 2),
          icon: TrendingDown,
          iconColor: "#ef4444", // red-500
        },
      ];
    },
    [total, vehicles],
  );

  const headerSecondaryActions = useMemo(() => {
    const actions: any[] = [
      {
        label: showOnlyWithDebt ? "Ver Todos" : "Filtrar con Deuda",
        onClick: () => setShowOnlyWithDebt(!showOnlyWithDebt),
        variant: "outline" as const,
        icon: TrendingDown,
      },
      {
        label: "Exportar CSV",
        onClick: exportToCSV,
        variant: "outline" as const,
        icon: Download,
      },
    ];
    return actions;
  }, [showOnlyWithDebt, exportToCSV]);

  return (
    <div className="space-y-6">
      <Header
        title="Vehículos y Equipos"
        description="Gestión centralizada de vehículos de clientes y equipamiento técnico"
        secondaryActions={headerSecondaryActions}
      >
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="relative group">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"
              aria-hidden="true"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="pl-9 h-9 w-[200px] bg-background">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {VEHICLE_CATEGORIES.map((cat) => {
                  const Icon = getCategoryIcon(cat.value);
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <Icon className="h-4 w-4 mr-2 inline-block align-text-bottom" />
                      {cat.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ingreso desde:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-[140px] bg-background text-xs"
              aria-label="Fecha de ingreso desde"
            />
            <span className="text-xs text-muted-foreground">hasta:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-[140px] bg-background text-xs"
              aria-label="Fecha de ingreso hasta"
            />
          </div>

          {(categoryFilter !== "all" || showOnlyWithDebt || !!startDate || !!endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategoryFilter("all");
                setShowOnlyWithDebt(false);
                setStartDate("");
                setEndDate("");
              }}
              className="h-9 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </Header>

      <div className="mt-4">
        <CrudStats stats={stats} />
      </div>

      <CrudAdmin<Vehicle & { id: string }>
        items={filteredVehicles as any}
        loading={loading}
        onCreate={() => setIsCreateModalOpen(true)}
        columns={columns}
        filterFn={vehicleFilterFn as any}
        hasActiveFilters={categoryFilter !== "all" || showOnlyWithDebt || !!startDate || !!endDate}
        emptyIcon={
          <Car className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
        }
        emptyMessage="No se encontraron vehículos o equipos registrados."
        tableTitle="Base de Datos de Vehículos"
        createButtonText="Nuevo Vehículo"
        searchPlaceholder="Buscar por patente o dueño..."
        onExport={exportToCSV}
        rowActions={(vehicle) => {
          const debt = getVehicleDebt(vehicle);
          return (
            <div className="flex items-center gap-1">
              {debt > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setPaymentAmount(debt.toString());
                        setPaymentNotes(`Pago de saldo deudor del vehículo ${vehicle.identifier}`);
                        setPaymentMethod("CASH");
                        setIsPaymentModalOpen(true);
                      }}
                      aria-label={`Registrar pago para vehículo ${vehicle.identifier}`}
                    >
                      <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Registrar Pago</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/adm/vehicles/${vehicle.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Ver detalle del vehículo"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Ver detalle</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/adm/work-orders/new?vehicleId=${vehicle.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                      aria-label="Crear nueva Orden de Trabajo"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Nueva OT</TooltipContent>
              </Tooltip>
            </div>
          );
        }}
      />

      <VehicleDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchVehicles}
      />

      {/* Modal de Pago */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Propietario: {selectedVehicle?.customer?.name}
              <br />
              Deuda de este vehículo: {selectedVehicle && formatARS(getVehicleDebt(selectedVehicle), 2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="payment-amount">Monto a Abonar *</Label>
                {selectedVehicle && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setPaymentAmount(getVehicleDebt(selectedVehicle).toString())}
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
                placeholder="Ej: 5000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="font-mono"
              />
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
                setSelectedVehicle(null);
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

                if (!selectedVehicle?.customer) return;

                setIsSubmittingPayment(true);
                try {
                  const res = await fetch(
                    `/api/customers/${selectedVehicle.customer.id}/payments`,
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
                    setSelectedVehicle(null);
                    fetchVehicles(); // Refresh vehicles list
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
    </div>
  );
}
