'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface PaymentMethodFormData {
  name: string;
  code: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

interface PaymentMethodFormProps {
  formData: PaymentMethodFormData;
  setFormData: (data: PaymentMethodFormData) => void;
  onSubmit?: (e: React.FormEvent) => void;
  isEdit?: boolean;
}

export function PaymentMethodForm({
  formData,
  setFormData,
  onSubmit,
  isEdit = false,
}: PaymentMethodFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form id="payment-method-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" required>Nombre</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Efectivo, Transferencia"
          required
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code" required>Código</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="Ej: CASH, TRANSFER"
          required
          aria-required="true"
          disabled={isEdit}
          className={isEdit ? 'bg-muted' : ''}
        />
        <p className="text-xs text-muted-foreground">
          Código único en mayúsculas (ej: CASH, CREDIT_CARD)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción del método de pago..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Orden</Label>
          <Input
            id="sortOrder"
            type="number"
            min="0"
            value={formData.sortOrder}
            onChange={(e) =>
              setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
            }
            placeholder="0"
          />
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 accent-primary"
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Activo
          </Label>
        </div>
      </div>
    </form>
  );
}
