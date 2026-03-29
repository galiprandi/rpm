'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-200"
        onClick={onCancel}
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
            <h3 className="text-lg font-semibold text-slate-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8 rounded-full hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        {/* Content - empty for confirms */}
        <div className="p-6" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="border-slate-300"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={cn(
              'shadow-lg hover:shadow-xl transition-all font-semibold',
              variant === 'destructive'
                ? 'bg-red-600 text-white hover:bg-red-700 border border-red-600'
                : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900'
            )}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
