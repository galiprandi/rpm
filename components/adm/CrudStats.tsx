'use client';

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface StatItem {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  iconColor?: string;
}

interface CrudStatsProps {
  stats: StatItem[];
}

export function CrudStats({ stats }: CrudStatsProps) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <span key={index} className="flex items-center">
            <Icon className="h-3.5 w-3.5 mr-1" style={{ color: stat.iconColor }} />
            <span>{stat.label}:</span>
            <span className="ml-0.5 font-medium text-foreground">{stat.value}</span>
            {index < stats.length - 1 && (
              <span className="mx-2 text-muted-foreground/50">·</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
