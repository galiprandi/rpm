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
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nombre de la categoría"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción de la categoría..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="defaultMarginPercent">Margen Sugerido (%)</Label>
          <Input
            id="defaultMarginPercent"
            type="number"
            min="0"
            max="100"
            value={formData.defaultMarginPercent}
            onChange={(e) =>
              setFormData({ ...formData, defaultMarginPercent: parseInt(e.target.value) || 0 })
            }
            placeholder="40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            type="color"
            value={formData.color || '#e5e7eb'}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
        </div>
      </div>
    </form>
  );
}
