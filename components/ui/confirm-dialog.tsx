'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
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
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      default:
        return <Info className="h-6 w-6 text-primary" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-destructive/10';
      case 'warning':
        return 'bg-orange-500/10';
      default:
        return 'bg-primary/10';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-md p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex items-start gap-4 p-6">
          <div className={`flex-shrink-0 rounded-full p-3 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
        <DialogFooter className="border-t px-6 py-5">
          <div className="flex items-center justify-end gap-4 w-full">
            <Button variant="outline" onClick={onCancel} className="px-5 py-2.5">
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              className="px-5 py-2.5"
            >
              {confirmText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
