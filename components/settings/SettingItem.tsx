'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface SettingItemProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}

/**
 * Compact setting item with horizontal layout
 * Left: Title + description, Right: Control
 */
export function SettingItem({
  title,
  description,
  icon: Icon,
  children,
  className,
  htmlFor
}: SettingItemProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-5 border-b border-border/50 last:border-0 transition-colors",
      className
    )}>
      <div className="flex gap-3 flex-1 min-w-0">
        {Icon && (
          <div className="shrink-0 mt-0.5">
            <Icon
              className="h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {htmlFor ? (
            <Label
              htmlFor={htmlFor}
              className="text-[0.925rem] font-medium leading-none mb-1.5 cursor-pointer block"
            >
              {title}
            </Label>
          ) : (
            <h4 className="text-[0.925rem] font-medium leading-none mb-1.5">{title}</h4>
          )}
          {description && (
            <p className="text-[0.8rem] text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 sm:ml-4">
        {children}
      </div>
    </div>
  );
}
