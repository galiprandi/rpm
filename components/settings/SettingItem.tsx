'use client';

import { ReactNode } from 'react';

interface SettingItemProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Compact setting item with horizontal layout
 * Left: Title + description, Right: Control
 */
export function SettingItem({ title, description, children }: SettingItemProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium">{title}</h4>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {children}
      </div>
    </div>
  );
}
