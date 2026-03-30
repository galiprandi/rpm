"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface CustomerDetail {
  id: string;
  fullName: string;
  phone: string;
  phoneAlt?: string;
  email?: string;
  documentType: string;
  documentNumber: string;
  address?: string;
  notes?: string;
  createdAt: string;
  vehicles: Array<{
    id: string;
    identifier: string;
    category: string;
    make?: { name: string };
    model?: { name: string };
    year?: number;
  }>;
  workOrders: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
    vehicle: { identifier: string };
  }>;
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
    <div className="container mx-auto py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/adm/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/adm/work-orders/new?customerId=${customerId}`}>
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
              <div>
                <CardTitle className="text-2xl">{customer.fullName}</CardTitle>
                <div className="mt-2 text-sm text-muted-foreground">
                  Cliente desde {new Date(customer.createdAt).toLocaleDateString("es-AR")}
                </div>
              </div>
              <Badge variant="outline">
                {customer.documentType} {customer.documentNumber}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
              {customer.phoneAlt && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phoneAlt} (alt)</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
            {customer.notes && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <FileText className="h-4 w-4" />
                  Notas
                </div>
                <p className="text-sm text-muted-foreground">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="vehicles">
          <TabsList>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehículos ({customer.vehicles.length})
            </TabsTrigger>
            <TabsTrigger value="workorders" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Órdenes de Trabajo ({customer.workOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Vehículos y Equipos</CardTitle>
                <Link href={`/adm/vehicles/new?customerId=${customerId}`}>
                  <Button size="sm">
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Identificador</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Marca/Modelo</TableHead>
                        <TableHead>Año</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">
                            {vehicle.identifier}
                          </TableCell>
                          <TableCell>{vehicle.category}</TableCell>
                          <TableCell>
                            {vehicle.make?.name} {vehicle.model?.name}
                          </TableCell>
                          <TableCell>{vehicle.year || "-"}</TableCell>
                          <TableCell>
                            <Link href={`/adm/vehicles/${vehicle.id}`}>
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
          </TabsContent>

          <TabsContent value="workorders">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Órdenes de Trabajo</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.workOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay órdenes de trabajo registradas
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>OT #</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.workOrders.map((wo) => (
                        <TableRow key={wo.id}>
                          <TableCell className="font-medium">{wo.id}</TableCell>
                          <TableCell>{wo.vehicle.identifier}</TableCell>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
