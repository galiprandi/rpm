"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowLeft,
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
  description?: string;
  notes?: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  make?: {
    id: string;
    name: string;
  };
  model?: {
    id: string;
    name: string;
  };
  workOrders: WorkOrder[];
}

const categoryLabels: Record<string, string> = {
  CAR: "Auto",
  TRUCK: "Camión",
  SUV: "SUV",
  PICKUP: "Pickup",
  MOTORCYCLE: "Moto",
  TRAILER: "Trailer",
  AUDIO_EQUIPMENT: "Equipo de Audio",
  ELECTRIC_SCOOTER: "Monopatín Eléctrico",
  OTHER: "Otro",
};

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVehicle = useCallback(async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setVehicle(data);
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
    if (!confirm("¿Está seguro de eliminar este vehículo/equipo?")) return;

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      router.push("/adm/customers");
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      alert("Error al eliminar vehículo");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      CONFIRMED: "bg-blue-100 text-blue-800",
      WAITING: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-orange-100 text-orange-800",
      QC_CHECK: "bg-purple-100 text-purple-800",
      READY: "bg-green-100 text-green-800",
      PAID: "bg-emerald-100 text-emerald-800",
      DELIVERED: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={statusColors[status] || "bg-gray-100"}>
        {status}
      </Badge>
    );
  };

  // Columnas para DataTable de OTs
  const workOrderColumns: ColumnDef<WorkOrder>[] = useMemo(
    () => [
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

  const workOrderRowActions = useCallback(
    (row: WorkOrder) => (
      <Link href={`/adm/work-orders/${row.id}`}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
    ),
    []
  );

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Cargando...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Vehículo/Equipo no encontrado</div>
      </div>
    );
  }

  const isEquipment =
    vehicle.category === "AUDIO_EQUIPMENT" ||
    vehicle.category === "ELECTRIC_SCOOTER" ||
    vehicle.category === "OTHER";

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Estándar */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            {isEquipment
              ? vehicle.equipmentName || vehicle.identifier
              : vehicle.identifier}
          </h1>
          <p className="text-muted-foreground">
            {categoryLabels[vehicle.category] || vehicle.category}
            {vehicle.make?.name && ` • ${vehicle.make.name} ${vehicle.model?.name || ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Link href={`/adm/work-orders/new?vehicleId=${vehicleId}`}>
            <Button className="bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="h-4 w-4 mr-2" />
              Nueva OT
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5" />
              Información del Vehículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {!isEquipment && vehicle.year && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Año:</span>
                  <span className="font-medium">{vehicle.year}</span>
                </div>
              )}
              {vehicle.color && (
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Color:</span>
                  <span className="font-medium">{vehicle.color}</span>
                </div>
              )}
              {isEquipment && vehicle.equipmentType && (
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{vehicle.equipmentType}</span>
                </div>
              )}
            </div>
            {vehicle.notes && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm font-medium mb-1">Notas</div>
                <p className="text-sm text-muted-foreground">{vehicle.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Card - Contactos Accionables */}
        {vehicle.customer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Propietario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-lg">{vehicle.customer.name}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`tel:${vehicle.customer.phone}`}
                  className="flex items-center gap-1 text-sm hover:underline text-primary"
                >
                  <Phone className="h-4 w-4" /> {vehicle.customer.phone}
                </a>
                {vehicle.customer.email && (
                  <a
                    href={`mailto:${vehicle.customer.email}`}
                    className="flex items-center gap-1 text-sm hover:underline text-primary"
                  >
                    <Mail className="h-4 w-4" /> {vehicle.customer.email}
                  </a>
                )}
              </div>
              <Link href={`/adm/customers/${vehicle.customer.id}`}>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Ver Ficha Cliente
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Work Orders - DataTable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Historial de Órdenes de Trabajo ({vehicle.workOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicle.workOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay órdenes de trabajo registradas
            </div>
          ) : (
            <DataTable
              data={vehicle.workOrders}
              columns={workOrderColumns}
              rowActions={workOrderRowActions}
              title="Órdenes de Trabajo"
              enableGlobalFilter={true}
              globalFilterPlaceholder="Buscar OT..."
              headerActions={[
                {
                  label: "OT",
                  onClick: () => router.push(`/adm/work-orders/new?vehicleId=${vehicleId}`),
                  icon: Plus,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
