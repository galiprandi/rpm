"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentDialog } from "@/components/work-orders/PaymentDialog";
import { FuelLevelSlider } from "@/components/work-orders/FuelLevelSlider";
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
  Check,
  Phone,
  Mail,
  Edit,
  X,
  Loader2,
  Undo2,
} from "lucide-react";
import { ProductServiceSelector, SelectedItem } from "@/components/ui/ProductServiceSelector";
import Image from "next/image";
import { Header } from "@/components/adm/Header";
import { cn } from "@/lib/utils";
import { CustomerCreditNoteDialog } from "@/components/credit-notes/CustomerCreditNoteDialog";

// Timeline Item Component
function TimelineItem({
  title,
  date,
  status,
  isFirst = false,
  isLast = false,
}: {
  title: string;
  date: string;
  status: "completed" | "pending";
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        {!isFirst && <div className="w-px h-3 bg-border" />}
        <div
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
            status === "completed"
              ? "bg-green-500 text-white"
              : "bg-muted border-2 border-muted-foreground/30"
          )}
        >
          {status === "completed" && <Check className="h-3 w-3" />}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border min-h-[24px]" />}
      </div>
      <div className={cn("pb-4", isLast && "pb-0")}>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(date).toLocaleString("es-AR", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

const STATUSES = [
  { id: "CONFIRMED", label: "Confirmada", color: "bg-blue-100" },
  { id: "WAITING", label: "En Espera", color: "bg-yellow-100" },
  { id: "IN_PROGRESS", label: "En Proceso", color: "bg-orange-100" },
  { id: "QC_CHECK", label: "Control QC", color: "bg-purple-100" },
  { id: "READY", label: "Listo", color: "bg-green-100" },
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
  work_order_item: Array<{
    id: string;
    type: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    priceListId?: string;
    productId?: string;
    serviceId?: string;
    isManualPrice: boolean;
    product?: { name: string };
    service?: { name: string };
  }>;
  entryChecklist?: {
    items: Array<{ id: string; label: string; checked: boolean }>;
    completedAt: string;
    odometerValue?: number;
    fuelLevel?: number;
  };
  exitChecklist?: {
    items: Array<{ id: string; label: string; checked: boolean }>;
    completedAt: string;
    odometerValue?: number;
    fuelLevel?: number;
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
  odometerValue?: number;
  fuelLevel?: number;
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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Array<{
    id: string;
    amount: number;
    notes: string | null;
    createdAt: string;
    paymentMethod: { name: string };
  }>>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [editingChecklist, setEditingChecklist] = useState<'entry' | 'exit' | null>(null);
  const [editingOdometer, setEditingOdometer] = useState<number | undefined>(undefined);
  const [editingFuelLevel, setEditingFuelLevel] = useState<number | undefined>(undefined);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [editingScheduledDate, setEditingScheduledDate] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [newScheduledDate, setNewScheduledDate] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [isCashOpen, setIsCashOpen] = useState<boolean | null>(null);
  
  // Items editing state
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editableItems, setEditableItems] = useState<SelectedItem[]>([]);
  const [priceLists, setPriceLists] = useState<{ id: string; name: string; baseMarginPercentage: number }[]>([]);
  const [savingItems, setSavingItems] = useState(false);
  const [isCreditNoteDialogOpen, setIsCreditNoteDialogOpen] = useState(false);

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

  const fetchPayments = useCallback(async () => {
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}/payments`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setTotalPaid(data.totalPaid || 0);
      }

      // Check cash status
      const cashRes = await fetch('/api/cash/status');
      if (cashRes.ok) {
        const data = await cashRes.json();
        setIsCashOpen(data.status === 'OPEN');
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  }, [workOrderId]);

  // Fetch price lists for item editing
  useEffect(() => {
    const fetchPriceLists = async () => {
      try {
        const response = await fetch('/api/price-lists');
        if (response.ok) {
          const data = await response.json();
          setPriceLists(data.priceLists || []);
        }
      } catch (error) {
        console.error('Error fetching price lists:', error);
      }
    };
    fetchPriceLists();
  }, []);

  useEffect(() => {
    fetchWorkOrder();
    fetchPayments();
  }, [fetchWorkOrder, fetchPayments]);

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

  const handleSaveChecklistData = async () => {
    if (!editingChecklist) return;
    
    setSavingChecklist(true);
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editingChecklist,
          odometerValue: editingOdometer,
          fuelLevel: editingFuelLevel,
        }),
      });

      if (!response.ok) throw new Error("Failed to update checklist data");

      const updated = await response.json();
      setWorkOrder((prev) => (prev ? { ...prev, ...updated } : null));
      setEditingChecklist(null);
      setEditingOdometer(undefined);
      setEditingFuelLevel(undefined);
      
      await alert({
        title: 'Éxito',
        description: 'Datos actualizados correctamente',
        variant: 'success',
      });
    } catch (error) {
      console.error("Error updating checklist data:", error);
      await alert({
        title: 'Error',
        description: 'Error al actualizar datos. Por favor intente nuevamente.',
        variant: 'error',
      });
    } finally {
      setSavingChecklist(false);
    }
  };

  const startEditingChecklist = (type: 'entry' | 'exit') => {
    const checklist = type === 'entry' ? workOrder?.entryChecklist : workOrder?.exitChecklist;
    setEditingChecklist(type);
    setEditingOdometer(checklist?.odometerValue ?? workOrder?.odometerValue);
    setEditingFuelLevel(checklist?.fuelLevel ?? workOrder?.fuelLevel);
  };

  // Items editing handlers
  const startEditingItems = () => {
    if (!workOrder) return;
    
    // Map work_order_item to SelectedItem format
    const mappedItems = workOrder.work_order_item.map(item => ({
      id: item.type === 'PRODUCT' ? item.productId! : item.serviceId!,
      type: item.type.toLowerCase() as 'product' | 'service',
      name: item.product?.name || item.service?.name || item.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      originalPrice: Number(item.unitPrice),
      isManualPrice: item.isManualPrice,
      priceListId: item.priceListId,
    }));
    
    setEditableItems(mappedItems);
    setIsEditingItems(true);
  };

  const handleSaveItems = async () => {
    setSavingItems(true);
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: editableItems }),
      });

      if (!response.ok) throw new Error('Failed to update items');
      
      setIsEditingItems(false);
      fetchWorkOrder(); // Refresh data
    } catch (error) {
      console.error('Error updating items:', error);
      await alert({
        title: 'Error',
        description: 'Error al actualizar items. Por favor intente nuevamente.',
        variant: 'error',
      });
    } finally {
      setSavingItems(false);
    }
  };

  const handleCancelItems = () => {
    setIsEditingItems(false);
    setEditableItems([]);
  };

  const handleUpdateScheduledDate = async () => {
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: newScheduledDate }),
      });

      if (!response.ok) throw new Error("Failed to update scheduled date");

      const updated = await response.json();
      setWorkOrder((prev) => (prev ? { ...prev, ...updated } : null));
      setEditingScheduledDate(false);
      
      await alert({
        title: 'Éxito',
        description: 'Fecha agendada actualizada',
        variant: 'success',
      });
    } catch (error) {
      console.error("Error updating scheduled date:", error);
      await alert({
        title: 'Error',
        description: 'Error al actualizar fecha agendada',
        variant: 'error',
      });
    }
  };

  const handleUpdateNotes = async () => {
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: newNotes }),
      });

      if (!response.ok) throw new Error("Failed to update notes");

      const updated = await response.json();
      setWorkOrder((prev) => (prev ? { ...prev, ...updated } : null));
      setEditingNotes(false);
      
      await alert({
        title: 'Éxito',
        description: 'Notas actualizadas',
        variant: 'success',
      });
    } catch (error) {
      console.error("Error updating notes:", error);
      await alert({
        title: 'Error',
        description: 'Error al actualizar notas',
        variant: 'error',
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const startEditingScheduledDate = () => {
    setNewScheduledDate(workOrder?.scheduledDate ? new Date(workOrder.scheduledDate).toISOString().slice(0, 16) : '');
    setEditingScheduledDate(true);
  };

  const startEditingNotes = () => {
    setNewNotes(workOrder?.notes || '');
    setEditingNotes(true);
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
        showBackButton
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
        secondaryActions={[
          {
            label: 'Devolver',
            onClick: () => setIsCreditNoteDialogOpen(true),
            variant: 'outline',
            icon: Undo2,
            ariaLabel: 'Crear nota de crédito por devolución',
          },
        ]}
      >
        {/* Línea 1: Info del vehículo */}
        <div className="text-muted-foreground">
          {[workOrder.vehicle.make?.name, workOrder.vehicle.model?.name, workOrder.vehicle.year, workOrder.vehicle.color].filter(Boolean).join(" ")}
        </div>
        
        {/* Línea 2: Fecha agendada si existe */}
        {workOrder.scheduledDate && (
          <div className="text-sm mt-1">
            {editingScheduledDate ? (
              <div className="flex items-center gap-2">
                <Input
                  type="datetime-local"
                  value={newScheduledDate}
                  onChange={(e) => setNewScheduledDate(e.target.value)}
                  className="h-8 w-48"
                />
                <Button size="sm" onClick={handleUpdateScheduledDate}>
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingScheduledDate(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  📅 Agendado: {new Date(workOrder.scheduledDate).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <Button variant="ghost" size="sm" onClick={() => startEditingScheduledDate()}>
                  Editar
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Línea 3: Contacto del cliente */}
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

      {/* Servicios y Productos - Editable con ProductServiceSelector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Servicios y Productos
            </CardTitle>
            {!isEditingItems && workOrder.status !== 'DELIVERED' && (
              <Button variant="outline" size="sm" onClick={startEditingItems}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Items
              </Button>
            )}
            {workOrder.status === 'DELIVERED' && (
              <Badge variant="secondary" className="text-muted-foreground">
                OT Entregada - No editable
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingItems ? (
            <div className="space-y-4">
              <ProductServiceSelector
                showPriceListSelector
                priceLists={priceLists}
                defaultPriceListId={workOrder.work_order_item[0]?.priceListId}
                initialItems={editableItems}
                onSelectionChange={setEditableItems}
              />
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancelItems} disabled={savingItems}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSaveItems} loading={savingItems}>
                  <Check className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </div>
          ) : (
            <>
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
                  {workOrder.work_order_item.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Sin items registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    workOrder.work_order_item.map((item) => (
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

              {workOrder.work_order_item.length > 0 && (
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Total OT</p>
                <p className="text-lg font-semibold">${Number(workOrder.total).toLocaleString("es-AR")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagado</p>
                <p className="text-lg font-semibold text-green-600">${totalPaid.toLocaleString("es-AR")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendiente</p>
                <p className={`text-lg font-semibold ${totalPaid >= workOrder.total ? 'text-green-600' : 'text-orange-600'}`}>
                  ${Math.max(0, workOrder.total - totalPaid).toLocaleString("es-AR")}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsPaymentDialogOpen(true)}
              disabled={isCashOpen === false}
              title={isCashOpen === false ? 'Debe abrir la caja para registrar pagos' : undefined}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium mb-3">Historial de Pagos</p>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">${Number(payment.amount).toLocaleString("es-AR")}</p>
                      <p className="text-xs text-muted-foreground">{payment.paymentMethod.name}</p>
                      {payment.notes && <p className="text-xs text-muted-foreground">{payment.notes}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        workOrderId={workOrderId}
        workOrderTotal={workOrder.total}
        onPaymentRegistered={() => {
          fetchPayments();
          fetchWorkOrder();
        }}
      />

      {/* Tabs Section */}
      <Tabs defaultValue="checklists" className="w-full">
          <TabsList variant="line" className="w-full justify-start border-b bg-transparent p-0 h-10">
            <TabsTrigger value="checklists" className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Checklists</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Fotos</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Historial</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Checklists */}
          <TabsContent value="checklists" className="pt-4 outline-none">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Checklist de Ingreso
                  </CardTitle>
                  {workOrder.entryChecklist && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditingChecklist('entry')}
                    >
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {workOrder.entryChecklist ? (
                  <div className="space-y-3">
                    {/* Odometer and Fuel Level */}
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      {editingChecklist === 'entry' ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium w-24">Kilometraje:</label>
                            <Input
                              type="number"
                              value={editingOdometer ?? ''}
                              onChange={(e) => setEditingOdometer(e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="km"
                              className="h-8"
                            />
                          </div>
                          <FuelLevelSlider
                            value={editingFuelLevel ?? 0}
                            onChange={setEditingFuelLevel}
                          />
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={handleSaveChecklistData} loading={savingChecklist}>
                              Guardar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingChecklist(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {(workOrder.entryChecklist.odometerValue ?? workOrder.odometerValue) && (
                            <div className="text-xs">
                              <span className="font-medium">Kilometraje:</span> {workOrder.entryChecklist.odometerValue ?? workOrder.odometerValue} km
                            </div>
                          )}
                          {(workOrder.entryChecklist.fuelLevel ?? workOrder.fuelLevel) && (
                            <div className="text-xs">
                              <span className="font-medium">Combustible:</span> {workOrder.entryChecklist.fuelLevel ?? workOrder.fuelLevel}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Checklist Items */}
                    {workOrder.entryChecklist.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <input type="checkbox" checked={item.checked} readOnly className="rounded mt-0.5" />
                        <span className={cn("text-sm", item.checked ? "" : "text-muted-foreground")}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                      Completado: {new Date(workOrder.entryChecklist.completedAt).toLocaleString("es-AR")}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground py-4">Sin checklist de ingreso registrado</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Checklist de Calidad (Salida)
                  </CardTitle>
                  {workOrder.exitChecklist && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditingChecklist('exit')}
                    >
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {workOrder.exitChecklist ? (
                  <div className="space-y-3">
                    {/* Odometer and Fuel Level */}
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      {editingChecklist === 'exit' ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium w-24">Kilometraje:</label>
                            <Input
                              type="number"
                              value={editingOdometer ?? ''}
                              onChange={(e) => setEditingOdometer(e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="km"
                              className="h-8"
                            />
                          </div>
                          <FuelLevelSlider
                            value={editingFuelLevel ?? 0}
                            onChange={setEditingFuelLevel}
                          />
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={handleSaveChecklistData} loading={savingChecklist}>
                              Guardar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingChecklist(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {(workOrder.exitChecklist.odometerValue ?? workOrder.odometerValue) && (
                            <div className="text-xs">
                              <span className="font-medium">Kilometraje:</span> {workOrder.exitChecklist.odometerValue ?? workOrder.odometerValue} km
                            </div>
                          )}
                          {(workOrder.exitChecklist.fuelLevel ?? workOrder.fuelLevel) && (
                            <div className="text-xs">
                              <span className="font-medium">Combustible:</span> {workOrder.exitChecklist.fuelLevel ?? workOrder.fuelLevel}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Checklist Items */}
                    {workOrder.exitChecklist.items.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <input type="checkbox" checked={item.checked} readOnly className="rounded mt-0.5" />
                        <span className={cn("text-sm", item.checked ? "" : "text-muted-foreground")}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                      Completado: {new Date(workOrder.exitChecklist.completedAt).toLocaleString("es-AR")}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground py-4">Sin checklist de calidad registrado</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

          {/* Tab: Photos */}
          <TabsContent value="photos" className="pt-4 outline-none">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Fotos de Ingreso
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workOrder.entryPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {workOrder.entryPhotos.map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt={`Ingreso ${index + 1}`}
                        width={300}
                        height={160}
                        className="rounded-lg max-h-40 object-cover w-full"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-8 text-center">Sin fotos de ingreso</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Fotos de Egreso
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workOrder.exitPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {workOrder.exitPhotos.map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt={`Egreso ${index + 1}`}
                        width={300}
                        height={160}
                        className="rounded-lg max-h-40 object-cover w-full"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-8 text-center">Sin fotos de egreso</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

          {/* Tab: Timeline */}
          <TabsContent value="timeline" className="pt-4 outline-none">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Historial de Estados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  <TimelineItem
                    title="OT Creada"
                    date={workOrder.createdAt}
                    status="completed"
                    isFirst
                  />
                  {workOrder.scheduledDate && (
                    <TimelineItem
                      title="Turno Agendado"
                      date={workOrder.scheduledDate}
                      status="completed"
                    />
                  )}
                  {workOrder.startedAt && (
                    <TimelineItem
                      title="Trabajo Iniciado"
                      date={workOrder.startedAt}
                      status="completed"
                    />
                  )}
                  {workOrder.completedAt && (
                    <TimelineItem
                      title="Trabajo Completado"
                      date={workOrder.completedAt}
                      status="completed"
                    />
                  )}
                  {workOrder.deliveredAt && (
                    <TimelineItem
                      title="Entregado al Cliente"
                      date={workOrder.deliveredAt}
                      status="completed"
                      isLast
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notas
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditingNotes()}
                    >
                      {workOrder.notes ? 'Editar' : 'Agregar'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="Agregar notas..."
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdateNotes} loading={savingNotes}>
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)} disabled={savingNotes}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {workOrder.notes || 'Sin notas'}
                    </p>
                  )}
                </CardContent>
              </Card>
          </div>
        </TabsContent>
      </Tabs>

      {workOrder.customer && (
        <CustomerCreditNoteDialog
          open={isCreditNoteDialogOpen}
          onOpenChange={setIsCreditNoteDialogOpen}
          customerId={workOrder.customer.id}
          customerName={workOrder.customer.name}
          preselectedSaleId={workOrder.id}
          onSuccess={() => {
            setIsCreditNoteDialogOpen(false);
            fetchWorkOrder();
          }}
        />
      )}
    </div>
  );
}
