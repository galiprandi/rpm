'use client';

import Image from 'next/image';
import { Pencil, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface UserCardProps {
  user: User;
  onEdit: () => void;
  onToggleActive: () => void;
  canToggle: boolean;
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

export function UserCard({ user, onEdit, onToggleActive, canToggle }: UserCardProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className={!user.isActive ? 'opacity-60' : undefined}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-slate-600">{initials}</span>
              )}
            </div>
            <div>
              <h3 className="font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Editar usuario">
              <Pencil className="h-4 w-4" />
            </Button>
            {canToggle && (
              <Button
                variant="ghost"
                size="sm"
                className={user.isActive ? 'text-red-700' : 'text-emerald-700'}
                onClick={onToggleActive}
                aria-label={user.isActive ? "Desactivar usuario" : "Activar usuario"}
              >
                {user.isActive ? (
                  <UserX className="h-4 w-4" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>
            {!user.isActive && <Badge variant="destructive">Inactivo</Badge>}
          </div>
          {user.notes && (
            <p className="text-sm text-muted-foreground pt-2">{user.notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
