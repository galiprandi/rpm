'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface CategoryFormData {
  name: string;
  description: string;
  defaultMarginPercent: number;
  color: string;
}

interface CategoryFormProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  onSubmit?: (e: React.FormEvent) => void;
}

export function CategoryForm({
  formData,
  setFormData,
  onSubmit,
}: CategoryFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" required>Nombre</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Repuestos, Lubricantes..."
          required
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción opcional de la categoría..."
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="defaultMarginPercent">Margen Sugerido (%)</Label>
          <Input
            id="defaultMarginPercent"
            type="number"
            min="0"
            max="500"
            value={formData.defaultMarginPercent}
            onChange={(e) =>
              setFormData({ ...formData, defaultMarginPercent: parseInt(e.target.value) || 0 })
            }
            placeholder="40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Color Visual</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="color"
              type="color"
              value={formData.color || '#3b82f6'}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <span className="text-xs text-muted-foreground font-mono">
              {formData.color || '#3b82f6'}
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
