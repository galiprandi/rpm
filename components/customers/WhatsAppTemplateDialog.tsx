"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Send } from "lucide-react";
import { getWhatsAppLink } from "@/lib/utils/whatsapp";
import { formatARS } from "@/lib/utils/format";

export interface WhatsAppTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  customerName: string;
  balance?: number;
  vehicles?: string[];
}

export function WhatsAppTemplateDialog({
  isOpen,
  onClose,
  phone,
  customerName,
  balance = 0,
  vehicles = [],
}: WhatsAppTemplateDialogProps) {
  // Determine default template based on customer state
  const [templateType, setTemplateType] = useState<string>(() => {
    if (balance > 0) return "DEBT";
    if (vehicles.length > 0) return "READY";
    return "GREETING";
  });

  const [messageText, setMessageText] = useState("");

  const formatMessage = (type: string): string => {
    const greeting = `Hola ${customerName}!`;
    const footer = `Cualquier duda quedamos a tu disposición. ¡Muchas gracias!`;

    if (type === "DEBT") {
      const debtMessage = `Te escribimos de *RPM Accesorios* para recordarte que tenés un saldo pendiente de *${formatARS(balance)}* en tu cuenta corriente.`;
      return `${greeting}\n\n${debtMessage}\n\n${footer}`;
    }

    if (type === "READY") {
      const vehicleStr = vehicles.length > 0 ? `*${vehicles.join(", ")}*` : "tu vehículo";
      const readyMessage = `Te avisamos que ${vehicleStr} ya está listo para retirar en *RPM Accesorios*. 🚀`;
      const balanceMessage = balance > 0
        ? `\n\nSaldo pendiente a abonar: *${formatARS(balance)}*`
        : "\n\nLa orden se encuentra totalmente abonada.";
      return `${greeting}\n\n${readyMessage}${balanceMessage}\n\n${footer}`;
    }

    // Default general greeting template
    return `${greeting}\n\nTe escribimos desde *RPM Accesorios*.\n\n${footer}`;
  };

  // Set initial template message when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMessageText(formatMessage(templateType));
    }
  }, [isOpen]);

  const handleTemplateChange = (type: string) => {
    setTemplateType(type);
    setMessageText(formatMessage(type));
  };

  const handleSend = () => {
    const link = getWhatsAppLink(phone, messageText);
    window.open(link, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MessageSquare className="h-5 w-5 text-emerald-600 pointer-events-none" aria-hidden="true" />
            Notificar por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Personaliza el mensaje antes de enviarlo a <span className="font-semibold">{customerName}</span> ({phone}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Template Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp-template-select">Seleccionar Plantilla</Label>
            <Select value={templateType} onValueChange={handleTemplateChange}>
              <SelectTrigger id="whatsapp-template-select" className="w-full">
                <SelectValue placeholder="Seleccione una plantilla" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEBT">Recordatorio de Deuda</SelectItem>
                <SelectItem value="READY">Vehículo Listo para Retirar</SelectItem>
                <SelectItem value="GREETING">Contacto General / Saludo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Live Message Preview / Editing Area */}
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp-message-textarea" className="flex items-center justify-between">
              <span>Mensaje (Editable)</span>
              <span className="text-xs text-muted-foreground">Admite formato de WhatsApp (asteriscos para negrita)</span>
            </Label>
            <Textarea
              id="whatsapp-message-textarea"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={8}
              className="font-sans text-sm focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
              aria-label="Contenido del mensaje de WhatsApp"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 font-semibold shadow-md transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            disabled={!messageText.trim()}
          >
            <Send className="h-4 w-4 pointer-events-none" aria-hidden="true" />
            Enviar WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
