'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

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
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(initialCreditNotes);
  const router = useRouter();

  const handleCancel = async (creditNote: CreditNote) => {
    if (!confirm('Esta seguro de cancelar esta nota de credito? Se revertira el stock, el efectivo y el saldo del cliente.')) {
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
      alert(e instanceof Error ? e.message : 'Error al cancelar');
    }
  };

  const columns: ColumnDef<CreditNote>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="text-xs font-mono">{(row.getValue('id') as string).slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'originalSaleId',
      header: 'Venta Original',
      cell: ({ row }) => <span className="text-xs font-mono">{(row.getValue('originalSaleId') as string).slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'originalSaleType',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.getValue('originalSaleType') as string;
        return type === 'direct_sale' ? 'Venta Directa' : 'Orden de Trabajo';
      },
    },
    {
      accessorKey: 'customer',
      header: 'Cliente',
      cell: ({ row }) => row.original.customer?.name || '-',
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => `$${(row.getValue('total') as number).toFixed(2)}`,
    },
    {
      accessorKey: 'refundMethod',
      header: 'Metodo',
      cell: ({ row }) => {
        const method = row.getValue('refundMethod') as string;
        return method === 'CASH' ? 'Efectivo' : 'Credito';
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const map: Record<string, { label: string; color: string }> = {
          ISSUED: { label: 'Emitida', color: 'bg-green-100 text-green-800' },
          CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
        };
        const s = map[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.getValue('createdAt') as string).toLocaleDateString('es-AR'),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/adm/credit-notes/${row.original.id}`)}>
            Ver
          </Button>
          {row.original.status === 'ISSUED' && (
            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleCancel(row.original)}>
              Cancelar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notas de Credito</h1>
        <p className="text-muted-foreground">Historial de devoluciones</p>
      </div>

      {creditNotes.length > 0 ? (
        <DataTable
          data={creditNotes}
          columns={columns}
          title="Notas de Credito"
          enableGlobalFilter
          globalFilterPlaceholder="Buscar notas de credito..."
          emptyMessage="No hay notas de credito"
        />
      ) : (
        <div className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No hay notas de credito registradas</p>
          <p className="text-sm text-muted-foreground">
            Para crear una nota de credito, seleccione una venta u orden de trabajo y haga clic en Devolver.
          </p>
        </div>
      )}
    </div>
  );
}
