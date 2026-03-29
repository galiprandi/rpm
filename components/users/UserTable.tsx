'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  Search,
  Edit2,
  UserX,
  UserCheck,
} from 'lucide-react';

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

interface UserTableProps {
  users: User[];
  search: string;
  onSearchChange: (search: string) => void;
  onEdit: (user: User) => void;
  onToggleActive: (user: User) => void;
  currentUserEmail: string;
}

const getRoleBadgeVariant = (
  role: string
): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (role) {
    case 'ADMIN':
      return 'default';
    case 'SELLER':
      return 'secondary';
    case 'TECHNICIAN':
    case 'CASHIER':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    SELLER: 'Vendedor',
    TECHNICIAN: 'Técnico',
    CASHIER: 'Cajero',
    USER: 'Usuario',
  };
  return labels[role] || role;
};

export function UserTable({
  users,
  search,
  onSearchChange,
  onEdit,
  onToggleActive,
  currentUserEmail,
}: UserTableProps) {
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Usuario',
        cell: ({ row }) => {
          const user = row.original;
          const initials = user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-slate-600">{initials}</span>
                )}
              </div>
              <div className="font-medium">{user.name}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
          return (
            <span className="text-sm text-muted-foreground">
              {row.original.email}
            </span>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) => {
          const role = row.original.role;
          return (
            <Badge variant={getRoleBadgeVariant(role)}>
              {getRoleLabel(role)}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Estado',
        cell: ({ row }) => {
          const isActive = row.original.isActive;
          return isActive ? (
            <Badge variant="secondary">Activo</Badge>
          ) : (
            <Badge variant="destructive">Inactivo</Badge>
          );
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.email === currentUserEmail;
          const canToggle = !isSelf;

          return (
            <div className="flex justify-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              {canToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={user.isActive ? 'text-red-600' : 'text-green-600'}
                  onClick={() => onToggleActive(user)}
                >
                  {user.isActive ? (
                    <UserX className="h-4 w-4" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onEdit, onToggleActive, currentUserEmail]
  );

  return (
    <div>
      <div className="relative w-[300px] mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <DataTable
        data={users}
        columns={columns}
        enableGlobalFilter
        globalFilterPlaceholder="Buscar por nombre o email..."
        emptyMessage="No se encontraron usuarios"
        externalGlobalFilter={search}
        onExternalGlobalFilterChange={onSearchChange}
      />
    </div>
  );
}
