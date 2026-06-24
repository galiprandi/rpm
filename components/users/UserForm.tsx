'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserRoleSelect } from './UserRoleSelect';
import { Mail, User, FileText } from 'lucide-react';

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
        <Label htmlFor="email" required>
          Email
        </Label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="usuario@empresa.com"
            required
            aria-required="true"
            disabled={isEditing}
            className="pl-9 font-mono"
          />
        </div>
        {isEditing && (
          <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" required>
          Nombre
        </Label>
        <div className="relative">
          <User
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre completo del usuario"
            required
            aria-required="true"
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" required>
          Rol
        </Label>
        <UserRoleSelect
          id="role"
          value={formData.role}
          onChange={(value) => setFormData({ ...formData, role: value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <div className="relative">
          <FileText
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Observaciones sobre el usuario (opcional)..."
            rows={2}
            className="pl-9"
          />
        </div>
      </div>
    </form>
  );
}
