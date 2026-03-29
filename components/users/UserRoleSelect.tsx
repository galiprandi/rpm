'use client';

import { useEffect, useState } from 'react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

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
      <NativeSelect disabled value="">
        <NativeSelectOption value="">Cargando roles...</NativeSelectOption>
      </NativeSelect>
    );
  }

  return (
    <div className="space-y-2">
      <NativeSelect
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full"
      >
        <NativeSelectOption value="">Selecciona un rol</NativeSelectOption>
        {roles.map((role) => (
          <NativeSelectOption key={role.value} value={role.value}>
            {role.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {value && (
        <p className="text-xs text-muted-foreground">
          {roles.find((r) => r.value === value)?.description}
        </p>
      )}
    </div>
  );
}
