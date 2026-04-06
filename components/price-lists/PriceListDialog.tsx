'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PriceListForm, type PriceListFormData } from './PriceListForm';

interface PriceList {
  id: string;
  name: string;
  isPublic: boolean;
  isActive: boolean;
  baseMarginPercentage: number;
  roundingRule: string;
  itemCount: number;
}

interface PriceListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingPriceList: PriceList | null;
  formData: PriceListFormData;
  setFormData: (data: PriceListFormData) => void;
  onSubmit: (e?: React.FormEvent) => void;
}

export function PriceListDialog({
  isOpen,
  onClose,
  editingPriceList,
  formData,
  setFormData,
  onSubmit,
}: PriceListDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingPriceList ? 'Editar Lista de Precios' : 'Crear Lista de Precios'}
          </DialogTitle>
          <DialogDescription>
            {editingPriceList 
              ? 'Modifica los datos de la lista de precios existente.' 
              : 'Crea una nueva lista de precios para aplicar a los productos.'
            }
          </DialogDescription>
        </DialogHeader>
        <PriceListForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSubmit()}>
            {editingPriceList ? 'Guardar Cambios' : 'Crear Lista'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
