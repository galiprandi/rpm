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
import { Plus, LayoutGrid, List, ArrowUpDown, Car, Truck, Wrench, Headphones, Package } from "lucide-react";
import { Header } from "@/components/adm/Header";
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
      return { icon: <Car className="h-4 w-4" />, label: "Automóvil" };
    case 'TRUCK':
      return { icon: <Truck className="h-4 w-4" />, label: "Camión / Pesado" };
    case 'MOTORCYCLE':
      return { icon: <Wrench className="h-4 w-4" />, label: "Moto / Mecánica" };
    case 'AUDIO_EQUIPMENT':
      return { icon: <Headphones className="h-4 w-4" />, label: "Audio / Electrónica" };
    case 'TRAILER':
      return { icon: <Package className="h-4 w-4" />, label: "Trailer / Remolque" };
    case 'OTHER_EQUIPMENT':
    default:
      return { icon: <Package className="h-4 w-4" />, label: "Otro / Equipamiento" };
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

function KanbanCard({ wo, isOverlay = false }: { wo: WorkOrder; isOverlay?: boolean }) {
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
      "group cursor-pointer hover:shadow-md transition-all border-l-4",
      isDelayed(wo) ? "border-l-orange-500 bg-orange-50/30" : "border-l-transparent",
      isDragging && !isOverlay && "opacity-30",
      isOverlay && "shadow-xl border-primary ring-2 ring-primary ring-opacity-50 scale-105"
    )}>
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
            {wo.vehicle.identifier}
          </div>
          <Badge
            variant={wo.isFullyPaid ? "outline" : (wo.totalPaid && wo.totalPaid > 0 ? "secondary" : "outline")}
            className={cn(
              "text-[10px] px-1.5 py-0 h-5",
              wo.isFullyPaid ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
              (wo.totalPaid && wo.totalPaid > 0 ? "border-yellow-200 bg-yellow-50 text-yellow-700" : "text-muted-foreground")
            )}
          >
            ${Number(wo.total).toLocaleString("es-AR")}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {wo.vehicle.make?.name} {wo.vehicle.model?.name}
        </div>

        <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1.5 border-t mt-1">
          <span className="font-medium">{wo.customer.name}</span>
          {isDelayed(wo) ? (
            <span className="text-orange-600 font-bold flex items-center gap-0.5">
              <ArrowUpDown className="h-2.5 w-2.5" />
              DEMORADA
            </span>
          ) : (
            <span>
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
      }}>
        {content}
      </Link>
    </div>
  );
}

function KanbanColumn({ status, items }: { status: typeof STATUSES[0]; items: WorkOrder[] }) {
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
          "p-3 rounded-t-lg font-semibold text-sm border sticky top-0 z-10",
          status.color
        )}
      >
        <div className="flex justify-between items-center">
          <span>{status.label}</span>
          <span className="text-muted-foreground text-xs">
            {items.length}
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className="bg-muted/30 hover:bg-muted/40 transition-colors rounded-b-lg p-2 flex-1 overflow-y-auto space-y-3 border border-t-0 min-h-[150px]"
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((wo) => (
            <KanbanCard key={wo.id} wo={wo} />
          ))}
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
      const response = await fetch("/api/work-orders");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setWorkOrders(data.workOrders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      toast.error("Error al cargar las órdenes de trabajo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchWorkOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUSES.find((s) => s.id === status);
    return (
      <Badge variant="outline" className={cn("text-xs", statusConfig?.color)}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const filteredWorkOrders = useMemo(() => {
    if (paymentFilter === "pending") {
      return workOrders.filter((wo) => !wo.isFullyPaid);
    }
    return workOrders;
  }, [workOrders, paymentFilter]);

  const workOrdersByStatus = useMemo(() => STATUSES.map((status) => ({
    ...status,
    items: filteredWorkOrders.filter((wo) => wo.status === status.id),
  })), [filteredWorkOrders]);

  const activeWorkOrder = useMemo(() =>
    activeId ? workOrders.find(wo => wo.id === activeId) : null
  , [activeId, workOrders]);

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
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-2" />
            Lista
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant={paymentFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setPaymentFilter(paymentFilter === "pending" ? "all" : "pending")}
            className={paymentFilter === "pending" ? "bg-amber-600 hover:bg-amber-700" : ""}
          >
            Pendientes de Pago
            {paymentFilter === "pending" && (
              <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                {filteredWorkOrders.length}
              </span>
            )}
          </Button>
        </div>
      </Header>

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
                  />
                ))}
              </div>
              <DragOverlay>
                {activeId && activeWorkOrder ? (
                  <KanbanCard wo={activeWorkOrder} isOverlay />
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
            workOrders.map((wo) => (
              <Link key={wo.id} href={`/adm/work-orders/${wo.id}`}>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 font-medium text-lg">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-muted-foreground">
                                  {getCategoryIcon(wo.vehicle.category).icon}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{getCategoryIcon(wo.vehicle.category).label}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {wo.vehicle.identifier}
                        </div>
                        <div>
                          <div className="font-medium">{wo.customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {wo.vehicle.make?.name} {wo.vehicle.model?.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(wo.status)}
                        <Badge
                          variant={wo.isFullyPaid ? "outline" : (wo.totalPaid && wo.totalPaid > 0 ? "secondary" : "outline")}
                          className={cn(
                            "px-2.5 py-0.5",
                            wo.isFullyPaid ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                            (wo.totalPaid && wo.totalPaid > 0 ? "border-yellow-200 bg-yellow-50 text-yellow-700" : "text-muted-foreground")
                          )}
                        >
                          ${Number(wo.total).toLocaleString("es-AR")}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {new Date(wo.createdAt).toLocaleDateString("es-AR")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
