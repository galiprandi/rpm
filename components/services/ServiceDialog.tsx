'use client';

import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';
import { ServiceForm, type ServiceFormData } from './ServiceForm';

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
      <ServiceForm
        formData={formData}
        onChange={setFormData}
        disabled={isLoading}
      />
    </ModalBase>
  );
}
