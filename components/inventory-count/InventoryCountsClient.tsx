'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/adm/Header';
import { CreateCountOperative } from '@/components/inventory-count/CreateCountOperative';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye, Plus, ClipboardCheck, History, CheckCircle2, Clock } from 'lucide-react';
import { CrudAdmin } from '@/components/adm/CrudAdmin';
import { CrudStats } from '@/components/adm/CrudStats';
import { ColumnDef } from '@tanstack/react-table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InventoryCountItem {
  id: string;
  createdAt: string;
  itemCount: number;
  status: string;
  items: Array<{ reportedAt: string | null }>;
}

interface InventoryCountsClientProps {
  counts: InventoryCountItem[];
}

export function InventoryCountsClient({ counts }: InventoryCountsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const stats = useMemo(() => {
    const total = counts.length;
    const completed = counts.filter(c => c.status === 'COMPLETED' || c.status === 'APPROVED').length;
    const inProgress = counts.filter(c => c.status === 'IN_PROGRESS').length;
    const pending = counts.filter(c => c.status === 'PENDING').length;

    return [
      {
        label: 'Total Operativos',
        value: total.toString(),
        icon: ClipboardCheck,
        color: '#6366f1', // Indigo
      },
      {
        label: 'Completados',
        value: completed.toString(),
        icon: CheckCircle2,
        color: '#10b981', // Emerald
      },
      {
        label: 'En Proceso',
        value: inProgress.toString(),
        icon: Clock,
        color: '#3b82f6', // Blue
      },
      {
        label: 'Pendientes',
        value: pending.toString(),
        icon: History,
        color: '#f59e0b', // Amber
      }
    ];
  }, [counts]);

  const columns: ColumnDef<InventoryCountItem>[] = [
    {
      accessorKey: 'id',
      header: 'Operativo',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-sm">
                #{row.original.id.slice(-6).toUpperCase()}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                <span>{date.toLocaleDateString()}</span>
                <span className="opacity-50">•</span>
                <span>{date.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'itemCount',
      header: 'Artículos',
      cell: ({ row }) => <span>{row.original.itemCount} productos</span>,
    },
    {
      id: 'progress',
      header: 'Avance',
      cell: ({ row }) => {
        const reportedCount = row.original.items.filter(item => item.reportedAt !== null).length;
        const totalCount = row.original.items.length;
        const progressPercent = totalCount > 0 ? Math.round((reportedCount / totalCount) * 100) : 0;

        return (
          <div className="flex flex-col gap-1 w-[120px]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{reportedCount}/{totalCount}</span>
              <span className="text-xs text-muted-foreground">({progressPercent}%)</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <Header
          title="Conteo Cíclico Inteligente"
          description="Auditorías de stock basadas en riesgo y rotación"
          primaryAction={{
            label: 'Nuevo Conteo',
            onClick: () => setModalOpen(true),
            icon: Plus,
          }}
        />

        <CrudStats stats={stats} />

        <CrudAdmin
          items={counts}
          columns={columns}
          loading={false}
          createButtonText="Nuevo Conteo"
          onCreate={() => setModalOpen(true)}
          hideCreateAction={true}
          emptyMessage="No hay operativos registrados. Crea uno nuevo para comenzar."
          tableTitle="Operativos Recientes"
          rowActions={(count) => (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/adm/inventory-counts/${count.id}`}>
                    <Button size="icon" variant="ghost" aria-label="Ver Detalle">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Ver Detalle</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        />
      </div>

      <CreateCountOperative open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
          Pendiente
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
          En Proceso
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
          Realizado
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
          Aprobado
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
