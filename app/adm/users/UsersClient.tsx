'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserDialog } from '@/components/users/UserDialog';
import { UserFormData } from '@/components/users/UserForm';
import { useUI } from '@/components/ui/UIProvider';
import { Header, CrudAdmin, CrudStats, type StatItem } from '@/components/adm';
import { Users, Pencil, UserCog, Shield, Plus, CheckCircle2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

interface UsersClientProps {
  initialUsers: User[];
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const { alert } = useUI();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'USER',
    notes: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users?includeInactive=true');
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'USER',
      notes: '',
    });
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      notes: user.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.role) {
      await alert({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos obligatorios.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            role: formData.role,
            notes: formData.notes,
          }),
        });

        if (response.ok) {
          setIsDialogOpen(false);
          resetForm();
          fetchUsers();
        } else {
          const error = await response.json();
          await alert({
            title: 'Error',
            description: error.error || 'Error al actualizar usuario',
            variant: 'error',
          });
        }
      } else {
        // Create new user
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          setIsDialogOpen(false);
          resetForm();
          fetchUsers();
        } else {
          const error = await response.json();
          await alert({
            title: 'Error',
            description: error.error || 'Error al crear usuario',
            variant: 'error',
          });
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      await alert({
        title: 'Error',
        description: 'Error al guardar usuario',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingUser, alert]);

  const isFormValid = !!(formData.name.trim() && formData.email.trim() && formData.role);

  const stats: StatItem[] = [
    {
      label: 'Total',
      value: users.length,
      icon: Users,
    },
    {
      label: 'Activos',
      value: users.filter((u) => u.isActive).length,
      icon: CheckCircle2,
      iconColor: '#047857', // emerald-700
    },
    {
      label: 'Admins',
      value: users.filter((u) => u.role === 'ADMIN').length,
      icon: Shield,
      iconColor: '#3b82f6', // blue-500
    },
  ];

  const getRoleBadge = (role: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }
    > = {
      ADMIN: {
        variant: 'outline',
        label: 'Admin',
        className: 'text-red-700 border-red-200 bg-red-50',
      },
      MANAGER: { variant: 'default', label: 'Manager' },
      USER: { variant: 'secondary', label: 'Usuario' },
    };
    const config = variants[role] || variants.USER;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0">
              <UserCog className="h-4 w-4 text-primary pointer-events-none" aria-hidden="true" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">
                {row.original.name}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {row.original.email}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) => getRoleBadge(row.original.role),
      },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'outline' : 'secondary'}
            className={row.original.isActive ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : ''}
          >
            {row.original.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      },
      {
        accessorKey: 'notes',
        header: 'Notas',
        cell: ({ row }) => {
          const notes = row.original.notes;
          if (!notes) return <span className="text-muted-foreground">-</span>;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="max-w-[150px] truncate cursor-help text-sm text-muted-foreground">
                  {notes}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {notes}
              </TooltipContent>
            </Tooltip>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <Header
        title="Usuarios"
        description="Gestiona los usuarios del sistema y sus roles"
        primaryAction={{
          label: 'Nuevo Usuario',
          onClick: openCreateDialog,
          icon: Plus,
          ariaLabel: 'Crear nuevo usuario',
        }}
      />

      <div className="mt-4">
        <CrudStats stats={stats} />
      </div>

      <CrudAdmin
        items={users}
        loading={loading}
        onCreate={openCreateDialog}
        hideCreateAction
        columns={columns}
        emptyIcon={<Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
        emptyMessage="No hay usuarios creados. Haz clic en 'Nuevo Usuario' para crear el primero."
        createButtonText="Usuario"
        tableTitle="Listado de Usuarios"
        searchPlaceholder="Buscar por nombre o email..."
        rowActions={(user) => (
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(user)}
                  aria-label="Editar usuario"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar usuario</TooltipContent>
            </Tooltip>
          </div>
        )}
      />

      {/* User Dialog */}
      <UserDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          resetForm();
        }}
        editingUser={editingUser}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isValid={isFormValid}
        isLoading={isSubmitting}
      />
    </div>
  );
}
