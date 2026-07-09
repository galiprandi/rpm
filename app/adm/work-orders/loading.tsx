'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Header, CrudStats } from "@/components/adm";
import { Plus, ClipboardList, Wallet, DollarSign, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkOrdersLoading() {
  return (
    <div className="container mx-auto py-6 space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      <Header
        title="Órdenes de Trabajo"
        description="Gestiona el flujo de trabajo del taller"
        primaryAction={{
          label: "Nueva OT",
          href: "/adm/work-orders/new",
          icon: Plus,
          disabled: true,
        }}
      >
        <div className="flex items-center gap-2 mt-2">
          <Button variant="default" size="sm" disabled>
            <LayoutGrid className="h-4 w-4 mr-2" />
            Kanban
          </Button>
          <Button variant="outline" size="sm" disabled>
            <List className="h-4 w-4 mr-2" />
            Lista
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="outline" size="sm" disabled className="text-amber-700/50 border-amber-200/50 bg-amber-50/50">
            Pendientes de Pago
          </Button>
        </div>
      </Header>

      <CrudStats
        stats={[
          { label: "Abiertas", value: 0, icon: ClipboardList, iconColor: "#3b82f6" },
          { label: "Pend. Pago", value: 0, icon: Wallet, iconColor: "#f59e0b" },
          { label: "Facturación Total", value: "$0", icon: DollarSign, iconColor: "#10b981" },
        ]}
      />

      <div className="flex gap-2 h-full overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-1 min-w-[200px] flex flex-col h-full">
            <Skeleton className="h-11 w-full rounded-t-lg" />
            <div className="space-y-3 p-2 bg-muted/30 rounded-b-lg border border-t-0 flex-1">
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
