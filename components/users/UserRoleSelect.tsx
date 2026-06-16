'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield } from 'lucide-react';

export interface RoleOption {
  value: string;
  label: string;
  description: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
}

interface UserRoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function UserRoleSelect({ value, onChange, disabled }: UserRoleSelectProps) {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/roles')
      .then((res) => res.json())
      .then((data) => {
        if (data.roles) {
          setRoles(data.roles);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="relative">
        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50 z-10" aria-hidden="true" />
        <Select disabled>
          <SelectTrigger className="w-full pl-9">
            <SelectValue placeholder="Cargando roles..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10 pointer-events-none" aria-hidden="true" />
        <Select
          value={value}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id="role" className="w-full pl-9">
            <SelectValue placeholder="Selecciona un rol" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {value && (
        <p className="text-[11px] text-muted-foreground ml-1">
          {roles.find((r) => r.value === value)?.description}
        </p>
      )}
    </div>
  );
}
