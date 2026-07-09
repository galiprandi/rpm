'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { useUI } from '@/components/ui/UIProvider';
import { Undo2, DollarSign, FileText } from 'lucide-react';

interface Sale {
  id: string;
  type: 'direct_sale' | 'work_order';
  total: number;
  createdAt: string;
  status: string;
  vehicle?: { identifier: string };
  itemsCount: number;
  items?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productId?: string | null;
    serviceId?: string | null;
  }>;
  payments?: Array<{ paymentMethodId?: string | null; amount: number }>;
}

interface CustomerCreditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  onSuccess: () => void;
  preselectedSaleId?: string;
}

export function CustomerCreditNoteDialog({ open, onOpenChange, customerId, customerName, onSuccess, preselectedSaleId }: CustomerCreditNoteDialogProps) {
  const { alert } = useUI();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [returnedQty, setReturnedQty] = useState<Record<string, number>>({});
  const [paymentMethods, setPaymentMethods] = useState<{ id: string; name: string }[]>([]);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'ACCOUNT_CREDIT'>('ACCOUNT_CREDIT');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSales();
      fetchPaymentMethods();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods');
      const data = res.ok ? await res.json() : { paymentMethods: [] };
      setPaymentMethods(data.paymentMethods || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReturned = async (sale: Sale) => {
    const endpoint = sale.type === 'direct_sale'
      ? `/api/direct-sales/${sale.id}/credit-notes`
      : `/api/work-orders/${sale.id}/credit-notes`;
    try {
      const res = await fetch(endpoint);
      if (!res.ok) return;
      const data = await res.json();
      setReturnedQty(data.returned || {});
    } catch (e) {
      console.error(e);
      setReturnedQty({});
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const [dsRes, woRes] = await Promise.all([
        fetch(`/api/direct-sales?customerId=${customerId}`),
        fetch(`/api/work-orders?customerId=${customerId}`),
      ]);
      const dsData = dsRes.ok ? await dsRes.json() : { directSales: [] };
      const woData = woRes.ok ? await woRes.json() : { workOrders: [] };

      const allSales: Sale[] = [
        ...(dsData.directSales || []).map((ds: Record<string, unknown>) => ({
          id: String(ds.id),
          type: 'direct_sale' as const,
          total: Number(ds.total),
          createdAt: String(ds.createdAt),
          status: 'COMPLETED',
          itemsCount: (ds.items as unknown[])?.length || 0,
          items: (ds.items as Sale['items']) || [],
          payments: (ds.payments as Sale['payments']) || [],
        })),
        ...(woData.workOrders || []).map((wo: Record<string, unknown>) => ({
          id: String(wo.id),
          type: 'work_order' as const,
          total: Number(wo.total),
          createdAt: String(wo.createdAt),
          status: String(wo.status),
          vehicle: wo.vehicle as Sale['vehicle'],
          itemsCount: (wo.work_order_item as unknown[])?.length || 0,
          items: (wo.work_order_item as Sale['items']) || [],
          payments: (wo.payments as Sale['payments']) || [],
        })),
      ];

      // Ordenar ventas de actuales a viejas (descendente por fecha)
      allSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setSales(allSales);
      if (preselectedSaleId) {
        const match = allSales.find((s) => s.id === preselectedSaleId);
        if (match) setSelectedSale(match);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSale) {
      const initial: Record<string, number> = {};
      selectedSale.items?.forEach((_, index) => {
        initial[index] = 0;
      });
      setSelectedItems(initial);
      setRefundMethod('ACCOUNT_CREDIT');
      setNotes('');

      const firstPm = selectedSale.payments?.[0]?.paymentMethodId;
      if (firstPm) setSelectedPaymentMethodId(firstPm);
      else setSelectedPaymentMethodId('');

      fetchReturned(selectedSale);
    }
     
  }, [selectedSale]);

  const calculateRefundTotal = () => {
    if (!selectedSale) return 0;
    let total = 0;
    selectedSale.items?.forEach((item, index) => {
      const qty = selectedItems[index] || 0;
      total += qty * Number(item.unitPrice);
    });
    return total;
  };

  const handleCreateCreditNote = async () => {
    if (!selectedSale) return;

    // Prevent double-click
    if (isSubmitting) return;
    setIsSubmitting(true);

    const items = selectedSale.items
      ?.map((item, index) => {
        const qty = selectedItems[index] || 0;
        if (qty <= 0) return null;
        return {
          productId: item.productId || undefined,
          serviceId: item.serviceId || undefined,
          quantity: qty,
        };
      })
      .filter(Boolean) as Array<{ productId?: string; serviceId?: string; quantity: number }>;

    if (!items || items.length === 0) {
      await alert({ title: 'Error', description: 'Seleccione al menos un item para devolver' });
      setIsSubmitting(false);
      return;
    }

    if (refundMethod === 'CASH' && !selectedPaymentMethodId) {
      await alert({ title: 'Error', description: 'Debe seleccionar un metodo de pago' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSaleId: selectedSale.id,
          originalSaleType: selectedSale.type,
          items,
          refundMethod,
          paymentMethodId: refundMethod === 'CASH' ? selectedPaymentMethodId : undefined,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear nota de credito');
      }

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      await alert({ title: 'Error', description: error instanceof Error ? error.message : 'Error al crear nota de credito' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => (row.getValue('type') === 'direct_sale' ? 'Venta Directa' : 'Orden de Trabajo'),
    },
    {
      accessorKey: 'vehicle.identifier',
      header: 'Vehiculo',
      cell: ({ row }) => row.original.vehicle?.identifier || '-',
    },
    {
      accessorKey: 'items',
      header: 'Productos',
      cell: ({ row }) => {
        const items = row.original.items || [];
        return items.length === 0 ? '-' : (
          <div className="text-xs max-w-xs truncate" title={items.map(i => i.name).join(', ')}>
            {items.map(i => i.name).join(', ')}
          </div>
        );
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => `$${Number(row.getValue('total')).toFixed(2)}`,
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.getValue('createdAt') as string).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nota de Credito</DialogTitle>
        </DialogHeader>

        {!selectedSale ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded">
              <p className="text-sm"><strong>Cliente:</strong> {customerName}</p>
            </div>
            {loading ? (
              <div className="text-center py-8">Cargando ventas...</div>
            ) : sales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No hay ventas registradas para este cliente</div>
            ) : (
              <DataTable
                data={sales}
                columns={columns}
                title="Ventas del Cliente"
                enableGlobalFilter
                globalFilterPlaceholder="Buscar venta..."
                rowActions={(sale) => (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setSelectedSale(sale)}
                    aria-label={`Seleccionar venta #${sale.id.slice(0, 8)}`}
                  >
                    Seleccionar
                  </Button>
                )}
              />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded space-y-1">
              <p className="text-sm"><strong>Venta:</strong> {selectedSale.type === 'direct_sale' ? 'Venta Directa' : 'Orden de Trabajo'} #{selectedSale.id.slice(0, 8)}</p>
              <p className="text-sm"><strong>Total original:</strong> ${Number(selectedSale.total).toFixed(2)}</p>
              <p className="text-sm"><strong>Total a devolver:</strong> <span className="font-mono">${calculateRefundTotal().toFixed(2)}</span></p>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">Productos a devolver</Label>
              <div className="border rounded-lg divide-y">
                {selectedSale.items?.map((item, index) => {
                  const key = item.productId || item.serviceId || String(index);
                  const already = returnedQty[key] || 0;
                  const remaining = item.quantity - already;
                  const selected = selectedItems[index] || 0;
                  return (
                    <div key={index} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selected > 0}
                          disabled={remaining <= 0}
                          onChange={(e) => {
                            setSelectedItems(prev => ({
                              ...prev,
                              [index]: e.target.checked ? Math.min(1, remaining) : 0,
                            }));
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Vendido: {item.quantity} x ${Number(item.unitPrice).toFixed(2)}
                            {already > 0 && <span className="text-orange-600 ml-2">Ya devuelto: {already}</span>}
                            {remaining <= 0 && <span className="text-red-600 ml-2">Sin stock para devolver</span>}
                          </p>
                        </div>
                      </div>
                      {selected > 0 && remaining > 0 && (
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Cantidad:</Label>
                          <Input
                            type="number"
                            min={1}
                            max={remaining}
                            value={selected}
                            onChange={(e) => {
                              const val = Math.min(remaining, Math.max(1, parseInt(e.target.value) || 1));
                              setSelectedItems(prev => ({ ...prev, [index]: val }));
                            }}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">/ {remaining} disp.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="refund-method">Forma de devolución</Label>
                <div className="relative">
                  <Undo2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
                  <Select value={refundMethod} onValueChange={(v: 'CASH' | 'ACCOUNT_CREDIT') => setRefundMethod(v)}>
                    <SelectTrigger id="refund-method" className="pl-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCOUNT_CREDIT">Crédito a cuenta del cliente</SelectItem>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {refundMethod === 'CASH' && (
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Método de pago</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
                    <Select value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId}>
                      <SelectTrigger id="payment-method" className="pl-9"><SelectValue placeholder="Seleccionar método" /></SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((pm) => (
                          <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input id="notes" className="pl-9" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedSale(null)} disabled={isSubmitting} aria-label="Volver a la selección de venta">Atrás</Button>
              <Button onClick={handleCreateCreditNote} disabled={isSubmitting || calculateRefundTotal() <= 0}>
                {isSubmitting ? 'Creando...' : 'Crear Nota de Credito'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
