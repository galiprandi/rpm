'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useUI } from '@/components/ui/UIProvider';
import { Header, CrudStats } from '@/components/adm';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Receipt, Ban, XCircle, Eye, FileText } from 'lucide-react';

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

  const columns: ColumnDef<CreditNote>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="text-xs font-mono text-muted-foreground">{(row.getValue('id') as string).slice(0, 8)}…</span>,
    },
    {
      accessorKey: 'originalSaleType',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.getValue('originalSaleType') as string;
        return (
          <Badge variant="outline" className="text-xs font-medium">
            {type === 'direct_sale' ? 'Venta Directa' : 'Orden de Trabajo'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'customer',
      header: 'Cliente',
      cell: ({ row }) => row.original.customer?.name || <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'total',
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => (
        <div className="text-right font-semibold text-red-600">
          {(row.getValue('total') as number).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
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
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Emitida
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
            <Ban className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => <span className="text-muted-foreground">{new Date(row.getValue('createdAt') as string).toLocaleDateString('es-AR')}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/adm/credit-notes/${row.original.id}`)} aria-label="Ver detalle de nota de crédito">
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver detalle</TooltipContent>
          </Tooltip>
          {row.original.status === 'ISSUED' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleCancel(row.original)} aria-label="Cancelar nota de crédito">
                  <XCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cancelar</TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const issuedCount = creditNotes.filter(c => c.status === 'ISSUED').length;
  const cancelledCount = creditNotes.filter(c => c.status === 'CANCELLED').length;
  const totalAmount = creditNotes
    .filter(c => c.status === 'ISSUED')
    .reduce((acc, c) => acc + c.total, 0)
    .toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const stats = [
    {
      label: 'Emitidas',
      value: issuedCount,
      icon: FileText,
      iconColor: 'rgb(16 185 129)', // emerald-500
    },
    {
      label: 'Canceladas',
      value: cancelledCount,
      icon: Ban,
      iconColor: 'rgb(239 68 68)', // red-500
    },
    {
      label: 'Total Emitido',
      value: totalAmount,
      icon: Receipt,
      iconColor: 'rgb(59 130 246)', // blue-500
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Notas de Crédito"
        description="Historial de devoluciones y reembolsos"
      />

      <CrudStats stats={stats} />

      {creditNotes.length > 0 ? (
        <div className="bg-card rounded-lg border shadow-xs p-6">
          <DataTable
            data={creditNotes}
            columns={columns}
            title="Listado de Notas de Crédito"
            enableGlobalFilter
            globalFilterPlaceholder="Buscar por cliente o tipo..."
            emptyMessage="No hay notas de crédito"
          />
        </div>
      ) : (
        <div className="p-12 text-center bg-card border rounded-lg shadow-xs">
          <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground mb-2 font-medium">No hay notas de crédito registradas</p>
          <p className="text-sm text-muted-foreground">
            Para crear una nota de crédito, seleccione una venta u orden de trabajo y haga clic en Devolver.
          </p>
        </div>
      )}
    </div>
  );
}
