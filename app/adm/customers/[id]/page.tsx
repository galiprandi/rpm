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
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  Car,
  Wrench,
  Trash2,
} from "lucide-react";
import Link from "next/link";

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

interface CustomerDetail {
  id: string;
  fullName: string;
  phone: string;
  phoneAlt?: string;
  email?: string;
  documentType?: string;
  documentNumber?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async () => {
    if (!confirm("¿Está seguro de eliminar este cliente?")) return;

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      router.push("/adm/customers");
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Error al eliminar cliente");
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

  // Columnas para DataTable de vehículos
  const vehicleColumns: ColumnDef<Vehicle>[] = useMemo(
    () => [
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
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Link href={`/adm/vehicles/${row.original.id}`}>
              <Button variant="outline" size="sm">
                Ver
              </Button>
            </Link>
            <Link href={`/adm/work-orders/new?vehicleId=${row.original.id}`}>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ),
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
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <Link href={`/adm/work-orders/${row.original.id}`}>
            <Button variant="outline" size="sm">
              Ver
            </Button>
          </Link>
        ),
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
      {/* Header Estándar */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{customer.fullName}</h1>
          <p className="text-muted-foreground">
            Cliente desde {new Date(customer.createdAt).toLocaleDateString("es-AR")}
          </p>
          {/* Contactos clickeables */}
          <div className="flex flex-wrap gap-4 mt-2">
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-1 text-sm hover:underline text-primary"
            >
              <Phone className="h-4 w-4" /> {customer.phone}
            </a>
            {customer.phoneAlt && (
              <a
                href={`tel:${customer.phoneAlt}`}
                className="flex items-center gap-1 text-sm hover:underline text-primary"
              >
                <Phone className="h-4 w-4" /> {customer.phoneAlt} (alt)
              </a>
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
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Link href={`/adm/vehicles/new?customerId=${customerId}`}>
            <Button className="bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="h-4 w-4 mr-2" />
              Crear Vehículo
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehículos y Equipos ({customer.vehicles.length})
          </CardTitle>
          <Link href={`/adm/vehicles/new?customerId=${customerId}`}>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {customer.vehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay vehículos registrados
            </div>
          ) : (
            <DataTable
              data={customer.vehicles}
              columns={vehicleColumns}
              enableGlobalFilter={true}
              globalFilterPlaceholder="Buscar vehículo..."
            />
          )}
        </CardContent>
      </Card>

      {/* Historial de OTs - DataTable */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Historial de Órdenes de Trabajo ({customer.workOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customer.workOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay órdenes de trabajo registradas
            </div>
          ) : (
            <DataTable
              data={customer.workOrders}
              columns={workOrderColumns}
              enableGlobalFilter={true}
              globalFilterPlaceholder="Buscar OT..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
