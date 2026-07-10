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
} from "lucide-react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
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

interface Vehicle {
  id: string;
  identifier: string;
  category: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  vehicle_make: {
    name: string;
  } | null;
  vehicle_model: {
    name: string;
  } | null;
  equipmentName: string | null;
  _count: {
    work_order: number;
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
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [total, setTotal] = useState(totalVehicles);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const filteredVehicles = useMemo(() => {
    if (categoryFilter === "all") return vehicles;
    return vehicles.filter((v) => v.category === categoryFilter);
  }, [vehicles, categoryFilter]);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch more data if needed or refresh
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

  const columns = useMemo<ColumnDef<Vehicle & { id: string }>[]>(
    () => [
      {
        accessorKey: "identifier",
        header: "Identificador",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {/* Standardized List Row Entity Pattern */}
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
              <div className="text-[10px] text-muted-foreground uppercase">
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
          if (row.original.vehicle_make) {
            return (
              <span className="font-medium">
                {row.original.vehicle_make.name}{" "}
                {row.original.vehicle_model?.name || ""}
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
        accessorKey: "_count.work_order",
        header: "OTs",
        cell: ({ row }) => (
          <span className="font-mono font-medium">
            {row.original._count.work_order}
          </span>
        ),
      },
    ],
    [],
  );

  const stats: StatItem[] = useMemo(
    () => [
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
    ],
    [total, vehicles],
  );

  return (
    <div className="space-y-6">
      <Header
        title="Vehículos y Equipos"
        description="Gestión centralizada de vehículos de clientes y equipamiento técnico"
      >
        <div className="flex items-center gap-2 mt-4">
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
                {VEHICLE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {categoryFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategoryFilter("all")}
              className="h-9 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar filtro
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
        columns={columns}
        emptyIcon={
          <Car className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
        }
        emptyMessage="No se encontraron vehículos o equipos registrados."
        tableTitle="Base de Datos de Vehículos"
        createButtonText="Nuevo Vehículo"
        searchPlaceholder="Buscar por patente o dueño..."
        rowActions={(vehicle) => (
          <div className="flex items-center gap-1">
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
        )}
      />
    </div>
  );
}
