'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/users/UserTable';
import { UserDialog } from '@/components/users/UserDialog';
import { UserFormData } from '@/components/users/UserForm';
import { useUI } from '@/components/ui/UIProvider';
import { Plus, Users } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

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
  const { data: session } = authClient.useSession();
  const { alert, confirm } = useUI();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const filteredUsers = users.filter((u) => {
    const searchLower = search.toLowerCase();
    return (
      !search ||
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema y sus roles
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          variant="default"
          className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role === 'ADMIN').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role !== 'USER').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <UserTable
            users={filteredUsers}
            search={search}
            onSearchChange={setSearch}
            onEdit={openEditDialog}
            onToggleActive={handleToggleActive}
            currentUserEmail={session?.user?.email || ''}
          />
        </CardContent>
      </Card>

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
