'use client';

import { useState } from 'react';
import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUI } from '@/components/ui/UIProvider';
import { Wrench, FileText, DollarSign, Clock, Truck } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  baseCost: number;
  timeMinutes: number;
  vehicleFactor: number;
  isActive: boolean;
}

interface QuickServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceCreated: (service: Service) => void;
}

export function QuickServiceDialog({
  isOpen,
  onClose,
  onServiceCreated,
}: QuickServiceDialogProps) {
  const { alert } = useUI();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseCost: '',
    timeMinutes: '60',
    vehicleFactor: '1.0',
  });

  const isFormValid =
    formData.name.trim() !== '' &&
    formData.baseCost.trim() !== '' &&
    formData.timeMinutes.trim() !== '';

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!isFormValid) return;

    setLoading(true);
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          baseCost: parseFloat(formData.baseCost),
          timeMinutes: parseInt(formData.timeMinutes),
          vehicleFactor: parseFloat(formData.vehicleFactor),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onServiceCreated(data.service);
        // Reset form
        setFormData({
          name: '',
          description: '',
          baseCost: '',
          timeMinutes: '60',
          vehicleFactor: '1.0',
        });
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al crear servicio',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error creating service:', error);
      await alert({
        title: 'Error',
        description: 'Error al crear servicio',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Servicio Rápido"
      description="Crea un nuevo servicio y agrégalo a la orden de trabajo."
      maxWidth="lg"
      footer={
        <ModalBaseFooter
          onCancel={onClose}
          onSave={handleSubmit}
          saveText={loading ? 'Creando...' : 'Crear Servicio'}
          disabled={!isFormValid || loading}
        />
      }
    >
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="quick-name" required>
            Nombre del Servicio
          </Label>
          <div className="relative">
            <Wrench
              className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id="quick-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ej: Instalación barras LED"
              className="pl-9"
              required
              aria-required="true"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quick-description">Descripción</Label>
          <div className="relative">
            <FileText
              className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Textarea
              id="quick-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descripción detallada del servicio..."
              rows={2}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quick-baseCost" required>
              Costo Base ($)
            </Label>
            <div className="relative">
              <DollarSign
                className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="quick-baseCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.baseCost}
                onChange={(e) =>
                  setFormData({ ...formData, baseCost: e.target.value })
                }
                placeholder="15000"
                className="pl-9 font-mono"
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-timeMinutes" required>
              Tiempo (min)
            </Label>
            <div className="relative">
              <Clock
                className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="quick-timeMinutes"
                type="number"
                min="1"
                value={formData.timeMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, timeMinutes: e.target.value })
                }
                placeholder="60"
                className="pl-9 font-mono"
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-vehicleFactor">Factor Vehículo</Label>
            <div className="relative">
              <Truck
                className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="quick-vehicleFactor"
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={formData.vehicleFactor}
                onChange={(e) =>
                  setFormData({ ...formData, vehicleFactor: e.target.value })
                }
                placeholder="1.0"
                className="pl-9 font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
