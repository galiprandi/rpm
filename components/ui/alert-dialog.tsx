'use client';

import { ModalBase } from '@/components/ui/ModalBase';
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
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'info':
      default:
        return 'text-foreground';
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title={<span className={getVariantStyles(variant)}>{title}</span>}
      description={description}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3">
          {action && (
            <Button variant="outline" onClick={() => { action.onClick(); onClose(); }}>
              {action.label}
            </Button>
          )}
          <Button onClick={onClose}>Aceptar</Button>
        </div>
      }
    >
      <div />
    </ModalBase>
  );
}
