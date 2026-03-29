'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - oscuro y blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container - solo light mode para consistencia */}
      <div
        className={cn(
          'relative z-50 w-full mx-4 bg-white rounded-xl shadow-2xl',
          'border border-slate-200',
          'transform transition-all duration-200 scale-100',
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <h3
              id="modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Footer predefinido con botones Cancelar/Guardar
interface ModalFooterProps {
  onCancel: () => void;
  onSave: () => void;
  cancelText?: string;
  saveText?: string;
  isLoading?: boolean;
}

export function ModalFooter({
  onCancel,
  onSave,
  cancelText = 'Cancelar',
  saveText = 'Guardar',
  isLoading = false,
}: ModalFooterProps) {
  return (
    <>
      <Button variant="outline" onClick={onCancel} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button onClick={onSave} disabled={isLoading}>
        {isLoading ? 'Guardando...' : saveText}
      </Button>
    </>
  );
}
