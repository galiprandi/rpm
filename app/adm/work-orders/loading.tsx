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
          <Button variant="outline" size="sm" disabled>
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

      <div className="flex gap-4 h-full overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 min-w-[250px] space-y-4">
            <Skeleton className="h-10 w-full rounded-t-lg" />
            <div className="space-y-3 p-2 bg-muted/10 rounded-b-lg border border-t-0">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
