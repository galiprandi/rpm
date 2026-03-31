"use client";

import { ModalBase } from "@/components/ui/ModalBase";
import { CustomerForm, type CustomerFormData } from "./CustomerForm";

interface CustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function CustomerDialog({
  isOpen,
  onClose,
  onSubmit,
  onCancel,
  submitLabel = "Crear Cliente",
  isSubmitting = false,
}: CustomerDialogProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Cliente"
      description="Completa los datos para crear un nuevo cliente."
      maxWidth="lg"
    >
      <CustomerForm
        onSubmit={onSubmit}
        onCancel={onCancel || onClose}
        submitLabel={submitLabel}
        isSubmitting={isSubmitting}
      />
    </ModalBase>
  );
}
