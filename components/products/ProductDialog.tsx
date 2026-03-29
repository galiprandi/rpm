'use client';

import { Modal, ModalFooter } from '@/components/ui/modal';
import { ProductForm } from './ProductForm';

import { type Product, type Category, type Supplier, type ProductFormData } from './types';

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
  onSubmit: (e?: React.FormEvent) => void;
  categories: Category[];
  suppliers: Supplier[];
  isValid: boolean;
}

export function ProductDialog({
  isOpen,
  onClose,
  editingProduct,
  formData,
  setFormData,
  onSubmit,
  categories,
  suppliers,
  isValid,
}: ProductDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      description={editingProduct 
        ? 'Modifica los datos del producto existente.' 
        : 'Completa los datos para crear un nuevo producto.'}
      size="lg"
      footer={
        <ModalFooter
          onCancel={onClose}
          onSave={onSubmit}
          saveText={editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
          disabled={!isValid}
        />
      }
    >
      <ProductForm 
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        suppliers={suppliers}
        isValid={isValid}
      />
    </Modal>
  );
}
