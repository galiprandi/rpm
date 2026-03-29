'use client';

import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';
import { UserForm, UserFormData } from './UserForm';

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: User | null;
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  onSubmit: () => void;
  isValid: boolean;
  isLoading: boolean;
}

export function UserDialog({
  isOpen,
  onClose,
  editingUser,
  formData,
  setFormData,
  onSubmit,
  isValid,
  isLoading,
}: UserDialogProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      description={editingUser
        ? 'Modifica el rol y datos del usuario.'
        : 'Crea un usuario manualmente para asignarle acceso al sistema.'}
      maxWidth="md"
      footer={
        <ModalBaseFooter
          onCancel={onClose}
          onSave={onSubmit}
          saveText={editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
          isLoading={isLoading}
          disabled={!isValid}
        />
      }
    >
      <UserForm
        formData={formData}
        setFormData={setFormData}
        isEditing={!!editingUser}
      />
    </ModalBase>
  );
}
