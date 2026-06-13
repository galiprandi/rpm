'use client';

import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ServiceFormData {
  name: string;
  description: string;
  baseCost: string;
  timeMinutes: string;
  vehicleFactor: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  baseCost: number;
  timeMinutes: number;
  vehicleFactor: number;
  isActive: boolean;
}

interface ServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingService: Service | null;
  formData: ServiceFormData;
  setFormData: (data: ServiceFormData) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isValid: boolean;
  isLoading?: boolean;
}

export function ServiceDialog({
  isOpen,
  onClose,
  editingService,
  formData,
  setFormData,
  onSubmit,
  isValid,
  isLoading = false,
}: ServiceDialogProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
      description={editingService
        ? 'Modifica los datos del servicio existente.'
        : 'Completa los datos para crear un nuevo servicio.'}
      maxWidth="lg"
      footer={
        <ModalBaseFooter
          onCancel={onClose}
          onSave={onSubmit}
          saveText={editingService ? 'Guardar Cambios' : 'Crear Servicio'}
          disabled={!isValid}
          isLoading={isLoading}
        />
      }
    >
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name" required>
            Nombre del Servicio
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Instalación barras LED"
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
            placeholder="Descripción detallada del servicio..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="baseCost" required>
              Costo Base ($)
            </Label>
            <Input
              id="baseCost"
              type="number"
              min="0"
              step="0.01"
              value={formData.baseCost}
              onChange={(e) => setFormData({ ...formData, baseCost: e.target.value })}
              placeholder="15000"
              required
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeMinutes" required>
              Tiempo (min)
            </Label>
            <Input
              id="timeMinutes"
              type="number"
              min="1"
              value={formData.timeMinutes}
              onChange={(e) => setFormData({ ...formData, timeMinutes: e.target.value })}
              placeholder="60"
              required
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleFactor">
              Factor Vehículo
            </Label>
            <Input
              id="vehicleFactor"
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={formData.vehicleFactor}
              onChange={(e) => setFormData({ ...formData, vehicleFactor: e.target.value })}
              placeholder="1.0"
            />
            <p className="text-xs text-muted-foreground">
              Multiplicador por tipo de vehículo
            </p>
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
