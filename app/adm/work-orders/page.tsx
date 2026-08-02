"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  LayoutGrid,
  List,
  ClipboardList,
  Wallet,
  DollarSign,
  MessageSquare,
  AlertCircle,
  UserCog,
  Eye,
  Search,
  X,
  Check,
  Calendar,
  Clock,
  PlayCircle,
  CheckCircle,
  Package,
  Camera,
  Download,
  LogIn,
  LogOut,
  Filter,
  type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/adm/Header";
import { CrudStats } from "@/components/adm/CrudStats";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getVehicleCategory } from "@/lib/constants/vehicle-categories";
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
import { formatARS, relativeTime } from "@/lib/utils/format";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface WorkOrder {
  id: string;
  status: string;
  customer: { name: string; phone: string };
  vehicle: {
    identifier: string;
    category: string;
    vehicleMake?: { name: string };
    vehicleModel?: { name: string };
  };
  total: number;
  technicianId?: string;
  scheduledDate?: string;
  createdAt: string;
  startedAt?: string;
  totalPaid?: number;
  isFullyPaid?: boolean;
  technician?: { id: string; name: string };
  entryChecklist?: any;
  exitChecklist?: any;
  photo?: Array<{ id: string; url: string }>;
  workOrderItems?: Array<{
    id: string;
    type: string;
    name: string | null;
    isManualName: boolean;
    productId?: string;
    serviceId?: string;
    product?: { name: string };
    service?: { name: string };
  }>;
}

const KANBAN_STATUSES = [
  { id: "CONFIRMED", label: "Confirmada", color: "bg-blue-50 border-blue-200 text-blue-700" },
  {
    id: "WAITING",
    label: "En Espera",
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
  },
  {
    id: "IN_PROGRESS",
    label: "En Proceso",
    color: "bg-orange-50 border-orange-200 text-orange-700",
  },
  {
    id: "QC_CHECK",
    label: "Control QC",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  { id: "READY", label: "Listo", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { id: "DELIVERED", label: "Entregada", color: "bg-gray-50 border-gray-200 text-gray-700" },
];

const STATUSES = [
  ...KANBAN_STATUSES,
  { id: "CANCELLED", label: "Cancelada", color: "bg-red-50 border-red-200 text-red-700" },
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

// --- Helper Functions ---

const getCategoryIcon = (category: string) => {
  const cat = getVehicleCategory(category);
  return { icon: cat.icon, label: cat.label };
};

const isDelayed = (wo: WorkOrder) => {
  const referenceDate = wo.startedAt
    ? new Date(wo.startedAt)
    : new Date(wo.createdAt);
  const daysInStatus = Math.floor(
    (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysInStatus > 3 && ["WAITING", "IN_PROGRESS"].includes(wo.status);
};

const getChecklistStats = (checklist: any) => {
  if (!checklist || !checklist.items || !Array.isArray(checklist.items) || checklist.items.length === 0) return null;
  const total = checklist.items.length;
  const checked = checklist.items.filter((item: any) => item.checked).length;
  const percentage = Math.round((checked / total) * 100);
  return { checked, total, percentage };
};

// --- Components ---

function KanbanCard({
  wo,
  isOverlay = false,
  technicians = [],
  onTechnicianUpdate,
  onStatusUpdate,
}: {
  wo: WorkOrder;
  isOverlay?: boolean;
  technicians?: Array<{ id: string; name: string }>;
  onTechnicianUpdate?: (woId: string, techId: string | null) => Promise<void>;
  onStatusUpdate?: (woId: string, newStatus: string) => Promise<void>;
}) {
  const { data: session } = authClient.useSession();
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
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const router = useRouter();
  const { icon: categoryIcon, label: categoryLabel } = getCategoryIcon(
    wo.vehicle.category,
  );

  const nextAction = NEXT_STATUS_MAP[wo.status];

  const content = (
    <Card
      className={cn(
        "group relative cursor-pointer hover:shadow-md transition-all bg-background shadow-sm",
        isDelayed(wo) && "bg-orange-50/40 ring-1 ring-orange-200",
        isDragging && !isOverlay && "opacity-30",
        isOverlay &&
          "shadow-xl border-primary ring-2 ring-primary ring-opacity-50 scale-105",
      )}
    >
      {/* Floating action icons - top right corner on hover */}
      {!isOverlay && !isDragging && (
        <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {nextAction && (
            <Button
              variant="secondary"
              size="sm"
              className="h-6 w-6 p-0 shadow-sm border bg-primary text-primary-foreground hover:bg-primary/90"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStatusUpdate?.(wo.id, nextAction.next);
              }}
              title={nextAction.label}
              aria-label={nextAction.label}
            >
              <nextAction.icon className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="h-6 w-6 p-0 shadow-sm border bg-white/90 hover:bg-white"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/adm/work-orders/${wo.id}`);
            }}
            title="Ver detalle"
            aria-label="Ver detalle"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          {wo.customer.phone && (
            <Button
              variant="secondary"
              size="sm"
              className="h-6 w-6 p-0 shadow-sm border bg-white/90 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
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
                window.open(getWhatsAppLink(wo.customer.phone, msg), "_blank");
                toast.success("Abriendo WhatsApp...", {
                  description: `Mensaje preparado para ${wo.customer.name}`,
                });
              }}
              title="Enviar WhatsApp"
              aria-label="Enviar WhatsApp"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
      <CardContent className="p-2.5 space-y-1.5">
        {/* Line 1: Category icon + Plate/SN */}
        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground shrink-0">
                  {categoryIcon}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{categoryLabel}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="font-mono text-sm font-semibold tracking-tighter truncate">
            {wo.vehicle.identifier}
          </span>
        </div>
        {/* Line 2: Customer name (full width) */}
        <p className="text-xs font-medium truncate leading-tight">
          {wo.customer.name}
        </p>
        {/* Line 2.5: Items summary */}
        {wo.workOrderItems && wo.workOrderItems.length > 0 && (
          <div className="text-[11px] text-muted-foreground/80 line-clamp-1 leading-tight border-t border-dashed pt-1 mt-1 font-sans">
            {wo.workOrderItems.map((item) => {
              const name = item.name || item.product?.name || item.service?.name || "Item";
              return (item.type === "PRODUCT" ? "📦" : "🔧") + " " + name;
            }).join(", ")}
          </div>
        )}
        {/* Line 3: Amount badge + Checklist/Photo Indicators */}
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] px-1.5 py-0 h-5 font-mono",
              wo.isFullyPaid
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : wo.totalPaid && wo.totalPaid > 0
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-slate-50 text-slate-600",
            )}
          >
            {formatARS(Number(wo.total))}
          </Badge>

          {/* Micro indicators for checklists and photos */}
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            {/* Checklist Entry Indicator */}
            {(() => {
              const entryStats = getChecklistStats(wo.entryChecklist);
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn(
                        "flex items-center shrink-0 cursor-help gap-0.5",
                        entryStats
                          ? entryStats.checked === entryStats.total
                            ? "text-emerald-600 font-bold"
                            : "text-blue-600 font-semibold"
                          : wo.entryChecklist
                            ? "text-blue-600 font-semibold"
                            : "text-muted-foreground/30"
                      )}>
                        <LogIn className="h-3 w-3" aria-hidden="true" />
                        {entryStats && (
                          <span className="text-[10px] font-mono leading-none">
                            {entryStats.checked}/{entryStats.total}
                          </span>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {entryStats
                          ? `Checklist de Ingreso: ${entryStats.checked} de ${entryStats.total} OK (${entryStats.percentage}%)`
                          : wo.entryChecklist
                            ? "Checklist de Ingreso: COMPLETADO"
                            : "Checklist de Ingreso: PENDIENTE"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })()}

            {/* Checklist Exit Indicator */}
            {(() => {
              const exitStats = getChecklistStats(wo.exitChecklist);
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn(
                        "flex items-center shrink-0 cursor-help gap-0.5",
                        exitStats
                          ? exitStats.checked === exitStats.total
                            ? "text-emerald-600 font-bold"
                            : "text-blue-600 font-semibold"
                          : wo.exitChecklist
                            ? "text-emerald-600 font-semibold"
                            : "text-muted-foreground/30"
                      )}>
                        <LogOut className="h-3 w-3" aria-hidden="true" />
                        {exitStats && (
                          <span className="text-[10px] font-mono leading-none">
                            {exitStats.checked}/{exitStats.total}
                          </span>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {exitStats
                          ? `Checklist de Salida: ${exitStats.checked} de ${exitStats.total} OK (${exitStats.percentage}%)`
                          : wo.exitChecklist
                            ? "Checklist de Salida: COMPLETADO"
                            : "Checklist de Salida: PENDIENTE"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })()}

            {/* Photo count indicator */}
            {wo.photo && wo.photo.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-0.5 text-slate-500 font-mono text-[11px] shrink-0 cursor-help">
                      <Camera className="h-3 w-3" />
                      {wo.photo.length}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{wo.photo.length} foto{wo.photo.length !== 1 ? "s" : ""} registrada{wo.photo.length !== 1 ? "s" : ""}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        {/* Line 4: Technician (full width) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border w-full transition-colors cursor-pointer",
                wo.technician
                  ? "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"
                  : "bg-muted/60 text-slate-600 border-slate-200/50 hover:bg-muted",
              )}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <UserCog className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">
                {wo.technician?.name || "Sin asignar"}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <DropdownMenuLabel className="text-xs font-semibold">
              Asignar Responsable
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {session?.user?.id && technicians.some((t) => t.id === session.user.id) && (
              <>
                <DropdownMenuItem
                  className="text-xs font-semibold text-purple-700 hover:text-purple-800"
                  onClick={() => onTechnicianUpdate?.(wo.id, session.user.id)}
                >
                  <UserCog className="h-3.5 w-3.5 mr-2 text-purple-600" />
                  Asignarme a mí
                  {wo.technician?.id === session.user.id && (
                    <Check className="h-3.5 w-3.5 ml-auto text-primary" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="text-xs"
              onClick={() => onTechnicianUpdate?.(wo.id, null)}
            >
              <X className="h-3.5 w-3.5 mr-2" />
              Sin asignar
              {!wo.technician && (
                <Check className="h-3.5 w-3.5 ml-auto text-primary" />
              )}
            </DropdownMenuItem>
            {technicians.map((tech) => (
              <DropdownMenuItem
                key={tech.id}
                className="text-xs"
                onClick={() => onTechnicianUpdate?.(wo.id, tech.id)}
              >
                <UserCog className="h-3.5 w-3.5 mr-2" />
                {tech.name}
                {wo.technician?.id === tech.id && (
                  <Check className="h-3.5 w-3.5 ml-auto text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Line 5: Date/Delayed status (full width) */}
        {isDelayed(wo) ? (
          <span className="text-white bg-orange-500 font-bold text-[11px] flex items-center justify-center gap-0.5 w-full px-1.5 py-0.5 rounded-full shadow-sm">
            <AlertCircle
              className="h-2.5 w-2.5 pointer-events-none"
              aria-hidden="true"
            />
            DEMORADA
          </span>
        ) : wo.scheduledDate ? (
          <span
            className={cn(
              "text-primary font-bold text-[11px] flex items-center gap-0.5",
              new Date(wo.scheduledDate).toDateString() ===
                new Date().toDateString() &&
                "bg-primary/10 px-1.5 py-0.5 rounded-full ring-1 ring-primary/20 justify-center w-full",
            )}
          >
            <Calendar
              className="h-2.5 w-2.5 pointer-events-none"
              aria-hidden="true"
            />
            {new Date(wo.scheduledDate).toDateString() ===
            new Date().toDateString()
              ? "HOY"
              : new Date(wo.scheduledDate).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                })}
          </span>
        ) : (
          <span
            className="font-mono text-[11px] text-muted-foreground/70 flex items-center gap-0.5"
            title={new Date(wo.createdAt).toLocaleString("es-AR")}
          >
            <Clock
              className="h-2.5 w-2.5 pointer-events-none"
              aria-hidden="true"
            />
            {relativeTime(wo.createdAt)}
          </span>
        )}
      </CardContent>
    </Card>
  );

  if (isOverlay) return content;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link
        href={`/adm/work-orders/${wo.id}`}
        onClick={(e) => {
          // Prevent navigation if we just finished dragging
          if (isDragging) e.preventDefault();
        }}
        className="block"
      >
        {content}
      </Link>
    </div>
  );
}

function KanbanColumn({
  status,
  items,
  technicians,
  onTechnicianUpdate,
  onStatusUpdate,
}: {
  status: (typeof STATUSES)[0];
  items: WorkOrder[];
  technicians: Array<{ id: string; name: string }>;
  onTechnicianUpdate: (woId: string, techId: string | null) => Promise<void>;
  onStatusUpdate: (woId: string, newStatus: string) => Promise<void>;
}) {
  const columnTotal = items.reduce((sum, wo) => sum + Number(wo.total), 0);
  const { setNodeRef } = useSortable({
    id: status.id,
    data: {
      type: "Column",
      statusId: status.id,
    },
  });

  return (
    <div className="flex flex-col w-[190px] shrink-0 h-full">
      <div
        className={cn(
          "p-3 rounded-t-lg border sticky top-0 z-10",
          status.color,
        )}
      >
        <div className="flex justify-between items-center">
          <span className="font-semibold text-sm">{status.label}</span>
          <span className="text-slate-700 text-[11px] font-mono bg-white/80 px-1.5 py-0.5 rounded-full border border-black/10 shadow-sm">
            {items.length}
          </span>
        </div>
        <div className="mt-1 text-xs font-mono text-slate-600 flex items-center gap-1 min-h-[16px]">
          {items.length > 0 && <>{formatARS(columnTotal)}</>}
        </div>
      </div>
      <div
        ref={setNodeRef}
        className="bg-muted/50 hover:bg-muted/60 transition-colors rounded-b-lg p-2 flex-1 overflow-y-auto border border-t-0 min-h-[150px]"
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {items.map((wo) => (
              <KanbanCard
                key={wo.id}
                wo={wo}
                technicians={technicians}
                onTechnicianUpdate={onTechnicianUpdate}
                onStatusUpdate={onStatusUpdate}
              />
            ))}
          </div>
          {items.length === 0 && (
            <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-muted-foreground/40 text-xs text-center px-4 gap-1.5">
              <ClipboardList
                className="h-6 w-6 pointer-events-none opacity-40"
                aria-hidden="true"
              />
              <span className="italic">Sin órdenes</span>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function WorkOrdersPage() {
  const { data: session } = authClient.useSession();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending">("all");
  const [delayedFilter, setDelayedFilter] = useState<"all" | "delayed">("all");
  const [todayFilter, setTodayFilter] = useState<"all" | "today">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [technicians, setTechnicians] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOriginalStatus, setDragOriginalStatus] = useState<string | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const fetchWorkOrders = useCallback(async () => {
    try {
      const [woRes, techRes] = await Promise.all([
        fetch("/api/work-orders"),
        fetch("/api/users?active=true"),
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
    let cancelled = false;
    const loadData = async () => {
      await Promise.resolve();
      if (cancelled) return;
      void fetchWorkOrders();
    };
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [fetchWorkOrders]);

  // Default to list view on mobile
  useEffect(() => {
    if (isMobile) setViewMode("list");
  }, [isMobile]);

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUSES.find((s) => s.id === status);
    return (
      <Badge
        variant="outline"
        className={cn("text-xs px-2 py-0.5", statusConfig?.color)}
      >
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const countPendingPayment = useMemo(() => {
    return workOrders.filter((wo) => !wo.isFullyPaid).length;
  }, [workOrders]);

  const countDelayed = useMemo(() => {
    return workOrders.filter((wo) => isDelayed(wo)).length;
  }, [workOrders]);

  const countToday = useMemo(() => {
    return workOrders.filter((wo) => {
      return (
        wo.scheduledDate &&
        new Date(wo.scheduledDate).toDateString() === new Date().toDateString()
      );
    }).length;
  }, [workOrders]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (paymentFilter !== "all") count++;
    if (delayedFilter !== "all") count++;
    if (todayFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (technicianFilter !== "all") count++;
    return count;
  }, [paymentFilter, delayedFilter, todayFilter, statusFilter, technicianFilter]);

  const clearAllFilters = useCallback(() => {
    setPaymentFilter("all");
    setDelayedFilter("all");
    setTodayFilter("all");
    setStatusFilter("all");
    setTechnicianFilter("all");
  }, []);

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesPayment = paymentFilter === "all" || !wo.isFullyPaid;
      const matchesStatus =
        statusFilter === "all" || wo.status === statusFilter;
      const matchesTechnician =
        technicianFilter === "all" || wo.technicianId === technicianFilter;

      const isDelayedWO = isDelayed(wo);
      const matchesDelayed = delayedFilter === "all" || isDelayedWO;

      const isTodayWO =
        wo.scheduledDate &&
        new Date(wo.scheduledDate).toDateString() === new Date().toDateString();
      const matchesToday = todayFilter === "all" || isTodayWO;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        wo.id.toLowerCase().includes(searchLower) ||
        wo.vehicle.identifier.toLowerCase().includes(searchLower) ||
        wo.customer.name.toLowerCase().includes(searchLower) ||
        wo.customer.phone?.toLowerCase().includes(searchLower) ||
        wo.vehicle.vehicleMake?.name?.toLowerCase().includes(searchLower) ||
        wo.vehicle.vehicleModel?.name?.toLowerCase().includes(searchLower);

      return (
        matchesPayment &&
        matchesStatus &&
        matchesTechnician &&
        matchesSearch &&
        matchesDelayed &&
        matchesToday
      );
    });
  }, [
    workOrders,
    paymentFilter,
    statusFilter,
    technicianFilter,
    searchQuery,
    delayedFilter,
    todayFilter,
  ]);

  const exportToCSV = useCallback(() => {
    if (!filteredWorkOrders || filteredWorkOrders.length === 0) return;

    const headers = [
      "ID OT",
      "Estado",
      "Cliente",
      "Telefono",
      "Patente",
      "Categoria",
      "Marca",
      "Modelo",
      "Responsable",
      "Total",
      "Pagado",
      "Pendiente",
      "Fecha Creacion",
      "Fecha Programada",
      "Checklist Ingreso",
      "Checklist Salida",
      "Cant Fotos",
    ];

    const rows = filteredWorkOrders.map((wo) => {
      const balance = Math.max(0, Number(wo.total) - (wo.totalPaid || 0));
      const makeName = wo.vehicle.vehicleMake?.name || "";
      const modelName = wo.vehicle.vehicleModel?.name || "";
      const technicianName = wo.technician?.name || "Sin asignar";
      const entryChecklistStatus = wo.entryChecklist ? "Completado" : "Pendiente";
      const exitChecklistStatus = wo.exitChecklist ? "Completado" : "Pendiente";
      const photoCount = wo.photo ? wo.photo.length : 0;

      return [
        wo.id,
        STATUSES.find((s) => s.id === wo.status)?.label || wo.status,
        wo.customer.name,
        wo.customer.phone || "",
        wo.vehicle.identifier,
        wo.vehicle.category,
        makeName,
        modelName,
        technicianName,
        Number(wo.total).toFixed(2),
        (wo.totalPaid || 0).toFixed(2),
        balance.toFixed(2),
        new Date(wo.createdAt).toLocaleDateString("es-AR"),
        wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString("es-AR") : "Sin agendar",
        entryChecklistStatus,
        exitChecklistStatus,
        photoCount.toString(),
      ];
    });

    const csvContent = "\ufeff" + [
      headers.join(","),
      ...rows.map((r) => r.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte_ordenes_trabajo_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado correctamente");
  }, [filteredWorkOrders]);

  const workOrdersByStatus = useMemo(
    () =>
      KANBAN_STATUSES.map((status) => {
        const items = filteredWorkOrders.filter(
          (wo) => wo.status === status.id,
        );
        return {
          ...status,
          items: status.id === "DELIVERED" ? items.slice(0, 10) : items,
        };
      }),
    [filteredWorkOrders],
  );

  const activeWorkOrder = useMemo(
    () => (activeId ? workOrders.find((wo) => wo.id === activeId) : null),
    [activeId, workOrders],
  );

  const stats = useMemo(() => {
    const openOrders = workOrders.filter(
      (wo) => wo.status !== "DELIVERED",
    ).length;
    const pendingPayment = workOrders.filter((wo) => !wo.isFullyPaid).length;
    const totalBilling = workOrders.reduce(
      (sum, wo) => sum + Number(wo.total),
      0,
    );

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
        value: formatARS(totalBilling),
        icon: DollarSign,
        iconColor: "#047857", // emerald-700
      },
    ];
  }, [workOrders]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const wo = event.active.data.current?.wo as WorkOrder | undefined;
    setDragOriginalStatus(wo?.status ?? null);
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
        setWorkOrders((prev) => {
          return prev.map((wo) => {
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
        setWorkOrders((prev) => {
          return prev.map((wo) => {
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
    const currentWOInState = workOrders.find((wo) => wo.id === activeWO.id);
    const finalStatus = currentWOInState?.status || newStatus;

    // Compare against the original status captured at drag start,
    // not activeWO.status which may have been mutated by the optimistic update in handleDragOver
    if (finalStatus !== dragOriginalStatus) {
      try {
        const response = await fetch(`/api/work-orders/${activeWO.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: finalStatus }),
        });
        if (!response.ok) throw new Error("Error al actualizar el estado");
        toast.success(
          `OT ${activeWO.vehicle.identifier} movida a ${STATUSES.find((s) => s.id === finalStatus)?.label}`,
        );
      } catch (e) {
        console.error("Error updating status:", e);
        toast.error("No se pudo actualizar el estado en el servidor");
        fetchWorkOrders(); // Revert on error
      }
    }
    setDragOriginalStatus(null);
  };

  const handleStatusUpdate = async (woId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/work-orders/${woId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Error al actualizar el estado");

      const updatedWO = await response.json();
      setWorkOrders((prev) =>
        prev.map((wo) => (wo.id === woId ? { ...wo, ...updatedWO } : wo)),
      );

      toast.success(
        `OT ${updatedWO.vehicle.identifier} movida a ${STATUSES.find((s) => s.id === newStatus)?.label}`,
      );
    } catch (e) {
      console.error("Error updating status:", e);
      toast.error("No se pudo actualizar el estado");
    }
  };

  const handleTechnicianUpdate = async (
    woId: string,
    techId: string | null,
  ) => {
    try {
      const response = await fetch(`/api/work-orders/${woId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: techId }),
      });
      if (!response.ok) throw new Error("Error al actualizar el responsable");

      const updatedWO = await response.json();
      setWorkOrders((prev) =>
        prev.map((wo) =>
          wo.id === woId
            ? {
                ...wo,
                technicianId: updatedWO.technicianId,
                technician: updatedWO.technician,
              }
            : wo,
        ),
      );

      toast.success("Responsable actualizado correctamente");
    } catch (e) {
      console.error("Error updating technician:", e);
      toast.error("No se pudo actualizar el responsable");
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
        shortTitle="OTs"
        description="Gestiona el flujo de trabajo del taller"
        primaryAction={{
          label: "Nueva OT",
          href: "/adm/work-orders/new",
          icon: Plus,
        }}
        secondaryActions={[
          {
            label: "Exportar CSV",
            onClick: exportToCSV,
            variant: "outline",
            icon: Download,
          },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="h-8 px-3"
            >
              <LayoutGrid
                className="h-4 w-4 mr-2 pointer-events-none"
                aria-hidden="true"
              />
              Kanban
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <List
                className="h-4 w-4 mr-2 pointer-events-none"
                aria-hidden="true"
              />
              Lista
            </Button>
          </div>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

          <div className="relative flex items-center gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                placeholder="Buscar por patente, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-[220px] pl-10 pr-8 text-xs font-mono"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5 pointer-events-none" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                {filteredWorkOrders.length} resultado
                {filteredWorkOrders.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={activeFiltersCount > 0 ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5"
              >
                <Filter className="h-3.5 w-3.5 pointer-events-none" aria-hidden="true" />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded font-mono font-bold bg-background/20">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Filtros</span>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpiar todo
                    </Button>
                  )}
                </div>

                {/* Estado group */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</p>
                  <div className="relative">
                    <ClipboardList
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                      aria-hidden="true"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 w-full pl-9 text-xs">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        {STATUSES.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="filter-delayed" className="text-xs flex items-center gap-1.5 cursor-pointer">
                      <AlertCircle className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
                      Demoradas
                      <span className="text-[11px] px-1.5 py-0.5 rounded font-mono font-bold bg-orange-100 text-orange-800">
                        {countDelayed}
                      </span>
                    </Label>
                    <Switch
                      id="filter-delayed"
                      checked={delayedFilter === "delayed"}
                      onCheckedChange={(checked) =>
                        setDelayedFilter(checked ? "delayed" : "all")
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="filter-today" className="text-xs flex items-center gap-1.5 cursor-pointer">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                      Turnos de Hoy
                      <span className="text-[11px] px-1.5 py-0.5 rounded font-mono font-bold bg-blue-100 text-blue-800">
                        {countToday}
                      </span>
                    </Label>
                    <Switch
                      id="filter-today"
                      checked={todayFilter === "today"}
                      onCheckedChange={(checked) =>
                        setTodayFilter(checked ? "today" : "all")
                      }
                    />
                  </div>
                </div>

                {/* Pago group */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pago</p>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="filter-payment" className="text-xs flex items-center gap-1.5 cursor-pointer">
                      <Wallet className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                      Pendientes de Pago
                      <span className="text-[11px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800">
                        {countPendingPayment}
                      </span>
                    </Label>
                    <Switch
                      id="filter-payment"
                      checked={paymentFilter === "pending"}
                      onCheckedChange={(checked) =>
                        setPaymentFilter(checked ? "pending" : "all")
                      }
                    />
                  </div>
                </div>

                {/* Técnico group */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Técnico</p>
                  <div className="relative">
                    <UserCog
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                      aria-hidden="true"
                    />
                    <Select
                      value={technicianFilter}
                      onValueChange={setTechnicianFilter}
                    >
                      <SelectTrigger className="h-8 w-full pl-9 text-xs">
                        <SelectValue placeholder="Responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los responsables</SelectItem>
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
            </PopoverContent>
          </Popover>

          {(searchQuery || activeFiltersCount > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                clearAllFilters();
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
              <div className="flex gap-1.5 h-full pb-2 px-1">
                {workOrdersByStatus.map((status) => (
                  <KanbanColumn
                    key={status.id}
                    status={status}
                    items={status.items}
                    technicians={technicians}
                    onTechnicianUpdate={handleTechnicianUpdate}
                    onStatusUpdate={handleStatusUpdate}
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
          ) : filteredWorkOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron órdenes de trabajo que coincidan con los filtros
            </div>
          ) : (
            filteredWorkOrders.map((wo) => {
              const { icon: categoryIcon, label: categoryLabel } =
                getCategoryIcon(wo.vehicle.category);
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
                              {wo.customer.name} • {wo.vehicle.vehicleMake?.name || ""}{" "}
                              {wo.vehicle.vehicleModel?.name || ""}
                            </div>
                            {wo.workOrderItems && wo.workOrderItems.length > 0 && (
                              <div className="text-xs text-muted-foreground/80 mt-1.5 flex flex-wrap gap-1 items-center">
                                <span className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/55 mr-1">Ítems:</span>
                                {wo.workOrderItems.map((item, i) => {
                                  const name = item.name || item.product?.name || item.service?.name || "Item";
                                  return (
                                    <span key={item.id || i} className="inline-flex items-center gap-0.5 bg-muted/80 px-2 py-0.5 rounded text-[11px] border border-muted-foreground/10 text-muted-foreground font-sans">
                                      {item.type === "PRODUCT" ? "📦" : "🔧"} {name}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Checklist & Photo Indicators */}
                          <div className="flex items-center gap-3 text-muted-foreground mr-2">
                            {(() => {
                              const entryStats = getChecklistStats(wo.entryChecklist);
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className={cn(
                                        "flex items-center gap-1 text-xs shrink-0 cursor-help",
                                        entryStats
                                          ? entryStats.checked === entryStats.total
                                            ? "text-emerald-600 font-bold"
                                            : "text-blue-600 font-semibold"
                                          : wo.entryChecklist
                                            ? "text-blue-600 font-semibold"
                                            : "text-muted-foreground/30"
                                      )}>
                                        <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                                        Checklist Ingreso {entryStats && `(${entryStats.checked}/${entryStats.total})`}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {entryStats
                                          ? `Checklist de Ingreso: ${entryStats.checked} de ${entryStats.total} OK (${entryStats.percentage}%)`
                                          : wo.entryChecklist
                                            ? "Checklist de Ingreso: COMPLETADO"
                                            : "Checklist de Ingreso: PENDIENTE"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })()}

                            {(() => {
                              const exitStats = getChecklistStats(wo.exitChecklist);
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className={cn(
                                        "flex items-center gap-1 text-xs shrink-0 cursor-help",
                                        exitStats
                                          ? exitStats.checked === exitStats.total
                                            ? "text-emerald-600 font-bold"
                                            : "text-blue-600 font-semibold"
                                          : wo.exitChecklist
                                            ? "text-emerald-600 font-semibold"
                                            : "text-muted-foreground/30"
                                      )}>
                                        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                                        Checklist Calidad {exitStats && `(${exitStats.checked}/${exitStats.total})`}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {exitStats
                                          ? `Checklist de Salida: ${exitStats.checked} de ${exitStats.total} OK (${exitStats.percentage}%)`
                                          : wo.exitChecklist
                                            ? "Checklist de Salida: COMPLETADO"
                                            : "Checklist de Salida: PENDIENTE"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })()}

                            {wo.photo && wo.photo.length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="flex items-center gap-1 text-slate-500 font-mono text-xs shrink-0 cursor-help">
                                      <Camera className="h-3.5 w-3.5" />
                                      {wo.photo.length}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{wo.photo.length} foto{wo.photo.length !== 1 ? "s" : ""} registrada{wo.photo.length !== 1 ? "s" : ""}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div
                                className={cn(
                                  "flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors cursor-pointer font-medium",
                                  wo.status === "CANCELLED" && "cursor-not-allowed opacity-60",
                                  wo.technician
                                    ? "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"
                                    : "bg-muted text-slate-600 border-slate-200 hover:bg-muted/80",
                                )}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <UserCog className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[120px]">
                                  {wo.technician?.name || "Sin asignar"}
                                </span>
                              </div>
                            </DropdownMenuTrigger>
                            {wo.status !== "CANCELLED" && (
                              <DropdownMenuContent
                                align="end"
                                className="w-48"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenuLabel className="text-xs font-semibold">
                                  Asignar Responsable
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {session?.user?.id && technicians.some((t) => t.id === session.user.id) && (
                                  <>
                                    <DropdownMenuItem
                                      className="text-xs font-semibold text-purple-700 hover:text-purple-800"
                                      onClick={() => handleTechnicianUpdate(wo.id, session.user.id)}
                                    >
                                      <UserCog className="h-3.5 w-3.5 mr-2 text-purple-600" />
                                      Asignarme a mí
                                      {wo.technician?.id === session.user.id && (
                                        <Check className="h-3.5 w-3.5 ml-auto text-primary" />
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem
                                  className="text-xs"
                                  onClick={() => handleTechnicianUpdate(wo.id, null)}
                                >
                                  <X className="h-3.5 w-3.5 mr-2" />
                                  Sin asignar
                                  {!wo.technician && (
                                    <Check className="h-3.5 w-3.5 ml-auto text-primary" />
                                  )}
                                </DropdownMenuItem>
                                {technicians.map((tech) => (
                                  <DropdownMenuItem
                                    key={tech.id}
                                    className="text-xs"
                                    onClick={() => handleTechnicianUpdate(wo.id, tech.id)}
                                  >
                                    <UserCog className="h-3.5 w-3.5 mr-2" />
                                    {tech.name}
                                    {wo.technician?.id === tech.id && (
                                      <Check className="h-3.5 w-3.5 ml-auto text-primary" />
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            )}
                          </DropdownMenu>

                          {wo.status === "READY" && wo.customer.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-emerald-700 hover:text-emerald-700 hover:bg-emerald-50"
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
                                window.open(
                                  getWhatsAppLink(wo.customer.phone, msg),
                                  "_blank",
                                );
                                toast.success("Abriendo WhatsApp...", {
                                  description: `Mensaje preparado para ${wo.customer.name}`,
                                });
                              }}
                              aria-label="Notificar por WhatsApp"
                            >
                              <MessageSquare
                                className="h-4 w-4 pointer-events-none"
                                aria-hidden="true"
                              />
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full border font-semibold inline-flex items-center gap-1 transition-all",
                                  wo.status === "CANCELLED" ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:brightness-95",
                                  STATUSES.find((s) => s.id === wo.status)?.color || "bg-gray-50 text-gray-700 border-gray-200"
                                )}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <ClipboardList className="h-3 w-3 shrink-0 opacity-80" />
                                <span>{STATUSES.find((s) => s.id === wo.status)?.label || wo.status}</span>
                              </button>
                            </DropdownMenuTrigger>
                            {wo.status !== "CANCELLED" && (
                              <DropdownMenuContent
                                align="end"
                                className="w-48"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenuLabel className="text-xs font-semibold">
                                  Cambiar Estado
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {STATUSES.map((status) => (
                                  <DropdownMenuItem
                                    key={status.id}
                                    className={cn(
                                      "text-xs flex items-center gap-2",
                                      wo.status === status.id && "font-semibold bg-muted"
                                    )}
                                    onClick={() => handleStatusUpdate(wo.id, status.id)}
                                  >
                                    <span className={cn("w-2 h-2 rounded-full", status.color.split(" ")[0])} />
                                    {status.label}
                                    {wo.status === status.id && (
                                      <Check className="h-3.5 w-3.5 ml-auto text-primary" />
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            )}
                          </DropdownMenu>
                          {wo.scheduledDate && (
                            <div
                              className={cn(
                                "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
                                new Date(wo.scheduledDate).toDateString() ===
                                  new Date().toDateString()
                                  ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              <Calendar className="h-3 w-3" />
                              {new Date(wo.scheduledDate).toDateString() ===
                              new Date().toDateString()
                                ? "HOY"
                                : new Date(wo.scheduledDate).toLocaleDateString(
                                    "es-AR",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                    },
                                  )}
                            </div>
                          )}
                          <Badge
                            variant={
                              wo.isFullyPaid
                                ? "outline"
                                : wo.totalPaid && wo.totalPaid > 0
                                  ? "secondary"
                                  : "outline"
                            }
                            className={cn(
                              "px-2.5 py-0.5 font-mono",
                              wo.isFullyPaid
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : wo.totalPaid && wo.totalPaid > 0
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "text-muted-foreground",
                            )}
                          >
                            {formatARS(Number(wo.total))}
                          </Badge>
                          <div
                            className="text-sm text-muted-foreground font-mono"
                            title={new Date(wo.createdAt).toLocaleString(
                              "es-AR",
                            )}
                          >
                            {relativeTime(wo.createdAt)}
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
