'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ModalBase } from '@/components/ui/ModalBase';
import { useUI } from '@/components/ui/UIProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Plus, Trash2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface Payment {
  id: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  createdBy: string;
  paymentMethod: PaymentMethod;
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: string;
  workOrderTotal: number;
  onPaymentRegistered?: () => void;
}

export function PaymentDialog({
  isOpen,
  onClose,
  workOrderId,
  workOrderTotal,
  onPaymentRegistered,
}: PaymentDialogProps) {
  const { alert, confirm } = useUI();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalPaid, setTotalPaid] = useState(0);

  // Fetch payment methods and existing payments
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      // Fetch active payment methods
      const methodsRes = await fetch('/api/payment-methods');
      if (methodsRes.ok) {
        const data = await methodsRes.json();
        setPaymentMethods(data.paymentMethods?.filter((m: PaymentMethod) => m.isActive) || []);
      }

      // Fetch existing payments
      const paymentsRes = await fetch(`/api/work-orders/${workOrderId}/payments`);
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data.payments || []);
        setTotalPaid(data.totalPaid || 0);
      }
    };

    fetchData();
  }, [isOpen, workOrderId]);

  // Set default amount to remaining amount
  useEffect(() => {
    const remaining = Math.max(0, workOrderTotal - totalPaid);
    if (remaining > 0 && isOpen) {
      setAmount(remaining.toString());
    }
  }, [totalPaid, workOrderTotal, isOpen]);

  const remainingAmount = Math.max(0, workOrderTotal - totalPaid);
  const isFullyPaid = totalPaid >= workOrderTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethodId || !amount || parseFloat(amount) <= 0) {
      await alert({
        title: 'Error',
        description: 'Seleccione un método de pago e ingrese un monto válido',
        variant: 'error',
      });
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount > remainingAmount) {
      const confirmed = await confirm({
        title: 'Monto excede el pendiente',
        description: `El monto ingresado ($${paymentAmount.toFixed(2)}) excede el saldo pendiente ($${remainingAmount.toFixed(2)}). ¿Desea continuar?`,
        confirmText: 'Continuar',
        cancelText: 'Cancelar',
        variant: 'destructive',
      });
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId,
          amount: paymentAmount,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setTotalPaid(data.totalPaid || 0);
        
        // Reset form
        setPaymentMethodId('');
        setAmount('');
        setNotes('');
        
        await alert({
          title: 'Pago registrado',
          description: `Se registró el pago de $${paymentAmount.toFixed(2)}`,
          variant: 'success',
        });

        if (data.isFullyPaid) {
          await alert({
            title: 'Orden pagada completamente',
            description: 'El total de la orden ha sido pagado',
            variant: 'success',
          });
        }

        onPaymentRegistered?.();
      } else {
        const error = await res.json();
        await alert({
          title: 'Error',
          description: error.error || 'No se pudo registrar el pago',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error registering payment:', error);
      await alert({
        title: 'Error',
        description: 'Error al registrar el pago',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (payment: Payment) => {
    const confirmed = await confirm({
      title: 'Eliminar pago',
      description: `¿Eliminar el pago de $${Number(payment.amount).toFixed(2)}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/payments/${payment.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Refresh payments
        const paymentsRes = await fetch(`/api/work-orders/${workOrderId}/payments`);
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data.payments || []);
          setTotalPaid(data.totalPaid || 0);
        }
        
        await alert({
          title: 'Eliminado',
          description: 'Pago eliminado correctamente',
          variant: 'success',
        });
        onPaymentRegistered?.();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      await alert({
        title: 'Error',
        description: 'No se pudo eliminar el pago',
        variant: 'error',
      });
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Pago"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Total OT:</span>
            <span className="font-medium">${Number(workOrderTotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Pagado:</span>
            <span className="font-medium text-green-600">${totalPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm font-medium">
              {isFullyPaid ? 'Pagado completamente' : 'Pendiente:'}
            </span>
            <span className={`font-bold ${isFullyPaid ? 'text-green-600' : 'text-orange-600'}`}>
              ${remainingAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Form */}
        {!isFullyPaid && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de Pago *</Label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Máx: $${remainingAmount.toFixed(2)}`}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Pendiente: ${remainingAmount.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas / Referencia</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Número de transferencia, últimos dígitos tarjeta, etc."
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !paymentMethodId || !amount}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading ? 'Registrando...' : 'Registrar Pago'}
            </Button>
          </form>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Historial de Pagos</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${Number(payment.amount).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">
                        {payment.paymentMethod.name}
                      </span>
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground">{payment.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePayment(payment)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </ModalBase>
  );
}
