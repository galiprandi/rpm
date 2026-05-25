'use client';

import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';
import { CategoryForm, type CategoryFormData } from './CategoryForm';

interface Category {
  id: string;
  name: string;
  description: string | null;
  defaultMarginPercent: number;
  color: string | null;
  isActive: boolean;
}

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: Category | null;
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading?: boolean;
}

export function CategoryDialog({
  isOpen,
  onClose,
  editingCategory,
  formData,
  setFormData,
  onSubmit,
  isLoading = false,
}: CategoryDialogProps) {
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSubmit(e);
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      description={
        editingCategory
          ? 'Modifica los detalles de la categoría seleccionada.'
          : 'Completa la información para categorizar tus productos y servicios.'
      }
      maxWidth="md"
      footer={
        <ModalBaseFooter
          onCancel={onClose}
          onSave={handleSubmit}
          saveText={editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
          isLoading={isLoading}
        />
      }
    >
      <CategoryForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
      />
    </ModalBase>
  );
}
