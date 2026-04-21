'use client';

import * as React from 'react';
import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';
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
  isUploadingImage?: boolean;
  onDeleteImage?: (productId: string) => void;
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
  isUploadingImage = false,
  onDeleteImage,
}: ProductDialogProps) {
  const [isDeletingImage, setIsDeletingImage] = React.useState(false);

  const handleImageDeleteStart = React.useCallback(() => {
    setIsDeletingImage(true);
  }, []);

  const handleImageDeleteEnd = React.useCallback(() => {
    setIsDeletingImage(false);
  }, []);

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      description={editingProduct 
        ? 'Modifica los datos del producto existente.' 
        : 'Completa los datos para crear un nuevo producto.'}
      maxWidth="lg"
      footer={
        <ModalBaseFooter
          onCancel={onClose}
          onSave={onSubmit}
          saveText={isUploadingImage ? 'Subiendo imagen...' : (editingProduct ? 'Guardar Cambios' : 'Crear Producto')}
          disabled={!isValid || isUploadingImage || isDeletingImage}
        />
      }
    >
      <ProductForm
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        suppliers={suppliers}
        isValid={isValid}
        currentImageUrl={editingProduct?.imageUrl || null}
        productId={editingProduct?.id || null}
        onDeleteImage={onDeleteImage}
        isDeletingImage={isDeletingImage}
        onImageDeleteStart={handleImageDeleteStart}
        onImageDeleteEnd={handleImageDeleteEnd}
      />
    </ModalBase>
  );
}
