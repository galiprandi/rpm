'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wrench, FileText, DollarSign, Clock, Truck } from 'lucide-react';

export interface ServiceFormData {
  name: string;
  description: string;
  baseCost: string;
  timeMinutes: string;
  vehicleFactor: string;
}

interface ServiceFormProps {
  formData: ServiceFormData;
  onChange: (data: ServiceFormData) => void;
  disabled?: boolean;
}

export function ServiceForm({ formData, onChange, disabled }: ServiceFormProps) {
  const handleChange = (field: keyof ServiceFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="grid gap-6 py-4">
      {/* Service Name */}
      <div className="space-y-2">
        <Label htmlFor="name" required>
          Nombre del Servicio
        </Label>
        <div className="relative">
          <Wrench className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ej: Instalación barras LED"
            className="pl-9"
            required
            aria-required="true"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descripción detallada del servicio..."
            className="pl-9 min-h-[100px]"
            rows={3}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Numerical Fields Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Base Cost */}
        <div className="space-y-2">
          <Label htmlFor="baseCost" required>
            Costo Base ($)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id="baseCost"
              type="number"
              min="0"
              step="0.01"
              value={formData.baseCost}
              onChange={(e) => handleChange('baseCost', e.target.value)}
              placeholder="15000"
              className="pl-9 font-mono"
              required
              aria-required="true"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Time Estimated */}
        <div className="space-y-2">
          <Label htmlFor="timeMinutes" required>
            Tiempo (min)
          </Label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id="timeMinutes"
              type="number"
              min="1"
              value={formData.timeMinutes}
              onChange={(e) => handleChange('timeMinutes', e.target.value)}
              placeholder="60"
              className="pl-9 font-mono"
              required
              aria-required="true"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Vehicle Factor */}
        <div className="space-y-2">
          <Label htmlFor="vehicleFactor">
            Factor Vehículo
          </Label>
          <div className="relative">
            <Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id="vehicleFactor"
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={formData.vehicleFactor}
              onChange={(e) => handleChange('vehicleFactor', e.target.value)}
              placeholder="1.0"
              className="pl-9 font-mono"
              disabled={disabled}
            />
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Multiplicador por tipo de vehículo
          </p>
        </div>
      </div>
    </div>
  );
}
