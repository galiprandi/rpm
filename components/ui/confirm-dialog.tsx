"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const iconMap = {
    destructive: {
      icon: Trash2,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    default: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
  } as const;

  const { icon: Icon, color, bg } = iconMap[variant];

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-md p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex items-start gap-3.5 p-5">
          <div className={cn("flex-shrink-0 rounded-lg p-2.5", bg)}>
            <Icon className={cn("h-5 w-5", color)} aria-hidden="true" />
          </div>
          <div className="flex-1 space-y-1 pt-0.5">
            <h3 className="text-base font-semibold leading-tight">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <DialogFooter className="mx-0 mb-0 px-5 py-4">
          <Button variant="outline" onClick={onCancel} size="sm">
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
