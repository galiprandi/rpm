'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { CreditNoteDialog } from '@/components/credit-notes/CreditNoteDialog';
import { useRouter } from 'next/navigation';

interface CreditNote {
  id: string;
  originalSaleId: string;
  originalSaleType: string;
  customerId: string | null;
  customer: { id: string; name: string; phone: string | null } | null;
  total: number;
  refundMethod: string;
  cashAmount: number | null;
  accountCreditAmount: number | null;
  status: string;
  createdAt: string;
  itemCount: number;
  invoice: { id: string; number: string; status: string } | null;
}

interface CreditNotesClientProps {
  initialCreditNotes: CreditNote[];
}

export default function CreditNotesClient({ initialCreditNotes }: CreditNotesClientProps) {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(initialCreditNotes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const handleCreate = async (data: unknown) => {
    try {
      const response = await fetch('/api/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear nota de crédito');
      }

      const newCreditNote = await response.json();
      setCreditNotes([newCreditNote.creditNote, ...creditNotes]);
      setDialogOpen(false);
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error creating credit note:', error);
      alert(error instanceof Error ? error.message : 'Error al crear nota de crédito');
    }
  };

  const handleView = (creditNote: CreditNote) => {
    router.push(`/adm/credit-notes/${creditNote.id}`);
  };

  const columns: ColumnDef<CreditNote>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="text-xs font-mono">{row.getValue('id').slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'originalSaleId',
      header: 'Venta Original',
      cell: ({ row }) => <span className="text-xs font-mono">{row.getValue('originalSaleId').slice(0, 8)}...</span>,
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
      header: 'Método',
      cell: ({ row }) => {
        const method = row.getValue('refundMethod') as string;
        const methodMap: Record<string, string> = {
          CASH: 'Efectivo',
          ACCOUNT_CREDIT: 'Crédito',
          MIXED: 'Mixto',
        };
        return methodMap[method] || method;
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusMap: Record<string, { label: string; color: string }> = {
          DRAFT: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-800' },
          ISSUED: { label: 'Emitida', color: 'bg-green-100 text-green-800' },
          CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
        };
        const s = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleView(row.original)}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notas de Crédito</h1>
          <p className="text-muted-foreground">Gestiona las notas de crédito y devoluciones</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Nota de Crédito
        </Button>
      </div>

      {creditNotes.length > 0 ? (
        <DataTable
          data={creditNotes}
          columns={columns}
          title="Notas de Crédito"
          enableGlobalFilter
          globalFilterPlaceholder="Buscar notas de crédito..."
          emptyMessage="No hay notas de crédito"
        />
      ) : (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">No hay notas de crédito creadas</p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Primera Nota de Crédito
          </Button>
        </div>
      )}

      <CreditNoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}
