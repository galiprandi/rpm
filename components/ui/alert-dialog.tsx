"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  variant?: "success" | "error" | "warning" | "info";
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
  variant = "info",
  action,
  onClose,
}: AlertDialogProps) {
  const iconMap = {
    success: {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    error: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/10" },
    warning: {
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
  } as const;

  const { icon: Icon, color, bg } = iconMap[variant];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex items-start gap-3.5 p-5">
          <div className={cn("flex-shrink-0 rounded-lg p-2.5", bg)}>
            <Icon className={cn("h-5 w-5", color)} aria-hidden="true" />
          </div>
          <div className="flex-1 space-y-1 pt-0.5">
            <h3 className="text-base font-semibold leading-tight">{title}</h3>
            <DialogDescription className="text-sm leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </div>
        <DialogFooter className="mx-0 mb-0 px-5 py-4">
          {action && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                action.onClick();
                onClose();
              }}
            >
              {action.label}
            </Button>
          )}
          <Button onClick={onClose} size="sm">
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
