'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
}

export function AlertDialog({
  isOpen,
  title,
  description,
  variant = 'info',
  action,
  onClose,
}: AlertDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'text-emerald-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-amber-600';
      case 'info':
      default:
        return 'text-slate-900';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className={cn(
          'relative z-[101] w-full mx-4 bg-white rounded-xl shadow-2xl',
          'border border-slate-200',
          'transform transition-all duration-200 scale-100',
          'max-w-md'
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className={cn('text-lg font-semibold', getVariantStyles(variant))}>
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        {/* Content - empty for alerts */}
        <div className="p-6" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
          {action && (
            <Button
              variant="outline"
              onClick={() => {
                action.onClick();
                onClose();
              }}
            >
              {action.label}
            </Button>
          )}
          <Button 
            onClick={onClose}
            className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}
