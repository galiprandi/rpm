'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserRoleSelect } from './UserRoleSelect';

export interface UserFormData {
  email: string;
  name: string;
  role: string;
  notes: string;
}

interface UserFormProps {
  formData: UserFormData;
  setFormData: (data: UserFormData) => void;
  isEditing?: boolean;
}

export function UserForm({ formData, setFormData, isEditing = false }: UserFormProps) {
  return (
    <form id="user-form" className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" required>Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="usuario@empresa.com"
          required
          aria-required="true"
          disabled={isEditing}
        />
        {isEditing && (
          <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" required>Nombre</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nombre completo del usuario"
          required
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" required>Rol</Label>
        <UserRoleSelect
          value={formData.role}
          onChange={(value) => setFormData({ ...formData, role: value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observaciones sobre el usuario (opcional)..."
          rows={2}
        />
      </div>
    </form>
  );
}
