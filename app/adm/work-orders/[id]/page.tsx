"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentDialog } from "@/components/work-orders/PaymentDialog";
import { FuelLevelSlider } from "@/components/work-orders/FuelLevelSlider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  LucideIcon,
  CheckCircle,
  Calendar,
  Camera,
  Clock,
  DollarSign,
  Check,
  Edit,
  X,
  Undo2,
  Package,
  Wrench,
  ArrowUpDown,
  MessageSquare,
  UserCog,
  FileDown,
  Printer,
  RefreshCw,
  Eye,
  Plus,
  History,
  AlertCircle,
  PlayCircle,
  Loader2,
  FileText,
  Send,
} from "lucide-react";
import {
  ProductServiceSelector,
  SelectedItem,
} from "@/components/ui/ProductServiceSelector";
import Image from "next/image";
import { Header } from "@/components/adm/Header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CustomerCreditNoteDialog } from "@/components/credit-notes/CustomerCreditNoteDialog";
import { getWhatsAppLink, getWorkOrderMessage } from "@/lib/utils/whatsapp";
import { buildVehicleDescription } from "@/lib/constants/vehicle-categories";
import {
  DEFAULT_ENTRY_CHECKLIST,
  DEFAULT_EXIT_CHECKLIST,
} from "@/lib/constants/work-order";
import { formatARS, relativeTime } from "@/lib/utils/format";

// --- Helpers ---

const getFieldLabel = (field: string) => {
  const labels: Record<string, string> = {
    status: "Estado",
    technicianId: "Responsable",
    notes: "Notas",
    scheduledDate: "Fecha Agendada",
    paymentMethod: "Método de Pago",
    paymentNotes: "Notas de Pago",
    startedAt: "Fecha de Inicio",
    completedAt: "Fecha de Finalización",
    deliveredAt: "Fecha de Entrega",
  };
  return labels[field] || field;
};

const getStatusLabel = (status: string) => {
  const statusConfig = STATUSES.find((s) => s.id === status);
  return statusConfig?.label || status;
};

// Timeline Item Component
function TimelineItem({
  title,
  subtitle,
  date,
  status,
  icon: Icon = Check,
  isFirst = false,
  isLast = false,
  variant = "milestone",
}: {
  title: string;
  subtitle?: string;
  date: string;
  status: "completed" | "pending";
  icon?: any;
  isFirst?: boolean;
  isLast?: boolean;
  variant?: "milestone" | "audit";
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        {!isFirst && <div className="w-px h-3 bg-border" />}
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
            variant === "milestone"
              ? status === "completed"
                ? "bg-emerald-500 border-emerald-600 text-white"
                : "bg-muted border-muted-foreground/30 text-muted-foreground"
              : "bg-primary/10 border-primary/20 text-primary",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border min-h-[24px]" />}
      </div>
      <div className={cn("pb-6", isLast && "pb-0")}>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-2">
          <p
            className={cn(
              "text-sm font-semibold",
              variant === "audit" && "text-primary/90",
            )}
          >
            {title}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {new Date(date).toLocaleString("es-AR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">
            {subtitle}
          </p>
        )}
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

const NEXT_STATUS_MAP: Record<
  string,
  { label: string; next: string; icon: LucideIcon }
> = {
  CONFIRMED: {
    label: "Iniciar Trabajo",
    next: "IN_PROGRESS",
    icon: PlayCircle,
  },
  WAITING: { label: "Iniciar Trabajo", next: "IN_PROGRESS", icon: PlayCircle },
  IN_PROGRESS: { label: "Finalizar Trabajo", next: "READY", icon: CheckCircle },
  QC_CHECK: { label: "Finalizar Trabajo", next: "READY", icon: CheckCircle },
  READY: { label: "Entregar Vehículo", next: "DELIVERED", icon: Package },
};

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
    vehicle_make?: { name: string };
    vehicle_model?: { name: string };
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
  totalPaid?: number;
  isFullyPaid?: boolean;
  invoiceId?: string;
  odometerValue?: number;
  fuelLevel?: number;
  totalProducts: number;
  totalServices: number;
  notes: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAt: string;
}

export default function WorkOrderDetailPage() {
  const { alert } = useUI();
  const params = useParams();
  const router = useRouter();
  const workOrderId = params.id as string;

  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [payments, setPayments] = useState<
    Array<{
      id: string;
      amount: number;
      notes: string | null;
      createdAt: string;
      paymentMethod: { name: string };
    }>
  >([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const [editingChecklist, setEditingChecklist] = useState<
    "entry" | "exit" | null
  >(null);
  const [editingChecklistItems, setEditingChecklistItems] = useState<
    Array<{ id: string; label: string; checked: boolean }>
  >([]);
  const [checklistNotes, setChecklistNotes] = useState<string>("");
  const [editingOdometer, setEditingOdometer] = useState<number | undefined>(
    undefined,
  );
  const [editingFuelLevel, setEditingFuelLevel] = useState<number | undefined>(
    undefined,
  );
  const [editingChecklistItems, setEditingChecklistItems] = useState<any[]>([]);
  const [checklistNotes, setChecklistNotes] = useState<string>("");
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [editingScheduledDate, setEditingScheduledDate] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [newScheduledDate, setNewScheduledDate] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");
  const [isCashOpen, setIsCashOpen] = useState<boolean | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [generatingDocument, setGeneratingDocument] = useState<string | null>(
    null,
  );
  const [isOfficiallyzing, setIsOfficiallyzing] = useState(false);

  // Items editing state
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editableItems, setEditableItems] = useState<SelectedItem[]>([]);
  const [priceLists, setPriceLists] = useState<
    { id: string; name: string; baseMarginPercentage: number }[]
  >([]);
  const [savingItems, setSavingItems] = useState(false);
  const [isCreditNoteDialogOpen, setIsCreditNoteDialogOpen] = useState(false);
  const [technicians, setTechnicians] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [updatingTechnician, setUpdatingTechnician] = useState(false);

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
      const cashRes = await fetch("/api/cash/status");
      if (cashRes.ok) {
        const data = await cashRes.json();
        setIsCashOpen(data.status === "OPEN");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  }, [workOrderId]);

  const fetchAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const response = await fetch(
        `/api/work-orders/${workOrderId}/audit-logs`,
      );
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data || []);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoadingAudit(false);
    }
  }, [workOrderId]);

  // Fetch price lists and technicians
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [priceListsRes, techniciansRes] = await Promise.all([
          fetch("/api/price-lists"),
          fetch("/api/users?active=true"),
        ]);

        if (priceListsRes.ok) {
          const data = await priceListsRes.json();
          setPriceLists(data.priceLists || []);
        }

        if (techniciansRes.ok) {
          const data = await techniciansRes.json();
          setTechnicians(data.users || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    void fetchData();
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const response = await fetch(`/api/invoices?referenceId=${workOrderId}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoadingInvoices(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      await Promise.resolve();
      if (cancelled) return;
      void fetchWorkOrder();
      void fetchPayments();
      void fetchInvoices();
      void fetchAuditLogs();
    };
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [fetchWorkOrder, fetchPayments, fetchInvoices, fetchAuditLogs]);

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
      void fetchAuditLogs();
    } catch (error) {
      console.error("Error updating status:", error);
      await alert({
        title: "Error",
        description:
          "Error al actualizar estado. Por favor intente nuevamente.",
        variant: "error",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleTechnicianChange = async (newTechnicianId: string) => {
    setUpdatingTechnician(true);
    try {
      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicianId:
            newTechnicianId === "unassigned" ? null : newTechnicianId,
        }),
      });

      if (!response.ok) throw new Error("Failed to update technician");

      const updated = await response.json();
      setWorkOrder((prev) => (prev ? { ...prev, ...updated } : null));
      void fetchAuditLogs();

      await alert({
        title: "Éxito",
        description: "Responsable asignado correctamente",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating technician:", error);
      await alert({
        title: "Error",
        description:
          "Error al actualizar responsable. Por favor intente nuevamente.",
        variant: "error",
      });
    } finally {
      setUpdatingTechnician(false);
    }
  };

  const handleSaveChecklistData = async () => {
    if (!editingChecklist) return;

    setSavingChecklist(true);
    try {
      const response = await fetch(
        `/api/work-orders/${workOrderId}/checklist`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: editingChecklist.toUpperCase(),
            odometerValue: editingOdometer,
            fuelLevel: editingFuelLevel,
            items: editingChecklistItems,
            notes: checklistNotes,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to update checklist data");

      const updated = await response.json();
      setWorkOrder((prev) => (prev ? { ...prev, ...updated } : null));
      setEditingChecklist(null);
      setEditingOdometer(undefined);
      setEditingFuelLevel(undefined);
      setEditingChecklistItems([]);
      setChecklistNotes("");
      fetchAuditLogs();

      await alert({
        title: "Éxito",
        description: "Checklist actualizado correctamente",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating checklist data:", error);
      await alert({
        title: "Error",
        description: "Error al actualizar datos. Por favor intente nuevamente.",
        variant: "error",
      });
    } finally {
      setSavingChecklist(false);
    }
  };

  const startEditingChecklist = (type: "entry" | "exit") => {
    const checklist =
      type === "entry" ? workOrder?.entryChecklist : workOrder?.exitChecklist;
    setEditingChecklist(type);
    setEditingOdometer(checklist?.odometerValue ?? workOrder?.odometerValue);
    setEditingFuelLevel(checklist?.fuelLevel ?? workOrder?.fuelLevel);
    setEditingChecklistItems(checklist?.items || []);
    setChecklistNotes((checklist as any)?.notes || "");
  };

  const handleToggleChecklistItem = (itemId: string) => {
    setEditingChecklistItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const handleCompleteChecklist = async (type: "ENTRY" | "EXIT") => {
    try {
      const defaultItems =
        type === "ENTRY" ? DEFAULT_ENTRY_CHECKLIST : DEFAULT_EXIT_CHECKLIST;

      const response = await fetch(
        `/api/work-orders/${workOrderId}/checklist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            items: defaultItems,
            odometerValue: workOrder?.odometerValue,
            fuelLevel: workOrder?.fuelLevel,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to initialize checklist");

      const updated = await response.json();
      setWorkOrder((prev) => (prev ? { ...prev, ...updated } : null));
      fetchAuditLogs();

      // Auto-start editing after initialization
      startEditingChecklist(type.toLowerCase() as "entry" | "exit");

      toast.success("Checklist inicializado");
    } catch (error) {
      console.error("Error completing checklist:", error);
      toast.error("Error al inicializar checklist");
    }
  };

  // Items editing handlers
  const startEditingItems = () => {
    if (!workOrder) return;

    // Map work_order_item to SelectedItem format
    const mappedItems = workOrder.work_order_item.map((item) => ({
      id: item.type === "PRODUCT" ? item.productId! : item.serviceId!,
      type: item.type.toLowerCase() as "product" | "service",
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: editableItems }),
      });

      if (!response.ok) throw new Error("Failed to update items");

      setIsEditingItems(false);
      fetchWorkOrder();
      fetchAuditLogs();
    } catch (error) {
      console.error("Error updating items:", error);
      await alert({
        title: "Error",
        description: "Error al actualizar items. Por favor intente nuevamente.",
        variant: "error",
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
      void fetchAuditLogs();

      await alert({
        title: "Éxito",
        description: "Fecha agendada actualizada",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating scheduled date:", error);
      await alert({
        title: "Error",
        description: "Error al actualizar fecha agendada",
        variant: "error",
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
      void fetchAuditLogs();

      await alert({
        title: "Éxito",
        description: "Notas actualizadas",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating notes:", error);
      await alert({
        title: "Error",
        description: "Error al actualizar notas",
        variant: "error",
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const startEditingScheduledDate = () => {
    setNewScheduledDate(
      workOrder?.scheduledDate
        ? new Date(workOrder.scheduledDate).toISOString().slice(0, 16)
        : "",
    );
    setEditingScheduledDate(true);
  };

  const startEditingNotes = () => {
    setNewNotes(workOrder?.notes || "");
    setEditingNotes(true);
  };

  const handleOfficializeInvoice = async (invoiceId: string) => {
    setIsOfficiallyzing(true);
    const toastId = toast.loading("Oficializando comprobante ante AFIP...");
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/officialize`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Comprobante oficializado con éxito", { id: toastId });
        fetchInvoices();
        fetchWorkOrder();
        fetchAuditLogs();
      } else {
        const error = await response.json();
        toast.error(error.error || "Error al oficializar", { id: toastId });
      }
    } catch (error) {
      console.error("Error officializing invoice:", error);
      toast.error("Error de conexión", { id: toastId });
    } finally {
      setIsOfficiallyzing(false);
    }
  };

  const generateDocument = async (type: string) => {
    setGeneratingDocument(type);
    try {
      const response = await fetch(
        `/api/work-orders/${workOrderId}/documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al generar documento");
      }

      await alert({
        title: "Éxito",
        description: `${type === "PRESUPUESTO" ? "Presupuesto" : type === "REMITO" ? "Remito" : "Comprobante"} generado correctamente`,
        variant: "success",
      });

      fetchInvoices();
      fetchWorkOrder();
      fetchAuditLogs();
    } catch (error) {
      console.error("Error generating document:", error);
      await alert({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al generar documento",
        variant: "error",
      });
    } finally {
      setGeneratingDocument(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-amber-700 border-amber-200 text-[10px]"
          >
            Pendiente
          </Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
          >
            Enviando...
          </Badge>
        );
      case "ISSUED":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
          >
            Oficial
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 text-[10px]"
          >
            Rechazado
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200 text-[10px]"
          >
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const officializableInvoice = invoices.find(
    (inv) =>
      (inv.status === "DRAFT" || inv.status === "REJECTED") &&
      (inv.type.startsWith("X_") || inv.type.startsWith("NOTA_CREDITO_X_")),
  );

  // Merge milestones and audit logs for unified timeline
  const unifiedTimelineItems = useMemo(() => {
    if (!workOrder) return [];

    const items: any[] = [
      {
        type: "milestone",
        title: "OT Creada",
        date: workOrder.createdAt,
        status: "completed",
        icon: Plus,
      },
    ];

    if (workOrder.scheduledDate) {
      items.push({
        type: "milestone",
        title: "Turno Agendado",
        date: workOrder.scheduledDate,
        status: "completed",
        icon: Clock,
      });
    }

    if (workOrder.startedAt) {
      items.push({
        type: "milestone",
        title: "Trabajo Iniciado",
        date: workOrder.startedAt,
        status: "completed",
        icon: PlayCircle,
      });
    }

    if (workOrder.completedAt) {
      items.push({
        type: "milestone",
        title: "Trabajo Completado",
        date: workOrder.completedAt,
        status: "completed",
        icon: CheckCircle,
      });
    }

    if (workOrder.deliveredAt) {
      items.push({
        type: "milestone",
        title: "Entregado al Cliente",
        date: workOrder.deliveredAt,
        status: "completed",
        icon: Package,
      });
    }

    // Add granular audit logs
    auditLogs.forEach((log) => {
      let title = `Cambio en ${getFieldLabel(log.fieldName)}`;
      let subtitle = `De "${log.oldValue || "vacío"}" a "${log.newValue || "vacío"}"`;

      if (log.fieldName === "status") {
        title = `Estado cambiado a ${getStatusLabel(log.newValue || "")}`;
        subtitle = `Por ${log.changedBy}`;
      } else if (log.fieldName === "technicianId") {
        const tech = technicians.find((t) => t.id === log.newValue);
        title = tech
          ? `Responsable asignado: ${tech.name}`
          : `Responsable desasignado`;
        subtitle = `Por ${log.changedBy}`;
      } else if (log.fieldName === "notes") {
        title = "Notas actualizadas";
        subtitle = `Por ${log.changedBy}`;
      }

      items.push({
        type: "audit",
        title,
        subtitle,
        date: log.changedAt,
        status: "completed",
        icon: History,
      });
    });

    // Sort chronologically
    return items.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [workOrder, auditLogs, technicians]);

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

  const balance = Math.max(0, workOrder.total - totalPaid);

  const nextAction = NEXT_STATUS_MAP[workOrder.status];

  return (
    <div className="container mx-auto py-4 space-y-4 print:py-0 print:space-y-2 print:max-w-none">
      <Header
        className="print:hidden"
        title={workOrder.vehicle.identifier}
        description={buildVehicleDescription({
          category: workOrder.vehicle.category,
          make: workOrder.vehicle.vehicle_make?.name,
          model: workOrder.vehicle.vehicle_model?.name,
          color: workOrder.vehicle.color,
          year: workOrder.vehicle.year,
        })}
        showBackButton
        onBack={() => router.push("/adm/work-orders")}
        titleClassName="font-mono tracking-tighter text-2xl"
        primaryAction={
          nextAction
            ? {
                label: nextAction.label,
                icon: nextAction.icon,
                onClick: () => handleStatusChange(nextAction.next),
                loading: updatingStatus,
                title: nextAction.label,
              }
            : undefined
        }
        secondaryActions={[
          {
            label: "Imprimir",
            onClick: () => window.print(),
            icon: Printer,
            variant: "ghost",
            iconOnly: true,
            title: "Imprimir orden de trabajo",
            ariaLabel: "Imprimir orden de trabajo",
          },
          {
            label: "Nota de crédito",
            onClick: () => setIsCreditNoteDialogOpen(true),
            variant: "ghost",
            icon: Undo2,
            iconOnly: true,
            title: "Crear nota de crédito por devolución",
            ariaLabel: "Crear nota de crédito por devolución",
          },
          ...(workOrder.customer?.phone
            ? [
                {
                  label: "WhatsApp",
                  onClick: () => {
                    const msg = getWorkOrderMessage({
                      customerName: workOrder.customer!.name,
                      vehicleIdentifier: workOrder.vehicle.identifier,
                      status: workOrder.status,
                      total: Number(workOrder.total),
                      totalPaid: totalPaid,
                    });
                    window.open(
                      getWhatsAppLink(workOrder.customer!.phone, msg),
                      "_blank",
                    );
                  },
                  variant: "outline" as const,
                  icon: MessageSquare,
                  className:
                    "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
                  title: "Notificar el cliente por WhatsApp",
                  ariaLabel: "Enviar notificación por WhatsApp",
                },
              ]
            : []),
        ]}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
          {/* Cliente */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
                Cliente
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${workOrder.customer?.phone}`}
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {workOrder.customer?.name}
                </a>
                {workOrder.customer?.phone && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {workOrder.customer.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-px h-8 bg-border" />

          {/* Ingreso - días transcurridos */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              Ingreso
            </span>
            <span
              className="text-sm font-mono text-muted-foreground"
              title={new Date(workOrder.createdAt).toLocaleString("es-AR")}
            >
              {new Date(workOrder.createdAt).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
              })}
              <span className="text-muted-foreground/50 ml-1">
                ({relativeTime(workOrder.createdAt)})
              </span>
            </span>
          </div>
          {/* Fecha prometida */}

          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60 flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              Prometida
            </span>
            {editingScheduledDate ? (
              <div className="flex items-center gap-1">
                <Input
                  type="datetime-local"
                  value={newScheduledDate}
                  onChange={(e) => setNewScheduledDate(e.target.value)}
                  className="h-7 w-40 font-mono text-xs"
                />
                <Button
                  size="sm"
                  className="h-7 px-2"
                  onClick={handleUpdateScheduledDate}
                >
                  OK
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => setEditingScheduledDate(false)}
                >
                  ✕
                </Button>
              </div>
            ) : (
              <button
                onClick={() => startEditingScheduledDate()}
                className="text-sm font-mono text-left hover:text-primary transition-colors"
              >
                {workOrder.scheduledDate ? (
                  new Date(workOrder.scheduledDate).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                ) : (
                  <span className="text-muted-foreground/50">Sin asignar</span>
                )}
              </button>
            )}
          </div>

          <div className="w-px h-8 bg-border" />

          {/* Responsable */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
              Responsable
            </span>
            <div className="flex items-center gap-1 bg-purple-50 border border-purple-200 rounded-md text-xs font-medium text-purple-700">
              <UserCog
                className="h-3.5 w-3.5 ml-1.5 text-purple-600 pointer-events-none"
                aria-hidden="true"
              />
              <Select
                value={workOrder.technicianId || "unassigned"}
                onValueChange={handleTechnicianChange}
                disabled={
                  updatingTechnician || workOrder.status === "DELIVERED"
                }
              >
                <SelectTrigger className="h-7 border-none bg-transparent hover:bg-purple-100/50 shadow-none focus:ring-0 px-1.5 min-w-[100px] text-xs">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Header>

      {/* Print-only header */}
      <div className="hidden print:block border-b-2 border-black pb-3 mb-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tighter">
              RPM ACCESORIOS
            </h1>
            <p className="text-xs text-muted-foreground">Orden de Trabajo</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-bold text-lg">
              {workOrder.vehicle.identifier}
            </p>
            <p className="text-muted-foreground">
              {buildVehicleDescription({
                category: workOrder.vehicle.category,
                make: workOrder.vehicle.vehicle_make?.name,
                model: workOrder.vehicle.vehicle_model?.name,
                color: workOrder.vehicle.color,
                year: workOrder.vehicle.year,
              })}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
          <div>
            <p className="font-bold uppercase text-muted-foreground">Cliente</p>
            <p className="font-semibold">{workOrder.customer?.name}</p>
            <p className="font-mono text-muted-foreground">
              {workOrder.customer?.phone}
            </p>
          </div>
          <div>
            <p className="font-bold uppercase text-muted-foreground">Ingreso</p>
            <p className="font-mono">
              {new Date(workOrder.createdAt).toLocaleDateString("es-AR")}
            </p>
          </div>
          <div>
            <p className="font-bold uppercase text-muted-foreground">Estado</p>
            <p className="font-semibold">
              {STATUSES.find((s) => s.id === workOrder.status)?.label}
            </p>
          </div>
        </div>
      </div>

      {/* Main grid: Work (left 2/3) + Payments+Notes (right 1/3) */}
      <div className="grid lg:grid-cols-3 gap-4 print:grid-cols-1 print:gap-2 lg:items-stretch">
        {/* Left column: Items */}
        <div className="lg:col-span-2">
          {/* Servicios y Productos - Editable con ProductServiceSelector */}
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Servicios y Productos
                </CardTitle>
                {!isEditingItems && workOrder.status !== "DELIVERED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditingItems}
                    className="print:hidden"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Items
                  </Button>
                )}
                {workOrder.status === "DELIVERED" && (
                  <Badge
                    variant="secondary"
                    className="text-muted-foreground print:hidden"
                  >
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
                    defaultPriceListId={
                      workOrder.work_order_item[0]?.priceListId
                    }
                    initialItems={editableItems}
                    onSelectionChange={setEditableItems}
                  />
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleCancelItems}
                      disabled={savingItems}
                    >
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
                        <TableHead className="text-right">
                          Precio Unit.
                        </TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workOrder.work_order_item.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground py-8"
                          >
                            Sin items registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        workOrder.work_order_item.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
                                  {item.type === "PRODUCT" ? (
                                    <Package
                                      className="h-4 w-4 text-primary pointer-events-none"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <Wrench
                                      className="h-4 w-4 text-primary pointer-events-none"
                                      aria-hidden="true"
                                    />
                                  )}
                                </div>
                                <span className="font-semibold tracking-tight">
                                  {item.product?.name ||
                                    item.service?.name ||
                                    item.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.type === "PRODUCT"
                                    ? "outline"
                                    : "secondary"
                                }
                                className={
                                  item.type === "PRODUCT"
                                    ? "border-primary/20"
                                    : ""
                                }
                              >
                                {item.type === "PRODUCT"
                                  ? "Producto"
                                  : "Servicio"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatARS(Number(item.unitPrice), 2)}
                            </TableCell>
                            <TableCell className="text-right font-medium font-mono">
                              {formatARS(Number(item.subtotal), 2)}
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
                          Productos:{" "}
                          <span className="font-mono">
                            {formatARS(Number(workOrder.totalProducts), 2)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Servicios:{" "}
                          <span className="font-mono">
                            {formatARS(Number(workOrder.totalServices), 2)}
                          </span>
                        </div>
                        <div className="text-2xl font-bold pt-1">
                          Total:{" "}
                          <span className="font-mono tracking-tight text-emerald-700">
                            {formatARS(Number(workOrder.total), 2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Payments + Notes */}
        <div className="space-y-4 flex flex-col">
          {/* Payment Summary Card */}
          <Card className="lg:sticky lg:top-4 print:border-0 print:shadow-none print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-base font-semibold font-mono">
                      {formatARS(Number(workOrder.total))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pagado</p>
                    <p className="text-base font-semibold text-emerald-700 font-mono">
                      {formatARS(totalPaid)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pendiente</p>
                    <p
                      className={`text-base font-semibold font-mono ${totalPaid >= workOrder.total ? "text-emerald-700" : "text-amber-700"}`}
                    >
                      {formatARS(balance)}
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full print:hidden"
                  onClick={() => setIsPaymentDialogOpen(true)}
                  disabled={isCashOpen === false}
                  title={
                    isCashOpen === false
                      ? "Debe abrir la caja para registrar pagos"
                      : undefined
                  }
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
                      <div
                        key={payment.id}
                        className="flex justify-between items-center p-3 bg-muted rounded-md transition-colors hover:bg-muted/70"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100/50 border border-emerald-200/50 shadow-sm flex items-center justify-center shrink-0">
                            <DollarSign
                              className="h-4 w-4 text-emerald-700 pointer-events-none"
                              aria-hidden="true"
                            />
                          </div>
                          <div>
                            <p className="font-bold font-mono text-emerald-700">
                              {formatARS(Number(payment.amount), 2)}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                              {payment.paymentMethod.name}
                            </p>
                            {payment.notes && (
                              <p className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">
                                &ldquo;{payment.notes}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono bg-background/50 px-2 py-0.5 rounded border">
                          {new Date(payment.createdAt).toLocaleDateString(
                            "es-AR",
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas de Taller */}
          <Card className="flex-1 print:border-0 print:shadow-none print:break-inside-avoid">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notas de Taller
                </CardTitle>
                {!editingNotes && workOrder.status !== "DELIVERED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditingNotes()}
                    className="print:hidden"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {workOrder.notes ? "Editar" : "Agregar"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-2">
                  <div className="relative">
                    <FileText
                      className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none"
                      aria-hidden="true"
                    />
                    <Textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Ej: Revisar frenos delanteros, cambiar aceite, alinear dirección..."
                      rows={4}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdateNotes}
                      loading={savingNotes}
                    >
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingNotes(false)}
                      disabled={savingNotes}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 p-4 rounded-lg border border-dashed h-full">
                  {workOrder.notes ? (
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {workOrder.notes}
                    </p>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                      <AlertCircle className="h-6 w-6 opacity-20" />
                      <p className="text-xs">Sin notas de taller registradas</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        workOrderId={workOrderId}
        workOrderTotal={workOrder.total}
        onPaymentRegistered={() => {
          fetchPayments();
          fetchWorkOrder();
          fetchAuditLogs();
        }}
      />

      {/* Tabs Section - hidden in print */}
      <Tabs defaultValue="checklists" className="w-full print:hidden">
        <TabsList
          variant="line"
          className="w-full justify-start border-b bg-transparent p-0 h-10"
        >
          <TabsTrigger
            value="checklists"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Checklists</span>
          </TabsTrigger>
          <TabsTrigger
            value="photos"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Fotos</span>
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documentos</span>
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary"
          >
            <History className="h-4 w-4" />
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
                      onClick={() => startEditingChecklist("entry")}
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
                      {editingChecklist === "entry" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label
                              className="text-xs font-medium w-24"
                              htmlFor="entry-odometer"
                            >
                              Kilometraje:
                            </label>
                            <div className="relative flex-1">
                              <ArrowUpDown
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
                                aria-hidden="true"
                              />
                              <Input
                                id="entry-odometer"
                                type="number"
                                value={editingOdometer ?? ""}
                                onChange={(e) =>
                                  setEditingOdometer(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  )
                                }
                                placeholder="km"
                                className="h-8 pl-9 font-mono"
                              />
                            </div>
                          </div>
                          <FuelLevelSlider
                            value={editingFuelLevel ?? 0}
                            onChange={setEditingFuelLevel}
                          />
                          <div className="pt-2">
                            <label className="text-xs font-medium mb-1 block">
                              Notas del Checklist:
                            </label>
                            <Textarea
                              value={checklistNotes}
                              onChange={(e) =>
                                setChecklistNotes(e.target.value)
                              }
                              placeholder="Ej: Rayón en puerta derecha..."
                              rows={2}
                              className="text-xs"
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={handleSaveChecklistData}
                              loading={savingChecklist}
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingChecklist(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {(workOrder.entryChecklist.odometerValue ??
                            workOrder.odometerValue) && (
                            <div className="text-xs">
                              <span className="font-medium">Kilometraje:</span>{" "}
                              <span className="font-mono">
                                {workOrder.entryChecklist.odometerValue ??
                                  workOrder.odometerValue}
                              </span>{" "}
                              km
                            </div>
                          )}
                          {(workOrder.entryChecklist.fuelLevel ??
                            workOrder.fuelLevel) && (
                            <div className="text-xs">
                              <span className="font-medium">Combustible:</span>{" "}
                              <span className="font-mono">
                                {workOrder.entryChecklist.fuelLevel ??
                                  workOrder.fuelLevel}
                                %
                              </span>
                            </div>
                          )}
                          {(workOrder.entryChecklist as any).notes && (
                            <div className="text-xs italic text-muted-foreground mt-1 border-t pt-1">
                              &ldquo;{(workOrder.entryChecklist as any).notes}&rdquo;
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Checklist Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {(editingChecklist === "entry"
                        ? editingChecklistItems
                        : workOrder.entryChecklist.items
                      ).map((item, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-start gap-3 p-2 rounded-md transition-colors",
                            item.checked
                              ? "bg-blue-50/50"
                              : "hover:bg-muted/30",
                            editingChecklist === "entry" && "cursor-pointer",
                          )}
                          onClick={() =>
                            editingChecklist === "entry" &&
                            handleToggleChecklistItem(item.id)
                          }
                        >
                          <div
                            className={cn(
                              "mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all shadow-sm",
                              item.checked
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-muted/30 border-muted-foreground/20 text-muted-foreground/30",
                            )}
                          >
                            <Check
                              className={cn(
                                "h-3.5 w-3.5 transition-transform",
                                item.checked ? "scale-100" : "scale-0",
                              )}
                              aria-hidden="true"
                            />
                          </div>
                          <span
                            className={cn(
                              "text-xs leading-none pt-1",
                              item.checked
                                ? "font-semibold text-blue-900"
                                : "text-muted-foreground",
                            )}
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                      Completado:{" "}
                      {new Date(
                        workOrder.entryChecklist.completedAt,
                      ).toLocaleString("es-AR")}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground py-6 text-center border-2 border-dashed rounded-lg">
                    <p className="text-sm mb-4">
                      Sin checklist de ingreso registrado
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleCompleteChecklist("ENTRY")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Completar Checklist
                    </Button>
                  </div>
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
                      onClick={() => startEditingChecklist("exit")}
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
                      {editingChecklist === "exit" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label
                              className="text-xs font-medium w-24"
                              htmlFor="exit-odometer"
                            >
                              Kilometraje:
                            </label>
                            <div className="relative flex-1">
                              <ArrowUpDown
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
                                aria-hidden="true"
                              />
                              <Input
                                id="exit-odometer"
                                type="number"
                                value={editingOdometer ?? ""}
                                onChange={(e) =>
                                  setEditingOdometer(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined,
                                  )
                                }
                                placeholder="km"
                                className="h-8 pl-9 font-mono"
                              />
                            </div>
                          </div>
                          <FuelLevelSlider
                            value={editingFuelLevel ?? 0}
                            onChange={setEditingFuelLevel}
                          />
                          <div className="pt-2">
                            <label className="text-xs font-medium mb-1 block">
                              Notas del Checklist:
                            </label>
                            <Textarea
                              value={checklistNotes}
                              onChange={(e) =>
                                setChecklistNotes(e.target.value)
                              }
                              placeholder="Ej: Lavado completado..."
                              rows={2}
                              className="text-xs"
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={handleSaveChecklistData}
                              loading={savingChecklist}
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingChecklist(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {(workOrder.exitChecklist.odometerValue ??
                            workOrder.odometerValue) && (
                            <div className="text-xs">
                              <span className="font-medium">Kilometraje:</span>{" "}
                              <span className="font-mono">
                                {workOrder.exitChecklist.odometerValue ??
                                  workOrder.odometerValue}
                              </span>{" "}
                              km
                            </div>
                          )}
                          {(workOrder.exitChecklist.fuelLevel ??
                            workOrder.fuelLevel) && (
                            <div className="text-xs">
                              <span className="font-medium">Combustible:</span>{" "}
                              <span className="font-mono">
                                {workOrder.exitChecklist.fuelLevel ??
                                  workOrder.fuelLevel}
                                %
                              </span>
                            </div>
                          )}
                          {(workOrder.exitChecklist as any).notes && (
                            <div className="text-xs italic text-muted-foreground mt-1 border-t pt-1">
                              &ldquo;{(workOrder.exitChecklist as any).notes}&rdquo;
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Checklist Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {(editingChecklist === "exit"
                        ? editingChecklistItems
                        : workOrder.exitChecklist.items
                      ).map((item, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-start gap-3 p-2 rounded-md transition-colors",
                            item.checked
                              ? "bg-emerald-50/50"
                              : "hover:bg-muted/30",
                            editingChecklist === "exit" && "cursor-pointer",
                          )}
                          onClick={() =>
                            editingChecklist === "exit" &&
                            handleToggleChecklistItem(item.id)
                          }
                        >
                          <div
                            className={cn(
                              "mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all shadow-sm",
                              item.checked
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-muted/30 border-muted-foreground/20 text-muted-foreground/30",
                            )}
                          >
                            <Check
                              className={cn(
                                "h-3.5 w-3.5 transition-transform",
                                item.checked ? "scale-100" : "scale-0",
                              )}
                              aria-hidden="true"
                            />
                          </div>
                          <span
                            className={cn(
                              "text-xs leading-none pt-1",
                              item.checked
                                ? "font-semibold text-emerald-900"
                                : "text-muted-foreground",
                            )}
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                      Completado:{" "}
                      {new Date(
                        workOrder.exitChecklist.completedAt,
                      ).toLocaleString("es-AR")}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground py-6 text-center border-2 border-dashed rounded-lg">
                    <p className="text-sm mb-4">
                      Sin checklist de calidad registrado
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleCompleteChecklist("EXIT")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Completar Checklist
                    </Button>
                  </div>
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
                  <div className="text-muted-foreground py-8 text-center">
                    Sin fotos de ingreso
                  </div>
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
                  <div className="text-muted-foreground py-8 text-center">
                    Sin fotos de egreso
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Documents */}
        <TabsContent value="documents" className="pt-4 outline-none">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentos Generados
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchInvoices}
                    disabled={loadingInvoices}
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4",
                        loadingInvoices && "animate-spin",
                      )}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {invoices.length > 0 ? (
                  <div className="space-y-3">
                    {invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold font-mono">
                                {inv.number}
                              </p>
                              {getStatusBadge(inv.status)}
                            </div>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                              {inv.type.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/adm/invoices/${inv.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Ver Detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Descargar PDF"
                            onClick={() =>
                              window.open(`/adm/invoices/${inv.id}?print=true`, '_blank')
                            }
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2 border-2 border-dashed rounded-lg">
                    <FileText className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-sm">
                      No hay documentos generados para esta OT
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Acciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {officializableInvoice && (
                  <Button
                    variant="default"
                    className="w-full justify-start bg-emerald-600 hover:bg-emerald-700"
                    onClick={() =>
                      handleOfficializeInvoice(officializableInvoice.id)
                    }
                    loading={isOfficiallyzing}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Oficializar {officializableInvoice.type.replace("_", " ")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => generateDocument("PRESUPUESTO")}
                  loading={generatingDocument === "PRESUPUESTO"}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Generar Presupuesto
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => generateDocument("REMITO")}
                  loading={generatingDocument === "REMITO"}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Generar Remito
                </Button>
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => generateDocument("INVOICE")}
                  loading={generatingDocument === "INVOICE"}
                  disabled={!!workOrder.invoiceId}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Pre-Factura
                </Button>
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
                  Línea de Tiempo Unificada
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAudit ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : unifiedTimelineItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground italic">
                    Sin actividad registrada
                  </div>
                ) : (
                  <div className="space-y-0 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-border/60">
                    {unifiedTimelineItems.map((item, index) => (
                      <TimelineItem
                        key={`${item.type}-${index}`}
                        title={item.title}
                        subtitle={item.subtitle}
                        date={item.date}
                        status={item.status}
                        icon={item.icon}
                        variant={item.type as any}
                        isFirst={index === 0}
                        isLast={index === unifiedTimelineItems.length - 1}
                      />
                    ))}
                  </div>
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
            fetchAuditLogs();
          }}
        />
      )}
    </div>
  );
}
