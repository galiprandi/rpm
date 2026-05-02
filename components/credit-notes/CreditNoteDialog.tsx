'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface CreditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreditNoteData) => void;
}

interface CreditNoteData {
  originalSaleId: string;
  originalSaleType: 'direct_sale' | 'work_order';
  customerId: string | null;
  items: any[];
  refundMethod: 'CASH' | 'ACCOUNT_CREDIT' | 'MIXED';
  cashAmount: number | null;
  accountCreditAmount: number | null;
  refundMethodCode: string | null;
  notes: string;
}

export function CreditNoteDialog({ open, onOpenChange, onCreate }: CreditNoteDialogProps) {
  const [step, setStep] = useState<'search' | 'items' | 'refund'>('search');
  const [originalSaleId, setOriginalSaleId] = useState('');
  const [originalSaleType, setOriginalSaleType] = useState<'direct_sale' | 'work_order'>('direct_sale');
  const [customerId, setCustomerId] = useState('');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'ACCOUNT_CREDIT' | 'MIXED'>('ACCOUNT_CREDIT');
  const [cashAmount, setCashAmount] = useState('');
  const [accountCreditAmount, setAccountCreditAmount] = useState('');
  const [refundMethodCode, setRefundMethodCode] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const handleCreate = () => {
    const data: CreditNoteData = {
      originalSaleId,
      originalSaleType,
      customerId: customerId || null,
      items,
      refundMethod,
      cashAmount: refundMethod === 'CASH' || refundMethod === 'MIXED' ? parseFloat(cashAmount) : null,
      accountCreditAmount: refundMethod === 'ACCOUNT_CREDIT' || refundMethod === 'MIXED' ? parseFloat(accountCreditAmount) : null,
      refundMethodCode: refundMethod === 'CASH' || refundMethod === 'MIXED' ? refundMethodCode : null,
      notes,
    };
    onCreate(data);
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setStep('search');
    setOriginalSaleId('');
    setOriginalSaleType('direct_sale');
    setCustomerId('');
    setRefundMethod('ACCOUNT_CREDIT');
    setCashAmount('');
    setAccountCreditAmount('');
    setRefundMethodCode('');
    setNotes('');
    setItems([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nota de Crédito</DialogTitle>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-4">
            <div>
              <Label>Tipo de venta original</Label>
              <Select value={originalSaleType} onValueChange={(v: 'direct_sale' | 'work_order') => setOriginalSaleType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct_sale">Venta Directa</SelectItem>
                  <SelectItem value="work_order">Orden de Trabajo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>ID de venta original</Label>
              <div className="flex gap-2">
                <Input
                  value={originalSaleId}
                  onChange={(e) => setOriginalSaleId(e.target.value)}
                  placeholder="Buscar venta por ID..."
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>ID de cliente (opcional)</Label>
              <Input
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="ID del cliente..."
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={() => setStep('items')}>Continuar</Button>
            </DialogFooter>
          </div>
        )}

        {step === 'items' && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground mb-2">
                Selecciona los items a devolver de la venta seleccionada
              </p>
              <p className="text-xs text-muted-foreground">
                (La UI de selección de items se implementará en una siguiente fase)
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('search')}>Atrás</Button>
              <Button onClick={() => setStep('refund')}>Continuar</Button>
            </DialogFooter>
          </div>
        )}

        {step === 'refund' && (
          <div className="space-y-4">
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
              <Button variant="outline" onClick={() => setStep('items')}>Atrás</Button>
              <Button onClick={handleCreate}>Crear Nota de Crédito</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
