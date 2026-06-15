'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  Search,
  Pencil,
  UserX,
  UserCheck,
  User,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

const getRoleBadgeClasses = (role: string): string => {
  switch (role) {
    case 'ADMIN':
      return 'text-red-600 border-red-200 bg-red-50';
    case 'SELLER':
    case 'TECHNICIAN':
    case 'CASHIER':
      return 'text-blue-600 border-blue-200 bg-blue-50';
    default:
      return '';
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

          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-primary" aria-hidden="true" />
                )}
              </div>
              <div className="font-semibold tracking-tight leading-none">{user.name}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
          return (
            <span className="text-sm text-muted-foreground font-mono">
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
            <Badge
              variant="outline"
              className={cn("font-medium", getRoleBadgeClasses(role))}
            >
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
          return (
            <Badge
              variant={isActive ? 'outline' : 'secondary'}
              className={cn(isActive && 'text-emerald-600 border-emerald-200 bg-emerald-50')}
            >
              {isActive ? 'Activo' : 'Inactivo'}
            </Badge>
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(user)} aria-label="Editar usuario">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar usuario</TooltipContent>
              </Tooltip>
              {canToggle && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={user.isActive ? 'text-red-600' : 'text-emerald-600'}
                      onClick={() => onToggleActive(user)}
                      aria-label={user.isActive ? "Desactivar usuario" : "Activar usuario"}
                    >
                      {user.isActive ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {user.isActive ? "Desactivar usuario" : "Activar usuario"}
                  </TooltipContent>
                </Tooltip>
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
