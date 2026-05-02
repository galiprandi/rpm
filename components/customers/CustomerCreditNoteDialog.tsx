'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';

interface Sale {
  id: string;
  type: 'direct_sale' | 'work_order';
  total: number;
  createdAt: string;
  status: string;
  vehicle?: { identifier: string };
  itemsCount: number;
}

interface CustomerCreditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  onSuccess: () => void;
}

export function CustomerCreditNoteDialog({ open, onOpenChange, customerId, customerName, onSuccess }: CustomerCreditNoteDialogProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'ACCOUNT_CREDIT' | 'MIXED'>('ACCOUNT_CREDIT');
  const [cashAmount, setCashAmount] = useState('');
  const [accountCreditAmount, setAccountCreditAmount] = useState('');
  const [refundMethodCode, setRefundMethodCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      // Fetch direct sales
      const directSalesRes = await fetch(`/api/direct-sales?customerId=${customerId}`);
      const directSales = directSalesRes.ok ? await directSalesRes.json() : [];

      // Fetch work orders
      const workOrdersRes = await fetch(`/api/work-orders?customerId=${customerId}`);
      const workOrders = workOrdersRes.ok ? await workOrdersRes.json() : [];

      const allSales: Sale[] = [
        ...directSales.map((ds: any) => ({
          id: ds.id,
          type: 'direct_sale' as const,
          total: ds.total,
          createdAt: ds.createdAt,
          status: ds.status,
          itemsCount: ds.items?.length || 0,
        })),
        ...workOrders.map((wo: any) => ({
          id: wo.id,
          type: 'work_order' as const,
          total: wo.total,
          createdAt: wo.createdAt,
          status: wo.status,
          vehicle: wo.vehicle,
          itemsCount: wo.items?.length || 0,
        })),
      ];

      setSales(allSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCreditNote = async () => {
    if (!selectedSale) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSaleId: selectedSale.id,
          originalSaleType: selectedSale.type,
          customerId,
          items: [], // TODO: Fetch items from selected sale
          refundMethod,
          cashAmount: refundMethod === 'CASH' || refundMethod === 'MIXED' ? parseFloat(cashAmount) : null,
          accountCreditAmount: refundMethod === 'ACCOUNT_CREDIT' || refundMethod === 'MIXED' ? parseFloat(accountCreditAmount) : null,
          refundMethodCode: refundMethod === 'CASH' || refundMethod === 'MIXED' ? refundMethodCode : null,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear nota de crédito');
      }

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating credit note:', error);
      alert(error instanceof Error ? error.message : 'Error al crear nota de crédito');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="text-xs font-mono">{row.getValue('id').slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return type === 'direct_sale' ? 'Venta Directa' : 'Orden de Trabajo';
      },
    },
    {
      accessorKey: 'vehicle.identifier',
      header: 'Vehículo',
      cell: ({ row }) => row.original.vehicle?.identifier || '-',
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => `$${(row.getValue('total') as number).toFixed(2)}`,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return <span className="text-sm">{status}</span>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.getValue('createdAt') as string).toLocaleDateString('es-AR'),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nota de Crédito</DialogTitle>
        </DialogHeader>

        {!selectedSale ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded">
              <p className="text-sm">
                <strong>Cliente:</strong> {customerName}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">Cargando ventas...</div>
            ) : sales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay ventas registradas para este cliente
              </div>
            ) : (
              <DataTable
                data={sales}
                columns={columns}
                title="Ventas del Cliente"
                enableGlobalFilter
                globalFilterPlaceholder="Buscar venta..."
                rowActions={(sale) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSale(sale)}
                  >
                    Seleccionar
                  </Button>
                )}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded">
              <p className="text-sm">
                <strong>Venta seleccionada:</strong> {selectedSale.type === 'direct_sale' ? 'Venta Directa' : 'Orden de Trabajo'} #{selectedSale.id.slice(0, 8)}
              </p>
              <p className="text-sm">
                <strong>Total:</strong> ${selectedSale.total.toFixed(2)}
              </p>
            </div>

            <div>
              <Label>Método de reembolso</Label>
              <Select value={refundMethod} onValueChange={(v: 'CASH' | 'ACCOUNT_CREDIT' | 'MIXED') => setRefundMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACCOUNT_CREDIT">Crédito a cuenta</SelectItem>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="MIXED">Mixto (efectivo + crédito)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(refundMethod === 'CASH' || refundMethod === 'MIXED') && (
              <>
                <div>
                  <Label>Monto en efectivo</Label>
                  <Input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Método de pago</Label>
                  <Select value={refundMethodCode} onValueChange={setRefundMethodCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                      <SelectItem value="TRANSFER">Transferencia</SelectItem>
                      <SelectItem value="CARD">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(refundMethod === 'ACCOUNT_CREDIT' || refundMethod === 'MIXED') && (
              <div>
                <Label>Monto a crédito</Label>
                <Input
                  type="number"
                  value={accountCreditAmount}
                  onChange={(e) => setAccountCreditAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}

            <div>
              <Label>Notas (opcional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedSale(null)}
                disabled={isSubmitting}
              >
                Atrás
              </Button>
              <Button
                onClick={handleCreateCreditNote}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creando...' : 'Crear Nota de Crédito'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
