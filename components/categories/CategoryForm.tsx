'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Folder, FileText, TrendingUp, Palette } from 'lucide-react';

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
        <Label htmlFor="name" required>
          Nombre
        </Label>
        <div className="relative">
          <Folder
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Repuestos, Lubricantes..."
            required
            aria-required="true"
            className="pl-9"
          />
        </div>
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
            placeholder="Descripción opcional de la categoría..."
            rows={3}
            className="resize-none pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="defaultMarginPercent">Margen Sugerido (%)</Label>
          <div className="relative">
            <TrendingUp
              className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id="defaultMarginPercent"
              type="number"
              min="0"
              max="500"
              step="0.1"
              value={formData.defaultMarginPercent}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultMarginPercent: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="40"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Color Visual</Label>
          <div className="relative">
            <Palette
              className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <div className="flex gap-2 items-center pl-9">
              <Input
                id="color"
                type="color"
                value={formData.color || '#3b82f6'}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <span className="text-xs text-muted-foreground font-mono">
                {formData.color || '#3b82f6'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
