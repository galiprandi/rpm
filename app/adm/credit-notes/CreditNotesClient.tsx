'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useUI } from '@/components/ui/UIProvider';
import { Header, CrudStats, CrudAdmin, type StatItem } from '@/components/adm';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Receipt,
  Ban,
  XCircle,
  Eye,
  FileText,
  ShoppingCart,
  ClipboardList,
  User
} from 'lucide-react';
import { formatARS } from '@/lib/utils/format';

interface CreditNote {
  id: string;
  originalSaleId: string;
  originalSaleType: string;
  customerId: string | null;
  customer: { id: string; name: string; phone: string | null } | null;
  total: number;
  refundMethod: string;
  status: string;
  createdAt: string;
  itemCount: number;
}

interface CreditNotesClientProps {
  initialCreditNotes: CreditNote[];
}

export default function CreditNotesClient({ initialCreditNotes }: CreditNotesClientProps) {
  const { alert, confirm } = useUI();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(initialCreditNotes);
  const router = useRouter();

  const handleCancel = async (creditNote: CreditNote) => {
    const confirmed = await confirm({
      title: 'Cancelar Nota de Crédito',
      description: '¿Está seguro de cancelar esta nota de crédito? Se revertirá el stock, el efectivo y el saldo del cliente.',
    });
    if (!confirmed) {
      return;
    }
    try {
      const res = await fetch(`/api/credit-notes/${creditNote.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al cancelar');
      }
      const updated = await res.json();
      setCreditNotes(prev => prev.map(cn => cn.id === updated.id ? { ...cn, status: updated.status } : cn));
    } catch (e) {
      console.error(e);
      await alert({ title: 'Error', description: e instanceof Error ? e.message : 'Error al cancelar' });
    }
  };

  const columns = useMemo<ColumnDef<CreditNote>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
              <Receipt className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <span className="font-semibold tracking-tight font-mono text-xs text-muted-foreground uppercase">
              #{(row.getValue('id') as string).slice(0, 8)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'originalSaleType',
        header: 'Origen',
        cell: ({ row }) => {
          const type = row.getValue('originalSaleType') as string;
          const isDirect = type === 'direct_sale';
          return (
            <Badge
              variant="outline"
              className={`text-xs font-medium gap-1.5 px-2 ${
                isDirect
                  ? 'text-blue-700 border-blue-200 bg-blue-50'
                  : 'text-orange-700 border-orange-200 bg-orange-50'
              }`}
            >
              {isDirect ? (
                <ShoppingCart
                  className="h-3 w-3 text-blue-600 pointer-events-none"
                  aria-hidden="true"
                />
              ) : (
                <ClipboardList
                  className="h-3 w-3 text-orange-600 pointer-events-none"
                  aria-hidden="true"
                />
              )}
              {isDirect ? 'Venta Directa' : 'Orden de Trabajo'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'customer',
        header: 'Cliente',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User
              className="h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none"
              aria-hidden="true"
            />
            <span className="font-semibold tracking-tight">
              {row.original.customer?.name || (
                <span className="text-muted-foreground font-normal">—</span>
              )}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'total',
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => (
          <div className="text-right font-bold text-red-600 font-mono">
            {formatARS(row.getValue('total') as number)}
          </div>
        ),
      },
      {
        accessorKey: 'refundMethod',
        header: 'Método',
        cell: ({ row }) => {
          const method = row.getValue('refundMethod') as string;
          return (
            <Badge variant="secondary" className="text-xs">
              {method === 'CASH' ? 'Efectivo' : 'Crédito'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          return status === 'ISSUED' ? (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
            >
              <FileText
                className="h-3 w-3 mr-1 pointer-events-none"
                aria-hidden="true"
              />
              Emitida
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200 text-xs"
            >
              <Ban
                className="h-3 w-3 mr-1 pointer-events-none"
                aria-hidden="true"
              />
              Cancelada
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {new Date(row.getValue('createdAt') as string).toLocaleDateString('es-AR')}
          </span>
        ),
      },
    ],
    []
  );

  const issuedCount = creditNotes.filter(c => c.status === 'ISSUED').length;
  const cancelledCount = creditNotes.filter(c => c.status === 'CANCELLED').length;
  const totalAmountFormatted = formatARS(
    creditNotes
      .filter(c => c.status === 'ISSUED')
      .reduce((acc, c) => acc + c.total, 0)
  );

  const stats: StatItem[] = [
    {
      label: 'Emitidas',
      value: issuedCount,
      icon: FileText,
      iconColor: '#10b981', // emerald-500
    },
    {
      label: 'Canceladas',
      value: cancelledCount,
      icon: Ban,
      iconColor: '#ef4444', // red-500
    },
    {
      label: 'Total Emitido',
      value: totalAmountFormatted,
      icon: Receipt,
      iconColor: '#3b82f6', // blue-500
    },
  ];

  const rowActions = (creditNote: CreditNote) => (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => router.push(`/adm/credit-notes/${creditNote.id}`)}
            aria-label="Ver detalle de nota de crédito"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Ver detalle</TooltipContent>
      </Tooltip>
      {creditNote.status === 'ISSUED' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleCancel(creditNote)}
              aria-label="Cancelar nota de crédito"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Cancelar</TooltipContent>
        </Tooltip>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Header
        title="Notas de Crédito"
        description="Historial de devoluciones y reembolsos"
      />

      <CrudStats stats={stats} />

      <CrudAdmin
        items={creditNotes}
        loading={false}
        columns={columns}
        tableTitle="Listado de Notas de Crédito"
        emptyIcon={<Receipt className="h-12 w-12 mx-auto text-muted-foreground/20" />}
        emptyMessage="No hay notas de crédito registradas. Para crear una, selecciona una venta y haz clic en Devolver."
        createButtonText=""
        hideCreateAction
        searchPlaceholder="Buscar por cliente o tipo..."
        rowActions={rowActions}
      />
    </div>
  );
}
