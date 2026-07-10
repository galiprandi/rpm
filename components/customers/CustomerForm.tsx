"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateCUIT, formatCUIT } from "@/lib/utils/cuit-validation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  FileText,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INVOICE_TYPES = ["A", "B", "C", "M"];

export interface CustomerFormData {
  name: string;
  phone: string;
  phoneAlt: string;
  email: string;
  address: string;
  notes: string;
  billingData: {
    cuit: string;
    invoiceType: string;
  };
}

export interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  customerId?: string;
  onSubmit: (data: CustomerFormData) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Guardar",
  isSubmitting = false,
}: CustomerFormProps) {
  const [showBilling, setShowBilling] = useState(() => {
    return !!(
      initialData?.billingData?.cuit || initialData?.billingData?.invoiceType
    );
  });

  const [cuitError, setCuitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CustomerFormData>({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    phoneAlt: initialData?.phoneAlt || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    notes: initialData?.notes || "",
    billingData: {
      cuit: initialData?.billingData?.cuit || "",
      invoiceType: initialData?.billingData?.invoiceType || "B",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar CUIT si está presente
    if (formData.billingData.cuit) {
      if (!validateCUIT(formData.billingData.cuit)) {
        setCuitError("CUIT/CUIL inválido (verifique el dígito verificador)");
        return;
      }
    }

    await onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="customer-name" required>
          Nombre o Razón Social
        </Label>
        <div className="relative">
          <User
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="customer-name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Juan Pérez o Empresa S.A."
            className="pl-9"
            required
            aria-required="true"
          />
        </div>
      </div>

      {/* Teléfonos */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer-phone">Teléfono Principal</Label>
          <div className="relative">
            <Phone
              className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id="customer-phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+54 11 1234-5678"
              className="pl-9 font-mono"
              aria-label="Teléfono Principal"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-phone-alt">Teléfono Alternativo (WhatsApp)</Label>
          <div className="relative">
            <MessageSquare
              className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id="customer-phone-alt"
              value={formData.phoneAlt}
              onChange={(e) => handleChange("phoneAlt", e.target.value)}
              placeholder="+54 11 9876-5432"
              className="pl-9 font-mono"
              aria-label="Teléfono Alternativo (WhatsApp)"
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="customer-email">Email</Label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="customer-email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="juan@ejemplo.com"
            className="pl-9 font-mono"
            aria-label="Correo electrónico"
          />
        </div>
      </div>

      {/* Dirección */}
      <div className="space-y-2">
        <Label htmlFor="customer-address">Dirección</Label>
        <div className="relative">
          <MapPin
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="customer-address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Av. Siempre Viva 123, Springfield"
            className="pl-9"
            aria-label="Dirección de domicilio"
          />
        </div>
      </div>

      {/* Datos de Facturación (colapsable) */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => setShowBilling(!showBilling)}
          aria-expanded={showBilling}
          aria-controls="billing-section"
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <span className="font-medium">Datos de Facturación (opcional)</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              showBilling && "rotate-180"
            )}
          />
        </button>

        {showBilling && (
          <div id="billing-section" className="p-4 pt-0 space-y-4 border-t">
            <p className="text-sm text-muted-foreground">
              Solo completa si el cliente requiere factura AFIP
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-cuit">CUIT</Label>
                <div className="relative">
                  <Hash
                    className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="customer-cuit"
                    className={cn(
                      "font-mono pl-9",
                      cuitError && "border-destructive ring-destructive/20"
                    )}
                    value={formData.billingData.cuit}
                    onChange={(e) => {
                      const formatted = formatCUIT(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        billingData: {
                          ...prev.billingData,
                          cuit: formatted,
                        },
                      }));
                      if (cuitError) setCuitError(null);
                    }}
                    onBlur={(e) => {
                      if (e.target.value && !validateCUIT(e.target.value)) {
                        setCuitError("CUIT/CUIL inválido (verifique el dígito verificador)");
                      }
                    }}
                    placeholder="20-XXXXXXXX-X"
                    aria-label="CUIT o CUIL para facturación"
                  />
                </div>
                {cuitError && (
                  <p className="text-[0.8rem] font-medium text-destructive mt-1">
                    {cuitError}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-invoice-type">Tipo Factura</Label>
                <div className="relative">
                  <FileText
                    className="absolute left-3 top-2 h-4 w-4 text-muted-foreground z-10 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Select
                    value={formData.billingData.invoiceType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        billingData: {
                          ...prev.billingData,
                          invoiceType: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger id="customer-invoice-type" className="pl-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVOICE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          Factura {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="customer-notes">Notas / Observaciones</Label>
        <div className="relative">
          <FileText
            className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Textarea
            id="customer-notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Información adicional sobre el cliente..."
            rows={3}
            className="pl-9 min-h-[80px]"
            aria-label="Notas u observaciones adicionales"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 border border-primary shadow-lg hover:shadow-xl transition-all font-semibold"
        >
          {isSubmitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
