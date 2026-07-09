'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Header, CrudStats } from "@/components/adm";
import { Plus, Users, Wallet, User, TrendingDown } from "lucide-react";

export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <Header
        title="Clientes"
        description="Gestiona las fichas de tus clientes y sus saldos"
        primaryAction={{
          label: 'Nuevo Cliente',
          onClick: () => {},
          icon: Plus,
          disabled: true,
        }}
        secondaryActions={[
          {
            label: 'Filtrar con Saldo',
            onClick: () => {},
            variant: 'outline',
            icon: TrendingDown,
            disabled: true,
          },
        ]}
      />

      <div className="mt-4">
        <CrudStats
          stats={[
            { label: "Total Clientes", value: 0, icon: Users },
            { label: "Con Saldo", value: 0, icon: Wallet },
          ]}
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
        <div className="p-0">
          <div className="border-b px-4 py-3 bg-muted/30 flex gap-4">
            <div className="flex-[2]">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex-[0.5]">
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="w-[50px]"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-4 border-b last:border-0 flex items-center gap-4">
              <div className="flex-[2] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary/20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex-1">
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex-1">
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              </div>
              <div className="flex-1">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex-[0.5]">
                <Skeleton className="h-4 w-4" />
              </div>
              <div className="w-[50px] flex justify-end">
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
