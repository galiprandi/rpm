"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, ChevronDown, Loader2 } from "lucide-react";
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
    await onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre o Razón Social *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Juan Pérez o Empresa S.A."
          required
        />
      </div>

      {/* Teléfonos */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono Principal</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+54 11 1234-5678"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneAlt">Teléfono Alternativo (WhatsApp)</Label>
          <Input
            id="phoneAlt"
            value={formData.phoneAlt}
            onChange={(e) => handleChange("phoneAlt", e.target.value)}
            placeholder="+54 11 9876-5432"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="juan@ejemplo.com"
        />
      </div>

      {/* Dirección */}
      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Av. Siempre Viva 123, Springfield"
        />
      </div>

      {/* Datos de Facturación (colapsable) */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => setShowBilling(!showBilling)}
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
          <div className="p-4 pt-0 space-y-4 border-t">
            <p className="text-sm text-muted-foreground">
              Solo completa si el cliente requiere factura AFIP
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cuit">CUIT</Label>
                <Input
                  id="cuit"
                  value={formData.billingData.cuit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      billingData: {
                        ...prev.billingData,
                        cuit: e.target.value,
                      },
                    }))
                  }
                  placeholder="30-12345678-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceType">Tipo Factura</Label>
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
                  <SelectTrigger>
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
        )}
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas / Observaciones</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Información adicional sobre el cliente..."
          rows={3}
        />
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
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
