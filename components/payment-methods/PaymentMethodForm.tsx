'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Hash, FileText, ListOrdered } from 'lucide-react';

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
        <Label htmlFor="name" required>
          Nombre
        </Label>
        <div className="relative">
          <CreditCard
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Efectivo, Transferencia"
            required
            aria-required="true"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code" required>
          Código
        </Label>
        <div className="relative">
          <Hash
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="code"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            placeholder="Ej: CASH, TRANSFER"
            required
            aria-required="true"
            disabled={isEdit}
            className={`pl-9 font-mono ${isEdit ? 'bg-muted' : ''}`}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Código único en mayúsculas (ej: CASH, CREDIT_CARD)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <div className="relative">
          <FileText
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Descripción del método de pago..."
            rows={2}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Orden</Label>
          <div className="relative">
            <ListOrdered
              className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id="sortOrder"
              type="number"
              min="0"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sortOrder: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center pt-6">
          <Checkbox
            id="isActive"
            label="Activo"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isActive: !!checked })
            }
          />
        </div>
      </div>
    </form>
  );
}
