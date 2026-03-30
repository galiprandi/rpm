"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkOrder {
  id: string;
  status: string;
  customer: { fullName: string; phone: string };
  vehicle: { identifier: string; category: string };
  total: number;
  technicianId?: string;
  scheduledDate?: string;
  createdAt: string;
}

const STATUSES = [
  { id: "CONFIRMED", label: "Confirmada", color: "bg-blue-100" },
  { id: "WAITING", label: "En Espera", color: "bg-yellow-100" },
  { id: "IN_PROGRESS", label: "En Proceso", color: "bg-orange-100" },
  { id: "QC_CHECK", label: "Control QC", color: "bg-purple-100" },
  { id: "READY", label: "Listo", color: "bg-green-100" },
  { id: "PAID", label: "Pagada", color: "bg-emerald-100" },
  { id: "DELIVERED", label: "Entregada", color: "bg-gray-100" },
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
      <Badge className={cn("text-xs", statusConfig?.color || "bg-gray-100")}>
        {statusConfig?.label || status}
      </Badge>
    );
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
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            Órdenes de Trabajo
            <Badge variant="outline">{workOrders.length}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Link href="/adm/work-orders/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva OT
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "kanban" ? (
            <div className="grid grid-cols-7 gap-2 overflow-x-auto">
              {workOrdersByStatus.map((status) => (
                <div key={status.id} className="min-w-[180px]">
                  <div
                    className={cn(
                      "p-2 rounded-t-md font-medium text-sm text-center",
                      status.color
                    )}
                  >
                    {status.label}
                    <span className="ml-1 text-muted-foreground">
                      ({status.items.length})
                    </span>
                  </div>
                  <div className="bg-muted/50 rounded-b-md p-2 space-y-2 min-h-[200px]">
                    {status.items.map((wo) => (
                      <Link key={wo.id} href={`/adm/work-orders/${wo.id}`}>
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-3">
                            <div className="font-medium text-sm truncate">
                              {wo.customer.fullName}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {wo.vehicle.identifier}
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs font-medium">
                                ${Number(wo.total).toLocaleString("es-AR")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(wo.createdAt).toLocaleDateString("es-AR")}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
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
                            <div className="font-medium">{wo.id}</div>
                            <div>
                              <div className="font-medium">{wo.customer.fullName}</div>
                              <div className="text-sm text-muted-foreground">
                                {wo.vehicle.identifier} • {wo.vehicle.category}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {getStatusBadge(wo.status)}
                            <div className="font-medium">
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
        </CardContent>
      </Card>
    </div>
  );
}
