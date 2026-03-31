"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUI } from "@/components/ui/UIProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Camera,
  Clock,
  DollarSign,
  FileText,
  Phone,
  Mail,
} from "lucide-react";
import Image from "next/image";
import { Header } from "@/components/adm/Header";

const STATUSES = [
  { id: "CONFIRMED", label: "Confirmada", color: "bg-blue-100" },
  { id: "WAITING", label: "En Espera", color: "bg-yellow-100" },
  { id: "IN_PROGRESS", label: "En Proceso", color: "bg-orange-100" },
  { id: "QC_CHECK", label: "Control QC", color: "bg-purple-100" },
  { id: "READY", label: "Listo", color: "bg-green-100" },
  { id: "PAID", label: "Pagada", color: "bg-emerald-100" },
  { id: "DELIVERED", label: "Entregada", color: "bg-gray-100" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "QR", label: "QR" },
  { value: "CARD", label: "Tarjeta" },
  { value: "OTHER", label: "Otro" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _paymentMethods = PAYMENT_METHODS;

interface WorkOrderDetail {
  id: string;
  status: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    billingData?: {
      cuit: string;
      invoiceType: string;
    };
  };
  vehicle: {
    id: string;
    identifier: string;
    category: string;
    make?: { name: string };
    model?: { name: string };
    year?: number;
    color?: string;
  };
  technicianId?: string;
  items: Array<{
    id: string;
    type: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product?: { name: string };
    service?: { name: string };
  }>;
  entryChecklist?: {
    items: Array<{ id: string; label: string; checked: boolean }>;
    completedAt: string;
  };
  exitChecklist?: {
    items: Array<{ id: string; label: string; checked: boolean }>;
    completedAt: string;
  };
  entryPhotos: string[];
  exitPhotos: string[];
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  deliveredAt?: string;
  paymentMethod?: string;
  paymentNotes?: string;
  total: number;
  totalProducts: number;
  totalServices: number;
  notes: string;
  createdAt: string;
}

export default function WorkOrderDetailPage() {
  const { alert } = useUI();
  const params = useParams();
  const workOrderId = params.id as string;

  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchWorkOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setWorkOrder(data);
    } catch (error) {
      console.error("Error fetching work order:", error);
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    fetchWorkOrder();
  }, [fetchWorkOrder]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      const updated = await response.json();
      setWorkOrder((prev) => (prev ? { ...prev, ...updated } : null));
    } catch (error) {
      console.error("Error updating status:", error);
      await alert({
        title: 'Error',
        description: 'Error al actualizar estado. Por favor intente nuevamente.',
        variant: 'error',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Cargando...</div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Orden de trabajo no encontrada</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header - Vehículo como protagonista */}
      <Header
        title={workOrder.vehicle.identifier}
        leftActions={
          <select
            value={workOrder.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updatingStatus}
            className="w-44 h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            {STATUSES.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        }
      >
        {/* Línea 1: Info del vehículo */}
        <div className="text-muted-foreground">
          {[workOrder.vehicle.make?.name, workOrder.vehicle.model?.name, workOrder.vehicle.year, workOrder.vehicle.color].filter(Boolean).join(" ")}
        </div>
        
        {/* Línea 2: Contacto del cliente */}
        <div className="flex flex-wrap items-center gap-3 text-sm mt-1">
          <a
            href={`tel:${workOrder.customer?.phone}`}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            {workOrder.customer?.name}
            <Phone className="h-4 w-4" />
            {workOrder.customer?.phone}
          </a>
          {workOrder.customer?.email && (
            <a
              href={`mailto:${workOrder.customer.email}`}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {workOrder.customer.email}
            </a>
          )}
        </div>
      </Header>

      {/* Totals Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Servicios y Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrder.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Sin items registrados
                  </TableCell>
                </TableRow>
              ) : (
                workOrder.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product?.name || item.service?.name || item.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.type === "PRODUCT" ? "default" : "secondary"}>
                        {item.type === "PRODUCT" ? "Producto" : "Servicio"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      ${Number(item.unitPrice).toLocaleString("es-AR")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(item.subtotal).toLocaleString("es-AR")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {workOrder.items.length > 0 && (
            <div className="mt-4 flex justify-end pt-4 border-t">
              <div className="text-right space-y-1">
                <div className="text-sm text-muted-foreground">
                  Productos: ${Number(workOrder.totalProducts).toLocaleString("es-AR")}
                </div>
                <div className="text-sm text-muted-foreground">
                  Servicios: ${Number(workOrder.totalServices).toLocaleString("es-AR")}
                </div>
                <div className="text-2xl font-bold pt-1">
                  Total: ${Number(workOrder.total).toLocaleString("es-AR")}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Checklists, Fotos, Timeline */}
      <Tabs defaultValue="checklist">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Checklists
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Fotos
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          {workOrder.notes && (
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="checklist" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Checklist de Ingreso</CardTitle>
              </CardHeader>
              <CardContent>
                {workOrder.entryChecklist ? (
                  <div className="space-y-2">
                    {workOrder.entryChecklist.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="checkbox" checked={item.checked} readOnly className="rounded" />
                        <span className={item.checked ? "" : "text-muted-foreground"}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground mt-4">
                      Completado: {new Date(workOrder.entryChecklist.completedAt).toLocaleString("es-AR")}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Sin checklist de ingreso</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Checklist de Calidad (Salida)</CardTitle>
              </CardHeader>
              <CardContent>
                {workOrder.exitChecklist ? (
                  <div className="space-y-2">
                    {workOrder.exitChecklist.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="checkbox" checked={item.checked} readOnly className="rounded" />
                        <span className={item.checked ? "" : "text-muted-foreground"}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground mt-4">
                      Completado: {new Date(workOrder.exitChecklist.completedAt).toLocaleString("es-AR")}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Sin checklist de calidad</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fotos de Ingreso</CardTitle>
              </CardHeader>
              <CardContent>
                {workOrder.entryPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {workOrder.entryPhotos.map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt={`Ingreso ${index + 1}`}
                        width={300}
                        height={160}
                        className="rounded-md max-h-40 object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground">Sin fotos de ingreso</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fotos de Egreso</CardTitle>
              </CardHeader>
              <CardContent>
                {workOrder.exitPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {workOrder.exitPhotos.map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt={`Egreso ${index + 1}`}
                        width={300}
                        height={160}
                        className="rounded-md max-h-40 object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground">Sin fotos de egreso</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <div>
                    <div className="font-medium">OT Creada</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(workOrder.createdAt).toLocaleString("es-AR")}
                    </div>
                  </div>
                </div>
                {workOrder.scheduledDate && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <div className="font-medium">Turno Agendado</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(workOrder.scheduledDate).toLocaleString("es-AR")}
                      </div>
                    </div>
                  </div>
                )}
                {workOrder.startedAt && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <div>
                      <div className="font-medium">Trabajo Iniciado</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(workOrder.startedAt).toLocaleString("es-AR")}
                      </div>
                    </div>
                  </div>
                )}
                {workOrder.completedAt && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <div className="font-medium">Trabajo Completado</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(workOrder.completedAt).toLocaleString("es-AR")}
                      </div>
                    </div>
                  </div>
                )}
                {workOrder.deliveredAt && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <div>
                      <div className="font-medium">Entregado al Cliente</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(workOrder.deliveredAt).toLocaleString("es-AR")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {workOrder.notes && (
          <TabsContent value="notes" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <p className="whitespace-pre-wrap">{workOrder.notes}</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
