'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserDialog } from '@/components/users/UserDialog';
import { UserFormData } from '@/components/users/UserForm';
import { useUI } from '@/components/ui/UIProvider';
import { CrudAdmin, StatItem } from '@/components/adm';
import { Users, Edit2, UserCheck, UserCog, Shield } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

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

export default function UsersPage() {
  const { alert, confirm } = useUI();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'USER',
    notes: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
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

  const handleToggleActive = useCallback(async (user: User) => {
    const action = user.isActive ? 'desactivar' : 'activar';
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Usuario`,
      description: `¿Estás seguro de ${action} a "${user.name}"?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancelar',
      variant: user.isActive ? 'destructive' : 'default',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        await alert({
          title: 'Error',
          description: error.error || `Error al ${action} usuario`,
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      await alert({
        title: 'Error',
        description: `Error al ${action} usuario`,
        variant: 'error',
      });
    }
  }, [confirm, alert]);

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
      icon: UserCheck,
      iconColor: '#22c55e',
    },
    {
      label: 'Admins',
      value: users.filter((u) => u.role === 'ADMIN').length,
      icon: Shield,
      iconColor: '#3b82f6',
    },
  ];

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      ADMIN: { variant: 'destructive', label: 'Admin' },
      MANAGER: { variant: 'default', label: 'Manager' },
      USER: { variant: 'secondary', label: 'Usuario' },
    };
    const config = variants[role] || variants.USER;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
              <UserCog className="h-3 w-3 text-slate-600" />
            </div>
            <div>
              <div className="font-medium">{row.original.name}</div>
              <div className="text-xs text-muted-foreground">{row.original.email}</div>
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
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="default">Activo</Badge>
          ) : (
            <Badge variant="secondary">Inactivo</Badge>
          ),
      },
      {
        accessorKey: 'notes',
        header: 'Notas',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate max-w-[150px]">
            {row.original.notes || '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEditDialog(row.original)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <>
      <CrudAdmin
        title="Usuarios"
        description="Gestiona los usuarios del sistema y sus roles"
        items={users}
        loading={loading}
        onCreate={openCreateDialog}
        columns={columns}
        stats={stats}
        emptyIcon={<Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
        emptyMessage="No hay usuarios creados. Haz clic en 'Nuevo Usuario' para crear el primero."
        createButtonText="Nuevo Usuario"
        tableTitle="Listado de Usuarios"
        searchPlaceholder="Buscar por nombre o email..."
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
    </>
  );
}
