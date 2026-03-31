"use client";

import { ModalBase, ModalBaseFooter } from "@/components/ui/ModalBase";
import { SupplierForm, type SupplierFormData } from "./SupplierForm";

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
}

interface SupplierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingSupplier: Supplier | null;
  formData: SupplierFormData;
  setFormData: (data: SupplierFormData) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading?: boolean;
}

export function SupplierDialog({
  isOpen,
  onClose,
  editingSupplier,
  formData,
  setFormData,
  onSubmit,
  isLoading = false,
}: SupplierDialogProps) {
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSubmit(e);
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
      description={
        editingSupplier
          ? "Modifica los datos del proveedor existente."
          : "Completa los datos para crear un nuevo proveedor."
      }
      maxWidth="md"
      footer={
        <ModalBaseFooter
          onCancel={onClose}
          onSave={handleSubmit}
          saveText={editingSupplier ? "Guardar Cambios" : "Crear Proveedor"}
          isLoading={isLoading}
        />
      }
    >
      <SupplierForm formData={formData} setFormData={setFormData} onSubmit={handleSubmit} />
    </ModalBase>
  );
}
