"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, LayoutGrid, List, Car, Truck, Wrench, Headphones, Package, ClipboardList, Wallet, DollarSign, MessageSquare, AlertCircle, UserCog, Eye, Search, X, Check } from "lucide-react";
import { Header } from "@/components/adm/Header";
import { CrudStats } from "@/components/adm/CrudStats";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { getWhatsAppLink, getWorkOrderMessage } from "@/lib/utils/whatsapp";

interface WorkOrder {
  id: string;
  status: string;
  customer: { name: string; phone: string };
  vehicle: { identifier: string; category: string; make?: { name: string }; model?: { name: string } };
  total: number;
  technicianId?: string;
  scheduledDate?: string;
  createdAt: string;
  startedAt?: string;
  totalPaid?: number;
  isFullyPaid?: boolean;
  technician?: { id: string; name: string };
}

const STATUSES = [
  { id: "CONFIRMED", label: "Confirmada", color: "bg-blue-50 border-blue-200" },
  { id: "WAITING", label: "En Espera", color: "bg-yellow-50 border-yellow-200" },
  { id: "IN_PROGRESS", label: "En Proceso", color: "bg-orange-50 border-orange-200" },
  { id: "QC_CHECK", label: "Control QC", color: "bg-purple-50 border-purple-200" },
  { id: "READY", label: "Listo", color: "bg-emerald-50 border-emerald-200" },
  { id: "DELIVERED", label: "Entregada", color: "bg-gray-50 border-gray-200" },
];

// --- Helper Functions ---

const getCategoryIcon = (category: string) => {
  const normalizedCategory = category?.toUpperCase() || '';
  switch (normalizedCategory) {
    case 'CAR':
    case 'SUV':
    case 'PICKUP':
      return { icon: <Car className="h-4 w-4 pointer-events-none" aria-hidden="true" />, label: "Automóvil" };
    case 'TRUCK':
      return { icon: <Truck className="h-4 w-4 pointer-events-none" aria-hidden="true" />, label: "Camión / Pesado" };
    case 'MOTORCYCLE':
      return { icon: <Wrench className="h-4 w-4 pointer-events-none" aria-hidden="true" />, label: "Moto / Mecánica" };
    case 'AUDIO_EQUIPMENT':
      return { icon: <Headphones className="h-4 w-4 pointer-events-none" aria-hidden="true" />, label: "Audio / Electrónica" };
    case 'TRAILER':
      return { icon: <Package className="h-4 w-4 pointer-events-none" aria-hidden="true" />, label: "Trailer / Remolque" };
    case 'OTHER_EQUIPMENT':
    default:
      return { icon: <Package className="h-4 w-4 pointer-events-none" aria-hidden="true" />, label: "Otro / Equipamiento" };
  }
};

const isDelayed = (wo: WorkOrder) => {
  const referenceDate = wo.startedAt ? new Date(wo.startedAt) : new Date(wo.createdAt);
  const daysInStatus = Math.floor(
    (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysInStatus > 3 && ["WAITING", "IN_PROGRESS"].includes(wo.status);
};

// --- Components ---

function KanbanCard({ wo, isOverlay = false, technicians = [], onTechnicianUpdate }: {
  wo: WorkOrder;
  isOverlay?: boolean;
  technicians?: Array<{ id: string; name: string }>;
  onTechnicianUpdate?: (woId: string, techId: string | null) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: wo.id,
    data: {
      type: "WorkOrder",
      wo,
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const { icon: categoryIcon, label: categoryLabel } = getCategoryIcon(wo.vehicle.category);

  const content = (
    <Card className={cn(
      "group relative cursor-pointer hover:shadow-md transition-all border-l-4",
      isDelayed(wo) ? "border-l-orange-500 bg-orange-50/30" : "border-l-transparent",
      isDragging && !isOverlay && "opacity-30",
      isOverlay && "shadow-xl border-primary ring-2 ring-primary ring-opacity-50 scale-105"
    )}>
      {/* Quick Actions Overlay */}
      {!isOverlay && !isDragging && (
        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 rounded-lg">
          <Link href={`/adm/work-orders/${wo.id}`} className="contents">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 shadow-sm border"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Eye className="h-4 w-4 mr-1" />
              Detalle
            </Button>
          </Link>
          {wo.customer.phone && (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 shadow-sm border text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const msg = getWorkOrderMessage({
                  customerName: wo.customer.name,
                  vehicleIdentifier: wo.vehicle.identifier,
                  status: wo.status,
                  total: Number(wo.total),
                  totalPaid: wo.totalPaid || 0,
                });
                window.open(getWhatsAppLink(wo.customer.phone, msg), '_blank');
              }}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              WA
            </Button>
          )}
        </div>
      )}
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    {categoryIcon}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{categoryLabel}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="font-mono tracking-tighter">{wo.vehicle.identifier}</span>
          </div>
          <Badge
            variant={wo.isFullyPaid ? "outline" : (wo.totalPaid && wo.totalPaid > 0 ? "secondary" : "outline")}
            className={cn(
              "text-[10px] px-1.5 py-0 h-5 font-mono",
              wo.isFullyPaid ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
              (wo.totalPaid && wo.totalPaid > 0 ? "border-amber-200 bg-amber-50 text-amber-700" : "text-muted-foreground")
            )}
          >
            ${Number(wo.total).toLocaleString("es-AR")}
          </Badge>
        </div>
        <div className="flex justify-between items-center gap-2">
          <div className="text-xs text-muted-foreground truncate">
            {wo.vehicle.make?.name} {wo.vehicle.model?.name}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border shrink-0 max-w-[100px] transition-colors cursor-pointer z-20",
                  wo.technician
                    ? "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                )}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <UserCog className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{wo.technician?.name || "Sin técnico"}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onMouseDown={(e) => e.stopPropagation()}>
              <DropdownMenuLabel className="text-xs font-semibold">Asignar Técnico</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs"
                onClick={() => onTechnicianUpdate?.(wo.id, null)}
              >
                <X className="h-3.5 w-3.5 mr-2" />
                Sin asignar
                {!wo.technician && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
              </DropdownMenuItem>
              {technicians.map((tech) => (
                <DropdownMenuItem
                  key={tech.id}
                  className="text-xs"
                  onClick={() => onTechnicianUpdate?.(wo.id, tech.id)}
                >
                  <UserCog className="h-3.5 w-3.5 mr-2" />
                  {tech.name}
                  {wo.technician?.id === tech.id && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1.5 border-t mt-1">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="font-medium truncate">{wo.customer.name}</span>
            {wo.status === 'READY' && wo.customer.phone && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const msg = getWorkOrderMessage({
                    customerName: wo.customer.name,
                    vehicleIdentifier: wo.vehicle.identifier,
                    status: wo.status,
                    total: Number(wo.total),
                    totalPaid: wo.totalPaid || 0,
                  });
                  window.open(getWhatsAppLink(wo.customer.phone, msg), '_blank');
                }}
                className="h-5 w-5 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0"
                title="Notificar por WhatsApp"
                aria-label="Notificar por WhatsApp"
              >
                <MessageSquare className="h-3 w-3 pointer-events-none" aria-hidden="true" />
              </Button>
            )}
          </div>
          {isDelayed(wo) ? (
            <span className="text-orange-700 font-bold flex items-center gap-0.5">
              <AlertCircle className="h-2.5 w-2.5 pointer-events-none" aria-hidden="true" />
              DEMORADA
            </span>
          ) : (
            <span className="font-mono">
              {new Date(wo.createdAt).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short"
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isOverlay) return content;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/adm/work-orders/${wo.id}`} onClick={(e) => {
        // Prevent navigation if we just finished dragging
        if (isDragging) e.preventDefault();
      }} className="block">
        {content}
      </Link>
    </div>
  );
}

function KanbanColumn({
  status,
  items,
  technicians,
  onTechnicianUpdate
}: {
  status: typeof STATUSES[0];
  items: WorkOrder[];
  technicians: Array<{ id: string; name: string }>;
  onTechnicianUpdate: (woId: string, techId: string | null) => Promise<void>;
}) {
  const columnTotal = items.reduce((sum, wo) => sum + Number(wo.total), 0);
  const { setNodeRef } = useSortable({
    id: status.id,
    data: {
      type: "Column",
      statusId: status.id,
    }
  });

  return (
    <div className="flex flex-col flex-1 min-w-[200px] h-full">
      <div
        className={cn(
          "p-3 rounded-t-lg border sticky top-0 z-10",
          status.color
        )}
      >
        <div className="flex justify-between items-center">
          <span className="font-semibold text-sm">{status.label}</span>
          <span className="text-muted-foreground text-[10px] font-mono bg-white/50 px-1.5 py-0.5 rounded-full border border-black/5">
            {items.length}
          </span>
        </div>
        {items.length > 0 && (
          <div className="mt-1 text-xs font-mono text-muted-foreground/80 flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {columnTotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
          </div>
        )}
      </div>
      <div
        ref={setNodeRef}
        className="bg-muted/30 hover:bg-muted/40 transition-colors rounded-b-lg p-2 flex-1 overflow-y-auto border border-t-0 min-h-[150px]"
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((wo) => (
              <KanbanCard
                key={wo.id}
                wo={wo}
                technicians={technicians}
                onTechnicianUpdate={onTechnicianUpdate}
              />
            ))}
          </div>
          {items.length === 0 && (
            <div className="h-full min-h-[100px] flex items-center justify-center text-muted-foreground/50 text-xs text-center px-4 italic">
              Sin órdenes
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending">("all");
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string }>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const fetchWorkOrders = useCallback(async () => {
    try {
      const [woRes, techRes] = await Promise.all([
        fetch("/api/work-orders"),
        fetch("/api/users?role=TECHNICIAN"),
      ]);

      if (!woRes.ok) throw new Error("Failed to fetch work orders");
      const woData = await woRes.json();
      setWorkOrders(woData.workOrders);

      if (techRes.ok) {
        const techData = await techRes.json();
        setTechnicians(techData.users || []);
      }
    } catch (error) {
      console.error("Error fetching work orders:", error);
      toast.error("Error al cargar las órdenes de trabajo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWorkOrders();
  }, [fetchWorkOrders]);

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUSES.find((s) => s.id === status);
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs px-2 py-0.5",
          statusConfig?.color
        )}
      >
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesPayment = paymentFilter === "all" || !wo.isFullyPaid;
      const matchesTechnician = technicianFilter === "all" || wo.technicianId === technicianFilter;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        wo.vehicle.identifier.toLowerCase().includes(searchLower) ||
        wo.customer.name.toLowerCase().includes(searchLower) ||
        wo.vehicle.make?.name?.toLowerCase().includes(searchLower) ||
        wo.vehicle.model?.name?.toLowerCase().includes(searchLower);

      return matchesPayment && matchesTechnician && matchesSearch;
    });
  }, [workOrders, paymentFilter, technicianFilter, searchQuery]);

  const workOrdersByStatus = useMemo(() => STATUSES.map((status) => ({
    ...status,
    items: filteredWorkOrders.filter((wo) => wo.status === status.id),
  })), [filteredWorkOrders]);

  const activeWorkOrder = useMemo(() =>
    activeId ? workOrders.find(wo => wo.id === activeId) : null
  , [activeId, workOrders]);

  const stats = useMemo(() => {
    const openOrders = workOrders.filter(wo => wo.status !== 'DELIVERED').length;
    const pendingPayment = workOrders.filter(wo => !wo.isFullyPaid).length;
    const totalBilling = workOrders.reduce((sum, wo) => sum + Number(wo.total), 0);

    return [
      {
        label: "Abiertas",
        value: openOrders,
        icon: ClipboardList,
        iconColor: "#3b82f6", // blue-500
      },
      {
        label: "Pend. Pago",
        value: pendingPayment,
        icon: Wallet,
        iconColor: "#b45309", // amber-700
      },
      {
        label: "Facturación Total",
        value: `$${totalBilling.toLocaleString("es-AR")}`,
        icon: DollarSign,
        iconColor: "#047857", // emerald-700
      }
    ];
  }, [workOrders]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAWorkOrder = active.data.current?.type === "WorkOrder";
    if (!isActiveAWorkOrder) return;

    const activeWO = active.data.current?.wo;
    if (!activeWO) return;

    // Dropping over another WorkOrder
    if (over.data.current?.type === "WorkOrder") {
      const overWO = over.data.current.wo;

      if (activeWO.status !== overWO.status) {
        setWorkOrders(prev => {
          return prev.map(wo => {
            if (wo.id === activeId) {
              return { ...wo, status: overWO.status };
            }
            return wo;
          });
        });
      }
    }

    // Dropping over a Column
    if (over.data.current?.type === "Column") {
      const overStatusId = over.data.current.statusId;

      if (activeWO.status !== overStatusId) {
        setWorkOrders(prev => {
          return prev.map(wo => {
            if (wo.id === activeId) {
              return { ...wo, status: overStatusId };
            }
            return wo;
          });
        });
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeWO = active.data.current?.wo as WorkOrder | undefined;
    if (!activeWO) return;

    let newStatus = activeWO.status;

    if (over.data.current?.type === "WorkOrder") {
      newStatus = over.data.current.wo.status;
    } else if (over.data.current?.type === "Column") {
      newStatus = over.data.current.statusId;
    }

    // Find the current status in state (it might have been updated by handleDragOver)
    const currentWOInState = workOrders.find(wo => wo.id === activeWO.id);
    const finalStatus = currentWOInState?.status || newStatus;

    if (finalStatus !== activeWO.status) {
      try {
        const response = await fetch(`/api/work-orders/${activeWO.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: finalStatus }),
        });
        if (!response.ok) throw new Error("Error al actualizar el estado");
        toast.success(`OT ${activeWO.vehicle.identifier} movida a ${STATUSES.find(s => s.id === finalStatus)?.label}`);
      } catch (e) {
        console.error("Error updating status:", e);
        toast.error("No se pudo actualizar el estado en el servidor");
        fetchWorkOrders(); // Revert on error
      }
    }
  };

  const handleTechnicianUpdate = async (woId: string, techId: string | null) => {
    try {
      const response = await fetch(`/api/work-orders/${woId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: techId }),
      });
      if (!response.ok) throw new Error("Error al actualizar el técnico");

      const updatedWO = await response.json();
      setWorkOrders(prev => prev.map(wo => wo.id === woId ? {
        ...wo,
        technicianId: updatedWO.technicianId,
        technician: updatedWO.technician
      } : wo));

      toast.success("Técnico actualizado correctamente");
    } catch (e) {
      console.error("Error updating technician:", e);
      toast.error("No se pudo actualizar el técnico");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4 h-[calc(100vh-6rem)] flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex gap-4 h-full overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 min-w-[250px] space-y-4">
              <Skeleton className="h-10 w-full rounded-t-lg" />
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      <Header
        title="Órdenes de Trabajo"
        description="Gestiona el flujo de trabajo del taller"
        primaryAction={{
          label: "Nueva OT",
          href: "/adm/work-orders/new",
          icon: Plus,
        }}
      >
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-2 pointer-events-none" aria-hidden="true" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <List className="h-4 w-4 mr-2 pointer-events-none" aria-hidden="true" />
              Lista
            </Button>
          </div>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              placeholder="Buscar por patente, cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-[200px] pl-9 text-xs"
            />
          </div>

          <Button
            variant={paymentFilter === "pending" ? "outline" : "outline"}
            size="sm"
            onClick={() => setPaymentFilter(paymentFilter === "pending" ? "all" : "pending")}
            className={cn(
              "h-8 text-xs",
              paymentFilter === "pending"
                ? "text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-800"
                : ""
            )}
          >
            Pendientes de Pago
            {paymentFilter === "pending" && (
              <span className="ml-2 text-[10px] bg-amber-700/10 px-1.5 py-0.5 rounded font-mono">
                {filteredWorkOrders.length}
              </span>
            )}
          </Button>

          <div className="relative">
            <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Select
              value={technicianFilter}
              onValueChange={setTechnicianFilter}
            >
              <SelectTrigger className="h-8 w-[150px] pl-9 text-xs">
                <SelectValue placeholder="Técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los técnicos</SelectItem>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || paymentFilter !== "all" || technicianFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setPaymentFilter("all");
                setTechnicianFilter("all");
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </Header>

      <CrudStats stats={stats} />

      {/* Content */}
      {viewMode === "kanban" ? (
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-2 h-full pb-2 px-1">
                {workOrdersByStatus.map((status) => (
                  <KanbanColumn
                    key={status.id}
                    status={status}
                    items={status.items}
                    technicians={technicians}
                    onTechnicianUpdate={handleTechnicianUpdate}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeId && activeWorkOrder ? (
                  <KanbanCard
                    wo={activeWorkOrder}
                    isOverlay
                    technicians={technicians}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
          {workOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay órdenes de trabajo
            </div>
          ) : (
            workOrders.map((wo) => {
              const { icon: categoryIcon, label: categoryLabel } = getCategoryIcon(wo.vehicle.category);
              return (
                <Link key={wo.id} href={`/adm/work-orders/${wo.id}`}>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Standardized List Row Entity Pattern */}
                          <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-primary">
                                    {categoryIcon}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{categoryLabel}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div>
                            <div className="font-semibold tracking-tight font-mono">
                              {wo.vehicle.identifier}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {wo.customer.name} • {wo.vehicle.make?.name} {wo.vehicle.model?.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {wo.technician && (
                            <div className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 font-medium">
                              <UserCog className="h-3 w-3" />
                              {wo.technician.name}
                            </div>
                          )}
                          {wo.status === 'READY' && wo.customer.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const msg = getWorkOrderMessage({
                                  customerName: wo.customer.name,
                                  vehicleIdentifier: wo.vehicle.identifier,
                                  status: wo.status,
                                  total: Number(wo.total),
                                  totalPaid: wo.totalPaid || 0,
                                });
                                window.open(getWhatsAppLink(wo.customer.phone, msg), '_blank');
                              }}
                              aria-label="Notificar por WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4 pointer-events-none" aria-hidden="true" />
                            </Button>
                          )}
                          {getStatusBadge(wo.status)}
                          <Badge
                            variant={wo.isFullyPaid ? "outline" : (wo.totalPaid && wo.totalPaid > 0 ? "secondary" : "outline")}
                            className={cn(
                              "px-2.5 py-0.5 font-mono",
                              wo.isFullyPaid
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : wo.totalPaid && wo.totalPaid > 0
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "text-muted-foreground"
                            )}
                          >
                            ${Number(wo.total).toLocaleString("es-AR")}
                          </Badge>
                          <div className="text-sm text-muted-foreground font-mono">
                            {new Date(wo.createdAt).toLocaleDateString("es-AR")}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
