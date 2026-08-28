'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUI } from '@/components/ui/UIProvider';
import { Undo2, DollarSign, FileText } from 'lucide-react';

interface SaleItem {
  id: string;
  productId?: string | null;
  serviceId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface DirectSaleCreditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string;
  saleType: 'direct_sale' | 'work_order';
  customerName: string;
  hasCustomer: boolean;
  items: SaleItem[];
  payments?: Array<{ paymentMethodId?: string | null; amount: number }>;
  onSuccess: () => void;
}

export function DirectSaleCreditNoteDialog({
  open,
  onOpenChange,
  saleId,
  saleType,
  customerName,
  hasCustomer,
  items,
  payments,
  onSuccess,
}: DirectSaleCreditNoteDialogProps) {
  const { alert } = useUI();
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [returnedQty, setReturnedQty] = useState<Record<string, number>>({});
  const [paymentMethods, setPaymentMethods] = useState<{ id: string; name: string }[]>([]);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'ACCOUNT_CREDIT'>(
    hasCustomer ? 'ACCOUNT_CREDIT' : 'CASH',
  );
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPaymentMethods();
      fetchReturned();
      const initial: Record<number, number> = {};
      items.forEach((_, index) => {
        initial[index] = 0;
      });
      setSelectedItems(initial);
      setRefundMethod(hasCustomer ? 'ACCOUNT_CREDIT' : 'CASH');
      setNotes('');
      const firstPm = payments?.[0]?.paymentMethodId;
      if (firstPm) setSelectedPaymentMethodId(firstPm);
      else setSelectedPaymentMethodId('');
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

  const fetchReturned = async () => {
    const endpoint = saleType === 'direct_sale'
      ? `/api/direct-sales/${saleId}/credit-notes`
      : `/api/work-orders/${saleId}/credit-notes`;
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

  const calculateRefundTotal = () => {
    let total = 0;
    items.forEach((item, index) => {
      const qty = selectedItems[index] || 0;
      total += qty * Number(item.unitPrice);
    });
    return total;
  };

  const handleCreateCreditNote = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const selectedItemsList = items
      .map((item, index) => {
        const qty = selectedItems[index] || 0;
        if (qty <= 0) return null;
        return {
          productId: item.productId || undefined,
          serviceId: item.serviceId || undefined,
          quantity: qty,
        };
      })
      .filter(Boolean) as Array<{ productId?: string; serviceId?: string; quantity: number }>;

    if (selectedItemsList.length === 0) {
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
          originalSaleId: saleId,
          originalSaleType: saleType,
          items: selectedItemsList,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nota de Credito</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-muted rounded space-y-1">
            <p className="text-sm"><strong>Cliente:</strong> {customerName}</p>
            <p className="text-sm"><strong>Total a devolver:</strong> <span className="font-mono">${calculateRefundTotal().toFixed(2)}</span></p>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Productos a devolver</Label>
            <div className="border rounded-lg divide-y">
              {items.map((item, index) => {
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
                        aria-label={`Devolver ${item.name}`}
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
                        <Label htmlFor={`qty-${index}`} className="text-sm">Cantidad:</Label>
                        <Input
                          id={`qty-${index}`}
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
                    {hasCustomer && (
                      <SelectItem value="ACCOUNT_CREDIT">Crédito a cuenta del cliente</SelectItem>
                    )}
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
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" aria-hidden="true" />
              <Input id="notes" className="pl-9" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} aria-label="Cancelar">Cancelar</Button>
            <Button onClick={handleCreateCreditNote} disabled={isSubmitting || calculateRefundTotal() <= 0}>
              {isSubmitting ? 'Creando...' : 'Crear Nota de Credito'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
