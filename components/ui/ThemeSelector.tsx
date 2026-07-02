'use client';

import { useTheme } from '@/components/ui/ThemeProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

const themes: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export function ThemeSelector({ id }: { id?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative">
      <Palette
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none"
        aria-hidden="true"
      />
      <Select
        value={theme}
        onValueChange={(value) => setTheme(value as Theme)}
      >
        <SelectTrigger
          id={id}
          className="w-40 pl-9"
          aria-label="Seleccionar tema"
        >
          <SelectValue placeholder="Seleccionar tema" />
        </SelectTrigger>
        <SelectContent>
          {themes.map(({ value, label, icon: Icon }) => (
            <SelectItem key={value} value={value}>
              <span className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
