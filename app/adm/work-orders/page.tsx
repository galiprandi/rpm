"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, List, ArrowUpDown, Car, Truck, Wrench, Headphones, Package } from "lucide-react";
import { Header } from "@/components/adm/Header";
import { cn } from "@/lib/utils";

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
  { id: "READY", label: "Listo", color: "bg-green-50 border-green-200" },
  { id: "DELIVERED", label: "Entregada", color: "bg-gray-50 border-gray-200" },
];

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const fetchWorkOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/work-orders");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setWorkOrders(data.workOrders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUSES.find((s) => s.id === status);
    return (
      <Badge variant="outline" className={cn("text-xs", statusConfig?.color)}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getPaymentColorClass = (wo: WorkOrder) => {
    if (wo.isFullyPaid) return "text-green-600";
    if (wo.totalPaid && wo.totalPaid > 0) return "text-yellow-600";
    return "text-gray-600";
  };

  const getCategoryIcon = (category: string) => {
    const normalizedCategory = category?.toUpperCase() || '';
    switch (normalizedCategory) {
      case 'CAR':
      case 'SUV':
      case 'PICKUP':
        return <Car className="h-4 w-4" />;
      case 'TRUCK':
        return <Truck className="h-4 w-4" />;
      case 'MOTORCYCLE':
        return <Wrench className="h-4 w-4" />;
      case 'AUDIO_EQUIPMENT':
        return <Headphones className="h-4 w-4" />;
      case 'TRAILER':
      case 'OTHER_EQUIPMENT':
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Check if OT is delayed (more than 3 days in current status without progress)
  // BUG FIX: Use startedAt when available, otherwise use createdAt
  const isDelayed = (wo: WorkOrder) => {
    const referenceDate = wo.startedAt ? new Date(wo.startedAt) : new Date(wo.createdAt);
    const daysInStatus = Math.floor(
      (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysInStatus > 3 && ["WAITING", "IN_PROGRESS"].includes(wo.status);
  };

  const workOrdersByStatus = STATUSES.map((status) => ({
    ...status,
    items: workOrders.filter((wo) => wo.status === status.id),
  }));

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">Cargando...</div>
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
        </div>
      </Header>

      {/* Content */}
      {viewMode === "kanban" ? (
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-x-auto">
            <div className="flex gap-2 h-full pb-2 px-1">
              {workOrdersByStatus.map((status) => (
                <div
                  key={status.id}
                  className="flex flex-col flex-1 min-w-[180px] h-full"
                >
                  {/* Sticky Header */}
                  <div
                    className={cn(
                      "p-3 rounded-t-lg font-semibold text-sm border sticky top-0 z-10",
                      status.color
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span>{status.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {status.items.length}
                      </span>
                    </div>
                  </div>
                  {/* Scrollable Column */}
                  <div className="bg-muted/30 rounded-b-lg p-2 flex-1 overflow-y-auto space-y-3 border border-t-0">
                    {status.items.map((wo) => (
                      <Link key={wo.id} href={`/adm/work-orders/${wo.id}`}>
                        <Card className={cn(
                          "cursor-pointer hover:shadow-md transition-all border-l-4",
                          isDelayed(wo) ? "border-l-red-500 bg-red-50/30" : "border-l-transparent"
                        )}>
                          <CardContent className="p-3 space-y-1.5">
                            {/* Vehicle Info - Primary */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-semibold text-sm">
                                {getCategoryIcon(wo.vehicle.category)}
                                {wo.vehicle.identifier}
                              </div>
                              <span className={cn("text-xs font-medium", getPaymentColorClass(wo))}>
                                ${Number(wo.total).toLocaleString("es-AR")}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {wo.vehicle.make?.name} {wo.vehicle.model?.name}
                            </div>
                            
                            {/* Customer - Secondary */}
                            <div className="flex justify-between items-center text-xs text-muted-foreground pt-0.5 border-t">
                              <span>{wo.customer.name}</span>
                              {isDelayed(wo) ? (
                                <span className="text-red-600 font-medium flex items-center gap-1">
                                  <ArrowUpDown className="h-3 w-3" />
                                  Atrasada
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
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
                          {getCategoryIcon(wo.vehicle.category)}
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
                        <div className={cn("font-medium", getPaymentColorClass(wo))}>
                          ${Number(wo.total).toLocaleString("es-AR")}
                        </div>
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
