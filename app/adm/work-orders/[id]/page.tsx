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
  XCircle,
  Car,
  LogIn,
  LogOut,
  AlertTriangle,
  ClipboardList,
  Copy,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
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
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
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
  { id: "CONFIRMED", label: "Confirmada", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "WAITING", label: "En Espera", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { id: "IN_PROGRESS", label: "En Proceso", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "QC_CHECK", label: "Control QC", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "READY", label: "Listo", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "DELIVERED", label: "Entregada", color: "bg-gray-50 text-gray-700 border-gray-200" },
  { id: "CANCELLED", label: "Cancelada", color: "bg-red-50 text-red-700 border-red-200" },
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
    vehicleMake?: { name: string };
    vehicleModel?: { name: string };
    year?: number;
    color?: string;
  };
  technicianId?: string;
  workOrderItems: Array<{
    id: string;
    type: string;
    name: string | null;
    isManualName: boolean;
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
  updatedAt?: string;
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
  const { alert, confirm: confirmAction } = useUI();
  const params = useParams();
  const router = useRouter();
  const workOrderId = params.id as string;

  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [uploadingEntry, setUploadingEntry] = useState(false);
  const [uploadingExit, setUploadingExit] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [editingScheduledDate, setEditingScheduledDate] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [newScheduledDate, setNewScheduledDate] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");

  // Vehicle History State
  const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleDuplicateWorkOrder = async (woToDuplicate: any) => {
    if (!woToDuplicate) return;

    const confirmed = await confirmAction({
      title: "¿Duplicar esta Orden de Trabajo?",
      description:
        "Se iniciará el asistente de creación pre-cargando los mismos datos de cliente, vehículo e ítems (servicios y productos). El borrador actual del asistente en este navegador será reemplazado.",
      confirmText: "Duplicar",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      const rawItems = woToDuplicate.workOrderItems || woToDuplicate.items || [];
      const items = rawItems.map((item: any) => ({
        type: item.type === "PRODUCT" ? "PRODUCT" : "SERVICE",
        productId: item.productId || undefined,
        serviceId: item.serviceId || undefined,
        name: item.name || item.product?.name || item.service?.name || "Item",
        isManualName: item.isManualName || false,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        priceListId: item.priceListId || undefined,
        isManualPrice: item.isManualPrice || false,
        originalPrice: Number(item.unitPrice),
      }));

      const cloneState = {
        step: 2, // Direct to step 2: Items review
        checklist: {},
        odometerValue: "",
        fuelLevel: 50,
        notes: woToDuplicate.notes || "",
        scheduledDate: "",
        items,
        foundVehicle: woToDuplicate.vehicle
          ? {
              id: woToDuplicate.vehicle.id,
              identifier: woToDuplicate.vehicle.identifier,
              category: woToDuplicate.vehicle.category,
              vehicleMake: woToDuplicate.vehicle.vehicleMake,
              vehicleModel: woToDuplicate.vehicle.vehicleModel,
              year: woToDuplicate.vehicle.year,
              color: woToDuplicate.vehicle.color,
              customer: {
                id: woToDuplicate.customer?.id,
                name: woToDuplicate.customer?.name || "",
                phone: woToDuplicate.customer?.phone || "",
                email: woToDuplicate.customer?.email || "",
              },
            }
          : null,
        selectedCustomer: woToDuplicate.customer
          ? {
              id: woToDuplicate.customer.id,
              name: woToDuplicate.customer.name || "",
              phone: woToDuplicate.customer.phone || "",
              email: woToDuplicate.customer.email || "",
            }
          : null,
      };

      localStorage.setItem("work-order-wizard-state", JSON.stringify(cloneState));
      toast.success("Orden de trabajo duplicada en el borrador", {
        description: "Redirigiendo al asistente de creación...",
      });
      router.push("/adm/work-orders/new");
    } catch (err) {
      console.error("Error cloning work order:", err);
      toast.error("Ocurrió un error al duplicar la orden de trabajo");
    }
  };

  const vehicleId = workOrder?.vehicle?.id;

  const fetchVehicleHistory = useCallback(() => {
    if (!vehicleId) return;
    setLoadingHistory(true);
    fetch(`/api/work-orders?vehicleId=${vehicleId}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Failed to fetch vehicle history");
      })
      .then((data) => {
        const filtered = (data.workOrders || []).filter((wo: any) => wo.id !== workOrderId);
        setVehicleHistory(filtered);
      })
      .catch((error) => {
        console.error("Error fetching vehicle history:", error);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [vehicleId, workOrderId]);

  useEffect(() => {
    if (vehicleId) {
      void fetchVehicleHistory();
    }
  }, [vehicleId, fetchVehicleHistory]);

  const lightboxPhotos = useMemo(() => {
    const list: Array<{ url: string; type: "ENTRY" | "EXIT"; label: string }> = [];
    workOrder?.entryPhotos?.forEach((url, i) => {
      list.push({ url, type: "ENTRY", label: `Ingreso #${i + 1}` });
    });
    workOrder?.exitPhotos?.forEach((url, i) => {
      list.push({ url, type: "EXIT", label: `Egreso #${i + 1}` });
    });
    return list;
  }, [workOrder]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null && prev < lightboxPhotos.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Escape") {
        setLightboxIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, lightboxPhotos]);
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
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
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

  const handleStatusChange = async (newStatus: string): Promise<boolean> => {
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
      return true;
    } catch (error) {
      console.error("Error updating status:", error);
      await alert({
        title: "No se pudo actualizar el estado",
        description:
          "Ocurrió un error de conexión al cambiar el estado de la OT. Verifica tu conexión e inténtalo nuevamente.",
        variant: "error",
        action: {
          label: "Reintentar",
          onClick: () => void handleStatusChange(newStatus),
        },
      });
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelOrder = () => {
    if (!workOrder) return;
    setIsCancelDialogOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!workOrder) return;
    const previousStatus = workOrder.status;
    const statusLabel = getStatusLabel(workOrder.status);
    setIsCancelDialogOpen(false);
    const success = await handleStatusChange("CANCELLED");
    if (success) {
      toast.success("Orden de trabajo cancelada", {
        description: `La OT fue cancelada correctamente (estado anterior: ${statusLabel}).`,
        action: {
          label: "Deshacer",
          onClick: () => void handleUndoCancel(previousStatus),
        },
        duration: 8000,
      });
    }
  };

  const handleUndoCancel = async (previousStatus: string) => {
    const undoToastId = toast.loading("Revirtiendo cancelación...");
    const success = await handleStatusChange(previousStatus);
    if (success) {
      toast.success("Cancelación revertida", {
        id: undoToastId,
        description: `La OT volvió al estado "${getStatusLabel(previousStatus)}".`,
      });
    } else {
      toast.error(
        "No se pudo deshacer la cancelación. Revise el estado de la OT manualmente.",
        { id: undoToastId },
      );
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "ENTRY" | "EXIT") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (type === "ENTRY") setUploadingEntry(true);
    else setUploadingExit(true);

    const totalFiles = files.length;
    let successCount = 0;
    const toastId = toast.loading(`Subiendo ${totalFiles} foto(s)...`);

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];

        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "vehicles");
        formData.append("id", `${workOrderId}-${type.toLowerCase()}-${Date.now()}-${i}`);

        const uploadRes = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error(`Error subiendo archivo ${file.name}`);
        }

        const uploadData = await uploadRes.json();
        const cdnUrl = uploadData.urls?.cdn;

        if (!cdnUrl) {
          throw new Error(`No se recibió URL CDN para ${file.name}`);
        }

        const registerRes = await fetch(`/api/work-orders/${workOrderId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            url: cdnUrl,
            description: `Foto de ${type === "ENTRY" ? "ingreso" : "egreso"}`,
          }),
        });

        if (!registerRes.ok) {
          throw new Error(`Error registrando foto ${file.name}`);
        }

        successCount++;
      }

      toast.success(`${successCount} foto(s) subida(s) y registrada(s) con éxito`, { id: toastId });
      await fetchWorkOrder();
      void fetchAuditLogs();
    } catch (error: any) {
      console.error("Error in photo upload process:", error);
      toast.error(error?.message || "Ocurrió un error al subir las fotos", { id: toastId });
    } finally {
      if (type === "ENTRY") setUploadingEntry(false);
      else setUploadingExit(false);
      e.target.value = "";
    }
  };

  const handlePhotoDelete = async (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = await confirmAction({
      title: "¿Eliminar esta foto?",
      description:
        "La foto se eliminará permanentemente de la orden de trabajo. Esta acción no se puede deshacer.",
      confirmText: "Sí, eliminar",
      cancelText: "No, mantener",
      variant: "destructive",
    });
    if (!confirmed) return;

    const toastId = toast.loading("Eliminando foto...");
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/photos?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("No se pudo eliminar la foto");
      }

      toast.success("Foto eliminada con éxito", { id: toastId });
      await fetchWorkOrder();
      void fetchAuditLogs();
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast.error(
        "No se pudo eliminar la foto por un error de conexión. Toca aquí para reintentar.",
        {
          id: toastId,
          action: {
            label: "Reintentar",
            onClick: () => void handlePhotoDelete(url, e),
          },
        },
      );
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

    // Map workOrderItems to SelectedItem format
    const mappedItems = workOrder.workOrderItems.map((item) => ({
      id: item.type === "PRODUCT" ? item.productId! : item.serviceId!,
      type: item.type.toLowerCase() as "product" | "service",
      name: item.name || item.product?.name || item.service?.name || "Item",
      isManualName: item.isManualName,
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
            className="bg-yellow-50 text-amber-700 border-amber-200 text-[11px]"
          >
            Pendiente
          </Badge>
        );
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 text-[11px]"
          >
            Enviando...
          </Badge>
        );
      case "ISSUED":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]"
          >
            Oficial
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 text-[11px]"
          >
            Rechazado
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200 text-[11px]"
          >
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[11px]">
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

    if (workOrder.status === "CANCELLED") {
      items.push({
        type: "milestone",
        title: "OT Cancelada",
        date: workOrder.updatedAt || new Date().toISOString(),
        status: "completed",
        icon: XCircle,
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
          make: workOrder.vehicle.vehicleMake?.name,
          model: workOrder.vehicle.vehicleModel?.name,
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
            label: "Duplicar",
            onClick: () => handleDuplicateWorkOrder(workOrder),
            variant: "ghost",
            icon: Copy,
            iconOnly: true,
            title: "Duplicar orden de trabajo",
            ariaLabel: "Duplicar orden de trabajo",
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
          ...(workOrder.status !== "CANCELLED" && workOrder.status !== "DELIVERED"
            ? [
                {
                  label: "Cancelar Orden",
                  onClick: handleCancelOrder,
                  icon: XCircle,
                  variant: "ghost" as const,
                  iconOnly: true,
                  title: "Cancelar orden de trabajo",
                  ariaLabel: "Cancelar orden de trabajo",
                  className: "text-red-600 hover:text-red-700 hover:bg-red-50",
                },
              ]
            : []),
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
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60">
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
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60 flex items-center gap-1">
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
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60 flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              Prometida
            </span>
            {editingScheduledDate ? (
              <div className="flex items-center gap-1">
                <Input
                  id="scheduled-date"
                  type="datetime-local"
                  value={newScheduledDate}
                  onChange={(e) => setNewScheduledDate(e.target.value)}
                  className="h-7 w-40 font-mono text-xs"
                  aria-label="Fecha prometida"
                />
                <Button
                  size="sm"
                  className="h-9 px-2"
                  onClick={handleUpdateScheduledDate}
                >
                  OK
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-2"
                  onClick={() => setEditingScheduledDate(false)}
                >
                  ✕
                </Button>
              </div>
            ) : (
              <button
                onClick={() => startEditingScheduledDate()}
                className={cn(
                  "text-sm font-mono text-left transition-colors",
                  workOrder.status === "DELIVERED" || workOrder.status === "CANCELLED"
                    ? "text-muted-foreground cursor-not-allowed"
                    : "hover:text-primary"
                )}
                disabled={workOrder.status === "DELIVERED" || workOrder.status === "CANCELLED"}
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
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60">
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
                  updatingTechnician || workOrder.status === "DELIVERED" || workOrder.status === "CANCELLED"
                }
              >
                <SelectTrigger className="h-9 border-none bg-transparent hover:bg-purple-100/50 shadow-none focus:ring-0 px-1.5 min-w-[100px] text-xs">
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

          <div className="w-px h-8 bg-border" />

          {/* Estado */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
              Estado
            </span>
            <div className={cn(
              "flex items-center gap-1 border rounded-md text-xs font-semibold shadow-sm transition-colors",
              STATUSES.find((s) => s.id === workOrder.status)?.color
            )}>
              <ClipboardList
                className="h-3.5 w-3.5 ml-1.5 pointer-events-none opacity-80"
                aria-hidden="true"
              />
              <Select
                value={workOrder.status}
                onValueChange={handleStatusChange}
                disabled={
                  updatingStatus || workOrder.status === "CANCELLED"
                }
              >
                <SelectTrigger className="h-7 border-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5 shadow-none focus:ring-0 px-1.5 min-w-[110px] text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.label}
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
                make: workOrder.vehicle.vehicleMake?.name,
                model: workOrder.vehicle.vehicleModel?.name,
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
            <p className="font-bold uppercase text-muted-foreground mb-1">Estado</p>
            {(() => {
              const statusConfig = STATUSES.find((s) => s.id === workOrder.status);
              return (
                <Badge
                  variant="outline"
                  className={statusConfig?.color || "bg-gray-50 text-gray-700 border-gray-200 text-xs font-semibold"}
                >
                  {statusConfig?.label || workOrder.status}
                </Badge>
              );
            })()}
          </div>
        </div>
      </div>

      {workOrder.status === "CANCELLED" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700 print:hidden shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold tracking-tight">Orden de Trabajo Cancelada</h3>
            <p className="text-sm mt-0.5 opacity-90">
              Esta orden de trabajo ha sido cancelada. Las ediciones y los registros de pagos o checklists están bloqueados de forma permanente.
            </p>
          </div>
        </div>
      )}

      {/* Main grid: Work (left 2/3) + Payments+Notes (right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 print:grid-cols-1 print:gap-2 lg:items-stretch">
        {/* Left column: Items */}
        <div className="lg:col-span-2 min-w-0">
          {/* Servicios y Productos - Editable con ProductServiceSelector */}
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <CardTitle className="text-lg flex items-center gap-2 min-w-0">
                  <Package className="h-5 w-5 shrink-0" />
                  <span className="truncate">Servicios y Productos</span>
                </CardTitle>
                {!isEditingItems && workOrder.status !== "DELIVERED" && workOrder.status !== "CANCELLED" && (
                  <Button
                    variant="outline"
                    size="default"
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
                      workOrder.workOrderItems[0]?.priceListId
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
                  <div className="overflow-x-auto min-w-0">
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
                        {workOrder.workOrderItems.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-muted-foreground py-8"
                            >
                              Sin items registrados
                            </TableCell>
                          </TableRow>
                        ) : (
                          workOrder.workOrderItems.map((item) => (
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
                                    {item.name ||
                                      item.product?.name ||
                                      item.service?.name ||
                                      "Item"}
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
                  </div>

                  {workOrder.workOrderItems.length > 0 && (
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
                  disabled={isCashOpen === false || workOrder.status === "CANCELLED"}
                  title={
                    workOrder.status === "CANCELLED"
                      ? "No se pueden registrar pagos en una orden cancelada"
                      : isCashOpen === false
                        ? "Debe abrir la caja para registrar pagos"
                        : undefined
                  }
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Registrar Pago
                </Button>
              </div>

              {/* Payment History */}
              {payments.length > 0 ? (
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
                            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                              {payment.paymentMethod.name}
                            </p>
                            {payment.notes && (
                              <p className="text-[11px] text-muted-foreground italic truncate max-w-[200px]">
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
              ) : (
                <div className="mt-6 pt-4 border-t text-center">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Sin pagos registrados
                  </p>
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
                {!editingNotes && workOrder.status !== "DELIVERED" && workOrder.status !== "CANCELLED" && (
                  <Button
                    variant="outline"
                    size="default"
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
                  <label htmlFor="workshop-notes" className="sr-only">
                    Notas de Taller
                  </label>
                  <div className="relative">
                    <FileText
                      className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none"
                      aria-hidden="true"
                    />
                    <Textarea
                      id="workshop-notes"
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

      {/* Cancel Order Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-md p-0" showCloseButton={false}>
          <DialogTitle className="sr-only">
            ¿Cancelar Orden de Trabajo?
          </DialogTitle>
          <div className="flex items-start gap-3.5 p-5">
            <div className="flex-shrink-0 rounded-lg bg-destructive/10 p-2.5">
              <XCircle
                className="h-5 w-5 text-destructive"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1 space-y-3 pt-0.5">
              <h3 className="text-base font-semibold leading-tight">
                ¿Cancelar Orden de Trabajo?
              </h3>
              <DialogDescription className="text-sm leading-relaxed">
                Estás por cancelar la OT {workOrder.id} del cliente{" "}
                {workOrder.customer?.name || "—"} (estado actual:{" "}
                {getStatusLabel(workOrder.status)}). Esta acción puede no ser
                reversible: cambiará el estado a “Cancelada” y
                anulará/restará el saldo correspondiente en la cuenta corriente
                del cliente (si aplica). ¿Deseas continuar?
              </DialogDescription>
              {totalPaid > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm">
                    Esta OT tiene pagos asociados ({formatARS(totalPaid)}).
                    Cancelarla puede requerir emitir una nota de crédito.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 px-5 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelDialogOpen(false)}
            >
              No, mantener
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void confirmCancelOrder()}
            >
              Cancelar OT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs Section - hidden in print */}
      <Tabs defaultValue="checklists" className="w-full print:hidden">
        <TabsList
          variant="line"
          className="w-full justify-start border-b bg-transparent p-0 h-10 overflow-x-auto"
        >
          <TabsTrigger
            value="checklists"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary shrink-0"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Checklists</span>
          </TabsTrigger>
          <TabsTrigger
            value="photos"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary shrink-0"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Fotos</span>
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary shrink-0"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documentos</span>
          </TabsTrigger>
          <TabsTrigger
            value="vehicle-history"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary shrink-0"
          >
            <Car className="h-4 w-4" />
            <span className="hidden sm:inline">Historial Vehículo</span>
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:after:bg-primary shrink-0"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Checklists */}
        <TabsContent value="checklists" className="pt-4 outline-none">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                      <LogIn className="h-3 w-3 text-white" aria-hidden="true" />
                    </span>
                    Checklist de Ingreso
                  </CardTitle>
                  {workOrder.entryChecklist && (
                    <div className="flex items-center gap-2">
                      {editingChecklist === "entry" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-primary hover:text-primary/80 px-2"
                          onClick={() => {
                            const allChecked = editingChecklistItems.every((item) => item.checked);
                            setEditingChecklistItems((prev) =>
                              prev.map((item) => ({ ...item, checked: !allChecked }))
                            );
                          }}
                        >
                          {editingChecklistItems.every((item) => item.checked)
                            ? "Desmarcar todos"
                            : "Marcar todos como OK"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="default"
                        onClick={() => startEditingChecklist("entry")}
                        disabled={workOrder.status === "DELIVERED" || workOrder.status === "CANCELLED"}
                      >
                        Editar
                      </Button>
                    </div>
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
                            <label className="text-xs font-medium mb-1 block" htmlFor="entry-checklist-notes">
                              Notas del Checklist:
                            </label>
                            <Textarea
                              id="entry-checklist-notes"
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
                              &ldquo;{(workOrder.entryChecklist as any).notes}
                              &rdquo;
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
                      disabled={workOrder.status === "DELIVERED" || workOrder.status === "CANCELLED"}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Completar Checklist
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center shrink-0">
                      <LogOut className="h-3 w-3 text-white" aria-hidden="true" />
                    </span>
                    Checklist de Calidad (Salida)
                  </CardTitle>
                  {workOrder.exitChecklist && (
                    <div className="flex items-center gap-2">
                      {editingChecklist === "exit" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-primary hover:text-primary/80 px-2"
                          onClick={() => {
                            const allChecked = editingChecklistItems.every((item) => item.checked);
                            setEditingChecklistItems((prev) =>
                              prev.map((item) => ({ ...item, checked: !allChecked }))
                            );
                          }}
                        >
                          {editingChecklistItems.every((item) => item.checked)
                            ? "Desmarcar todos"
                            : "Marcar todos como OK"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="default"
                        onClick={() => startEditingChecklist("exit")}
                        disabled={workOrder.status === "DELIVERED" || workOrder.status === "CANCELLED"}
                      >
                        Editar
                      </Button>
                    </div>
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
                            <label className="text-xs font-medium mb-1 block" htmlFor="exit-checklist-notes">
                              Notas del Checklist:
                            </label>
                            <Textarea
                              id="exit-checklist-notes"
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
                              &ldquo;{(workOrder.exitChecklist as any).notes}
                              &rdquo;
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
                      disabled={workOrder.status === "DELIVERED" || workOrder.status === "CANCELLED"}
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="h-4 w-4 text-blue-500" />
                    Fotos de Ingreso
                  </CardTitle>
                  {workOrder.status !== "DELIVERED" && workOrder.status !== "CANCELLED" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="entry-photo-upload"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, "ENTRY")}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById("entry-photo-upload")?.click()}
                        disabled={uploadingEntry}
                      >
                        {uploadingEntry ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Cargar Fotos
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {workOrder.entryPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {workOrder.entryPhotos.map((url, index) => (
                      <div
                        key={index}
                        className="relative group overflow-hidden rounded-lg border aspect-video cursor-pointer"
                        onClick={() => {
                          const idx = lightboxPhotos.findIndex((item) => item.url === url && item.type === "ENTRY");
                          if (idx !== -1) setLightboxIndex(idx);
                        }}
                      >
                        <Image
                          src={url}
                          alt={`Ingreso ${index + 1}`}
                          width={300}
                          height={160}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        />
                        {workOrder.status !== "DELIVERED" && workOrder.status !== "CANCELLED" && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1.5 right-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                            onClick={(e) => handlePhotoDelete(url, e)}
                            title="Eliminar foto"
                            aria-label="Eliminar foto"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                    <Camera className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    Sin fotos de ingreso registradas
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="h-4 w-4 text-green-500" />
                    Fotos de Egreso
                  </CardTitle>
                  {workOrder.status !== "DELIVERED" && workOrder.status !== "CANCELLED" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="exit-photo-upload"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, "EXIT")}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById("exit-photo-upload")?.click()}
                        disabled={uploadingExit}
                      >
                        {uploadingExit ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Cargar Fotos
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {workOrder.exitPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {workOrder.exitPhotos.map((url, index) => (
                      <div
                        key={index}
                        className="relative group overflow-hidden rounded-lg border aspect-video cursor-pointer"
                        onClick={() => {
                          const idx = lightboxPhotos.findIndex((item) => item.url === url && item.type === "EXIT");
                          if (idx !== -1) setLightboxIndex(idx);
                        }}
                      >
                        <Image
                          src={url}
                          alt={`Egreso ${index + 1}`}
                          width={300}
                          height={160}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        />
                        {workOrder.status !== "DELIVERED" && workOrder.status !== "CANCELLED" && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1.5 right-1.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                            onClick={(e) => handlePhotoDelete(url, e)}
                            title="Eliminar foto"
                            aria-label="Eliminar foto"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                    <Camera className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    Sin fotos de egreso registradas
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
                            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
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
                              window.open(
                                `/adm/invoices/${inv.id}?print=true`,
                                "_blank",
                              )
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

        {/* Tab: Vehicle History */}
        <TabsContent value="vehicle-history" className="pt-4 outline-none">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary animate-pulse" />
                  Historial de Órdenes de Trabajo del Vehículo
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchVehicleHistory}
                  disabled={loadingHistory}
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      loadingHistory && "animate-spin",
                    )}
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : vehicleHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2 border-2 border-dashed rounded-lg bg-muted/20">
                  <Car className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm font-medium">Esta es la única orden de trabajo registrada para este vehículo</p>
                  <p className="text-xs text-muted-foreground/70">No se encontraron otras órdenes anteriores o paralelas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vehicleHistory.map((pastWo) => {
                    const totalCost = Number(pastWo.total);
                    const isPaid = pastWo.isFullyPaid;
                    const itemsList = pastWo.workOrderItems || [];

                    return (
                      <div
                        key={pastWo.id}
                        className="p-4 bg-muted/40 rounded-xl border border-zinc-200 shadow-sm space-y-3 transition-colors hover:bg-muted/60"
                      >
                        {/* Header of the past OT */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-sm text-foreground">
                              OT-{pastWo.id.substring(0, 8).toUpperCase()}
                            </span>
                            {/* Status badge */}
                            {(() => {
                              const config = STATUSES.find((s) => s.id === pastWo.status);
                              return (
                                <Badge
                                  variant="outline"
                                  className={cn("text-[11px] px-2 py-0.5", config?.color)}
                                >
                                  {config?.label || pastWo.status}
                                </Badge>
                              );
                            })()}
                            {/* Paid Badge */}
                            <Badge
                              variant={isPaid ? "outline" : "secondary"}
                              className={cn(
                                "text-[11px] px-2 py-0.5 font-mono",
                                isPaid
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : (pastWo.totalPaid || 0) > 0
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-slate-200 bg-slate-50 text-slate-600",
                              )}
                            >
                              {formatARS(totalCost)}
                            </Badge>
                          </div>
                          {/* Date and direct link */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground font-mono" title={new Date(pastWo.createdAt).toLocaleString("es-AR")}>
                              {new Date(pastWo.createdAt).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs flex items-center gap-1 bg-background hover:bg-muted text-zinc-700 hover:text-zinc-900"
                              onClick={() => handleDuplicateWorkOrder(pastWo)}
                              title="Duplicar esta orden de trabajo anterior"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Duplicar
                            </Button>
                            <Link href={`/adm/work-orders/${pastWo.id}`} target="_blank">
                              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs flex items-center gap-1 bg-background hover:bg-muted">
                                <Eye className="h-3.5 w-3.5" />
                                Ver OT
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Middle body section: responsible + checklist summaries */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          {pastWo.technician?.name && (
                            <div className="flex items-center gap-1.5 text-purple-700 font-medium bg-purple-50 px-2 py-1 rounded border border-purple-100">
                              <UserCog className="h-3.5 w-3.5 shrink-0" />
                              <span>{pastWo.technician.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100/50 px-2 py-1 rounded border">
                            <LogIn className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
                            <span className="text-xs shrink-0">Checklist Ingreso:</span>
                            <span className={cn("font-medium", pastWo.entryChecklist ? "text-blue-600" : "text-muted-foreground/50")}>
                              {pastWo.entryChecklist ? "Completado" : "Pendiente"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100/50 px-2 py-1 rounded border">
                            <LogOut className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                            <span className="text-xs shrink-0">Checklist Calidad:</span>
                            <span className={cn("font-medium", pastWo.exitChecklist ? "text-emerald-600" : "text-muted-foreground/50")}>
                              {pastWo.exitChecklist ? "Completado" : "Pendiente"}
                            </span>
                          </div>
                        </div>

                        {/* Notes of that past work order if any */}
                        {pastWo.notes && (
                          <div className="bg-background/80 border border-dashed rounded-lg p-3 text-xs text-muted-foreground italic relative">
                            <p className="line-clamp-3">&ldquo;{pastWo.notes}&rdquo;</p>
                          </div>
                        )}

                        {/* Items subtable/list inside past OT */}
                        {itemsList.length > 0 && (
                          <div className="space-y-1.5 bg-background/50 border rounded-lg p-3">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                              Productos y Servicios Realizados ({itemsList.length})
                            </p>
                            <div className="grid gap-1.5 max-h-32 overflow-y-auto">
                              {itemsList.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-1.5 truncate">
                                    {item.type === "PRODUCT" ? (
                                      <Package className="h-3 w-3 text-muted-foreground shrink-0" />
                                    ) : (
                                      <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
                                    )}
                                    <span className="font-semibold text-zinc-800 truncate">
                                      {item.name || item.product?.name || item.service?.name || "Item"}
                                    </span>
                                    <span className="text-muted-foreground font-mono text-[11px]">
                                      x{item.quantity}
                                    </span>
                                  </div>
                                  <span className="font-mono text-zinc-600 text-xs font-medium shrink-0">
                                    {formatARS(Number(item.subtotal))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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

      {/* Fullscreen Lightbox Modal */}
      {lightboxIndex !== null && lightboxPhotos[lightboxIndex] && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col justify-between p-4 md:p-6 transition-all animate-in fade-in duration-200">
          {/* Header controls */}
          <div className="flex items-center justify-between text-white select-none">
            <span className="text-sm font-medium font-mono">
              {lightboxPhotos[lightboxIndex].label} ({lightboxIndex + 1} de {lightboxPhotos.length})
            </span>
            <div className="flex items-center gap-2">
              <a
                href={lightboxPhotos[lightboxIndex].url}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                title="Descargar imagen"
                aria-label="Descargar"
              >
                <FileDown className="h-5 w-5" />
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxIndex(null)}
                className="text-white hover:bg-white/10 rounded-full h-9 w-9"
                title="Cerrar (Esc)"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main area */}
          <div className="flex-1 flex items-center justify-center relative my-4">
            {/* Left navigation */}
            {lightboxIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxIndex((prev) => prev !== null ? prev - 1 : null)}
                className="absolute left-2 md:left-4 z-10 text-white bg-black/20 hover:bg-white/10 rounded-full h-11 w-11"
                title="Anterior (←)"
                aria-label="Anterior"
              >
                <Undo2 className="h-6 w-6 rotate-180" />
              </Button>
            )}

            {/* Image */}
            <div className="relative max-w-full max-h-[75vh] md:max-h-[80vh] aspect-video w-full flex items-center justify-center">
              <img
                src={lightboxPhotos[lightboxIndex].url}
                alt={lightboxPhotos[lightboxIndex].label}
                className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
              />
            </div>

            {/* Right navigation */}
            {lightboxIndex < lightboxPhotos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLightboxIndex((prev) => prev !== null ? prev + 1 : null)}
                className="absolute right-2 md:right-4 z-10 text-white bg-black/20 hover:bg-white/10 rounded-full h-11 w-11"
                title="Siguiente (→)"
                aria-label="Siguiente"
              >
                <Undo2 className="h-6 w-6 scale-x-[-1]" />
              </Button>
            )}
          </div>

          {/* Footer description */}
          <div className="text-center text-white/70 text-xs py-2 font-mono">
            {lightboxPhotos[lightboxIndex].type === "ENTRY" ? "Foto tomada al ingreso del vehículo" : "Foto tomada al egreso del vehículo"}
          </div>
        </div>
      )}
    </div>
  );
}
