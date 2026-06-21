'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tag, TrendingUp, ListOrdered, Eye, CheckCircle } from 'lucide-react';

export interface PriceListFormData {
  name: string;
  baseMarginPercentage: number;
  roundingRule: 'EXACT' | 'NEAREST_INTEGER' | 'PSYCHOLOGICAL' | 'SMART_HUNDREDS';
  isPublic: boolean;
  isActive: boolean;
}

interface PriceListFormProps {
  formData: PriceListFormData;
  setFormData: (data: PriceListFormData) => void;
  onSubmit: (e?: React.FormEvent) => void;
}

export function PriceListForm({
  formData,
  setFormData,
  onSubmit,
}: PriceListFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="name" required>Nombre</Label>
        <div className="relative">
          <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Lista Mayorista"
            required
            aria-required="true"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseMarginPercentage" required>Margen Base (%)</Label>
        <div className="relative">
          <TrendingUp className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            id="baseMarginPercentage"
            type="number"
            min={0}
            step={0.1}
            value={formData.baseMarginPercentage}
            onChange={(e) =>
              setFormData({
                ...formData,
                baseMarginPercentage: parseFloat(e.target.value) || 0,
              })
            }
            required
            aria-required="true"
            className="pl-9 font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="roundingRule">Regla de Redondeo</Label>
        <div className="relative">
          <ListOrdered className="absolute left-3 top-2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" aria-hidden="true" />
          <Select
            value={formData.roundingRule}
            onValueChange={(value: PriceListFormData['roundingRule']) =>
              setFormData({ ...formData, roundingRule: value })
            }
          >
            <SelectTrigger id="roundingRule" className="pl-9">
              <SelectValue placeholder="Selecciona regla de redondeo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXACT">Exacto (2 decimales)</SelectItem>
              <SelectItem value="NEAREST_INTEGER">Entero más cercano</SelectItem>
              <SelectItem value="PSYCHOLOGICAL">Psicológico (.90/.99)</SelectItem>
              <SelectItem value="SMART_HUNDREDS">Inteligente (decenas)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="isPublic">Visibilidad</Label>
          <div className="relative">
            <Eye className="absolute left-3 top-2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" aria-hidden="true" />
            <Select
              value={formData.isPublic ? 'public' : 'private'}
              onValueChange={(value) =>
                setFormData({ ...formData, isPublic: value === 'public' })
              }
            >
              <SelectTrigger id="isPublic" className="pl-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Privada</SelectItem>
                <SelectItem value="public">Pública</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="isActive">Estado</Label>
          <div className="relative">
            <CheckCircle className="absolute left-3 top-2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" aria-hidden="true" />
            <Select
              value={formData.isActive ? 'active' : 'inactive'}
              onValueChange={(value) =>
                setFormData({ ...formData, isActive: value === 'active' })
              }
            >
              <SelectTrigger id="isActive" className="pl-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="inactive">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </form>
  );
}
