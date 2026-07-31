'use client';

import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';
import { PriceListForm, type PriceListFormData, type PriceListOption } from './PriceListForm';

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
  /** Other price lists available to use as a calculation base. */
  availableBaseLists?: PriceListOption[];
}

export function PriceListDialog({
  isOpen,
  onClose,
  editingPriceList,
  formData,
  setFormData,
  onSubmit,
  availableBaseLists = [],
}: PriceListDialogProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={editingPriceList ? 'Editar Lista de Precios' : 'Crear Lista de Precios'}
      description={
        editingPriceList
          ? 'Modifica los datos de la lista de precios existente.'
          : 'Crea una nueva lista de precios para aplicar a los productos.'
      }
      footer={
        <ModalBaseFooter
          onCancel={onClose}
          onSave={() => onSubmit()}
          saveText={editingPriceList ? 'Guardar Cambios' : 'Crear Lista'}
        />
      }
    >
      <PriceListForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        availableBaseLists={availableBaseLists}
        currentListId={editingPriceList?.id}
      />
    </ModalBase>
  );
}
