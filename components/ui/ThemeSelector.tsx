'use client';

import { useTheme } from '@/components/ui/ThemeProvider';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Claro', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Oscuro', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'Sistema', icon: <Monitor className="h-4 w-4" /> },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {themes.find((t) => t.value === theme)?.icon}
        <span className="text-sm">Apariencia</span>
      </div>
      <NativeSelect
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        className="w-40"
      >
        {themes.map((t) => (
          <NativeSelectOption key={t.value} value={t.value}>
            {t.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
