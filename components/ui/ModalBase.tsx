'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  maxHeight?: string;
  showCloseButton?: boolean;
  className?: string;
}

const widthClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

/**
 * ModalBase - Componente reutilizable para todos los modales de la app
 * 
 * Estilos consistentes:
 * - Fondo: bg-background (respeta tema claro/oscuro)
 * - Texto: text-foreground (respeta tema claro/oscuro)
 * - Header: Con border-bottom sutil
 * - Footer: Con border-top sutil y bg-muted/50
 * 
 * Uso:
 * ```tsx
 * <ModalBase
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Título"
 *   description="Descripción opcional"
 *   maxWidth="lg"
 *   footer={<Button onClick={handleSave}>Guardar</Button>}
 * >
 *   {children}
 * </ModalBase>
 * ```
 */
export function ModalBase({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
  maxHeight,
  showCloseButton = true,
  className,
}: ModalBaseProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          widthClasses[maxWidth],
          maxHeight && maxHeight,
          'flex flex-col p-10',
          className
        )}
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="pb-6 border-b">
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto py-6 text-foreground">
          {children}
        </div>

        {footer && (
          <DialogFooter className="border-t pt-6">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Footer predefinido con botones Cancelar/Guardar para formularios
interface ModalFooterProps {
  onCancel: () => void;
  onSave: () => void;
  cancelText?: string;
  saveText?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ModalBaseFooter({
  onCancel,
  onSave,
  cancelText = 'Cancelar',
  saveText = 'Guardar',
  isLoading = false,
  disabled = false,
}: ModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      <Button variant="outline" onClick={onCancel} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button
        onClick={disabled ? undefined : onSave}
        disabled={isLoading || disabled}
        className="bg-primary text-primary-foreground hover:bg-primary/90 border border-primary shadow-lg hover:shadow-xl transition-all font-semibold"
      >
        {isLoading ? 'Guardando...' : saveText}
      </Button>
    </div>
  );
}
