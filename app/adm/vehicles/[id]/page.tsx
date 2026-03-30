"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Car,
  User,
  Wrench,
  Calendar,
  Palette,
  Hash,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";
import Link from "next/link";

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
    fullName: string;
    phone: string;
  };
  make?: {
    id: string;
    name: string;
  };
  model?: {
    id: string;
    name: string;
  };
  workOrders: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
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

  const getCategoryIcon = (category: string) => {
    const isVehicle = [
      "CAR",
      "TRUCK",
      "SUV",
      "PICKUP",
      "MOTORCYCLE",
      "TRAILER",
    ].includes(category);
    return isVehicle ? <Car className="h-5 w-5" /> : <Wrench className="h-5 w-5" />;
  };

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
    <div className="container mx-auto py-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex gap-2">
          <Link href={`/adm/work-orders/new?vehicleId=${vehicleId}`}>
            <Button>
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

      <div className="grid gap-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getCategoryIcon(vehicle.category)}
                <div>
                  <CardTitle className="text-2xl">
                    {isEquipment
                      ? vehicle.equipmentName || vehicle.identifier
                      : vehicle.identifier}
                  </CardTitle>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {categoryLabels[vehicle.category] || vehicle.category}
                  </div>
                </div>
              </div>
              <Badge variant="outline">
                {vehicle.make?.name} {vehicle.model?.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">ID:</span>
                <span className="font-medium">{vehicle.identifier}</span>
              </div>
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
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="text-sm font-medium mb-1">Notas</div>
                <p className="text-sm text-muted-foreground">{vehicle.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Card */}
        {vehicle.customer && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Propietario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{vehicle.customer.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.customer.phone}
                  </p>
                </div>
                <Link href={`/adm/customers/${vehicle.customer.id}`}>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Ver Cliente
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Historial de Órdenes de Trabajo ({vehicle.workOrders.length})
            </CardTitle>
            <Link href={`/adm/work-orders/new?vehicleId=${vehicleId}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva OT
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {vehicle.workOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay órdenes de trabajo registradas
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>OT #</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicle.workOrders.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell className="font-medium">{wo.id}</TableCell>
                      <TableCell>{getStatusBadge(wo.status)}</TableCell>
                      <TableCell>
                        ${Number(wo.total).toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell>
                        {new Date(wo.createdAt).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell>
                        <Link href={`/adm/work-orders/${wo.id}`}>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
