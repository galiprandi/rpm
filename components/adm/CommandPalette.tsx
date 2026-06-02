'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { flatNavItems } from '@/lib/nav/navConfig';
import { Search, ArrowRight, X } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    if (!query.trim()) return flatNavItems;
    const q = query.toLowerCase();
    return flatNavItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery('');
      setSelectedIndex(0);
      router.push(href);
    },
    [onOpenChange, router]
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = results[selectedIndex];
        if (item) handleSelect(item.href);
      } else if (e.key === 'Escape') {
        onOpenChange(false);
        setQuery('');
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex, handleSelect, onOpenChange]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Buscar</DialogTitle>
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <div className="relative flex-1 flex items-center">
            <Input
              placeholder="Buscar vista..."
              className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-auto px-0 text-base w-full pr-8"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange('')}
                className="absolute right-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {!query && (
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ESC
            </kbd>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No se encontraron resultados
            </p>
          ) : (
            results.map((item, index) => (
              <button
                key={item.href}
                type="button"
                onClick={() => handleSelect(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                <span className="text-muted-foreground text-xs font-medium uppercase w-16 shrink-0">
                  {item.group}
                </span>
                <span className="flex-1">{item.label}</span>
                {index === selectedIndex && (
                  <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t flex items-center gap-3 text-xs text-muted-foreground bg-muted/30">
          <span>
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-[10px] font-medium">
              ↑↓
            </kbd>{' '}
            Navegar
          </span>
          <span>
            <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-[10px] font-medium">
              Enter
            </kbd>{' '}
            Ir
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
