"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateCUIT, formatCUIT } from "@/lib/utils/cuit-validation";
import {
  validateArgentinePhone,
  formatArgentinePhone,
} from "@/lib/utils/phone-validation";
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
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INVOICE_TYPES = ["A", "B", "C", "M"];

const POPULAR_PREFIXES = [
  { code: "11", label: "AMBA (11)" },
  { code: "351", label: "Córdoba (351)" },
  { code: "341", label: "Rosario (341)" },
  { code: "261", label: "Mendoza (261)" },
  { code: "381", label: "Tucumán (381)" },
];

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
  const [cuitSuccess, setCuitSuccess] = useState<boolean>(() => {
    return !!(
      initialData?.billingData?.cuit &&
      validateCUIT(initialData.billingData.cuit)
    );
  });

  // Validation States for Phones
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState<boolean>(() => {
    return !!(initialData?.phone && validateArgentinePhone(initialData.phone).isValid);
  });
  const [phoneRegion, setPhoneRegion] = useState<string | null>(() => {
    return initialData?.phone ? validateArgentinePhone(initialData.phone).region || null : null;
  });

  const [phoneAltError, setPhoneAltError] = useState<string | null>(null);
  const [phoneAltSuccess, setPhoneAltSuccess] = useState<boolean>(() => {
    return !!(initialData?.phoneAlt && validateArgentinePhone(initialData.phoneAlt).isValid);
  });
  const [phoneAltRegion, setPhoneAltRegion] = useState<string | null>(() => {
    return initialData?.phoneAlt ? validateArgentinePhone(initialData.phoneAlt).region || null : null;
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
    if (isSubmitting) return;

    // Validar CUIT si está presente
    if (formData.billingData.cuit) {
      if (!validateCUIT(formData.billingData.cuit)) {
        setCuitError("CUIT/CUIL inválido (verifique el dígito verificador)");
        setCuitSuccess(false);
        return;
      }
    }

    // Validar teléfonos si están presentes
    if (formData.phone) {
      const res = validateArgentinePhone(formData.phone);
      if (!res.isValid) {
        setPhoneError(res.error || "Teléfono principal inválido");
        setPhoneSuccess(false);
        return;
      }
    }
    if (formData.phoneAlt) {
      const res = validateArgentinePhone(formData.phoneAlt);
      if (!res.isValid) {
        setPhoneAltError(res.error || "Teléfono alternativo inválido");
        setPhoneAltSuccess(false);
        return;
      }
    }

    await onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (val: string) => {
    setFormData((prev) => ({ ...prev, phone: val }));

    const digits = val.replace(/\D/g, "");
    if (digits.length >= 10) {
      const res = validateArgentinePhone(val);
      if (res.isValid) {
        setPhoneError(null);
        setPhoneSuccess(true);
        setPhoneRegion(res.region || null);
        if (res.normalized) {
          const formatted = formatArgentinePhone(res.normalized);
          setFormData((prev) => ({ ...prev, phone: formatted }));
        }
      } else {
        setPhoneSuccess(false);
        setPhoneRegion(null);
      }
    } else {
      setPhoneSuccess(false);
      setPhoneRegion(null);
      setPhoneError(null);
    }
  };

  const handlePhoneBlur = (val: string) => {
    if (!val) {
      setPhoneError(null);
      setPhoneSuccess(false);
      setPhoneRegion(null);
      return;
    }
    const res = validateArgentinePhone(val);
    if (res.isValid) {
      setPhoneError(null);
      setPhoneSuccess(true);
      setPhoneRegion(res.region || null);
      if (res.normalized) {
        const formatted = formatArgentinePhone(res.normalized);
        setFormData((prev) => ({ ...prev, phone: formatted }));
      }
    } else {
      setPhoneError(res.error || "Número no válido");
      setPhoneSuccess(false);
      setPhoneRegion(null);
    }
  };

  const handlePhoneAltChange = (val: string) => {
    setFormData((prev) => ({ ...prev, phoneAlt: val }));

    const digits = val.replace(/\D/g, "");
    if (digits.length >= 10) {
      const res = validateArgentinePhone(val);
      if (res.isValid) {
        setPhoneAltError(null);
        setPhoneAltSuccess(true);
        setPhoneAltRegion(res.region || null);
        if (res.normalized) {
          const formatted = formatArgentinePhone(res.normalized);
          setFormData((prev) => ({ ...prev, phoneAlt: formatted }));
        }
      } else {
        setPhoneAltSuccess(false);
        setPhoneAltRegion(null);
      }
    } else {
      setPhoneAltSuccess(false);
      setPhoneAltRegion(null);
      setPhoneAltError(null);
    }
  };

  const handlePhoneAltBlur = (val: string) => {
    if (!val) {
      setPhoneAltError(null);
      setPhoneAltSuccess(false);
      setPhoneAltRegion(null);
      return;
    }
    const res = validateArgentinePhone(val);
    if (res.isValid) {
      setPhoneAltError(null);
      setPhoneAltSuccess(true);
      setPhoneAltRegion(res.region || null);
      if (res.normalized) {
        const formatted = formatArgentinePhone(res.normalized);
        setFormData((prev) => ({ ...prev, phoneAlt: formatted }));
      }
    } else {
      setPhoneAltError(res.error || "Número no válido");
      setPhoneAltSuccess(false);
      setPhoneAltRegion(null);
    }
  };

  const applyPrefix = (field: "phone" | "phoneAlt", code: string) => {
    setFormData((prev) => {
      const currentVal = prev[field];
      let localDigits = "";
      if (currentVal) {
        const digits = currentVal.replace(/\D/g, "");
        if (digits.length > 0) {
          let cleanDigits = digits;
          if (cleanDigits.startsWith("549")) {
            cleanDigits = cleanDigits.substring(3);
          } else if (cleanDigits.startsWith("54")) {
            cleanDigits = cleanDigits.substring(2);
          }
          if (cleanDigits.startsWith("9")) {
            cleanDigits = cleanDigits.substring(1);
          }
          if (cleanDigits.startsWith("0")) {
            cleanDigits = cleanDigits.substring(1);
          }
          localDigits = cleanDigits.slice(-Math.min(cleanDigits.length, 8));
        }
      }

      const newRaw = `549${code}${localDigits}`;
      const formatted = localDigits ? formatArgentinePhone(newRaw) : `+54 9 ${code} `;

      const isAlt = field === "phoneAlt";
      if (isAlt) {
        const res = validateArgentinePhone(formatted);
        if (res.isValid) {
          setPhoneAltError(null);
          setPhoneAltSuccess(true);
          setPhoneAltRegion(res.region || null);
        } else {
          setPhoneAltError(null);
          setPhoneAltSuccess(false);
          setPhoneAltRegion(null);
        }
      } else {
        const res = validateArgentinePhone(formatted);
        if (res.isValid) {
          setPhoneError(null);
          setPhoneSuccess(true);
          setPhoneRegion(res.region || null);
        } else {
          setPhoneError(null);
          setPhoneSuccess(false);
          setPhoneRegion(null);
        }
      }

      return {
        ...prev,
        [field]: formatted,
      };
    });

    setTimeout(() => {
      const inputId = field === "phone" ? "customer-phone" : "customer-phone-alt";
      const el = document.getElementById(inputId) as HTMLInputElement;
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }, 50);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={(e) => handlePhoneBlur(e.target.value)}
              placeholder="+54 9 11 1234-5678"
              className={cn(
                "pl-9 font-mono",
                phoneError && "border-destructive ring-destructive/20 focus-visible:ring-destructive",
                phoneSuccess && "border-emerald-500 focus-visible:ring-emerald-500"
              )}
              aria-label="Teléfono Principal"
            />
          </div>

          {/* Quick Prefixes Autocomplete Chips */}
          <div className="mt-1 flex flex-wrap gap-1 items-center">
            <span className="text-[0.7rem] text-muted-foreground mr-0.5">Prefijos:</span>
            {POPULAR_PREFIXES.map((prefix) => (
              <button
                key={prefix.code}
                type="button"
                onClick={() => applyPrefix("phone", prefix.code)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-1.5 py-0.5 text-[0.7rem] font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer"
                aria-label={`Aplicar prefijo AMBA (${prefix.code}) al teléfono principal`}
              >
                {prefix.code}
              </button>
            ))}
          </div>

          {phoneError && (
            <p className="text-[0.8rem] font-medium text-destructive mt-1">
              {phoneError}
            </p>
          )}
          {phoneSuccess && (
            <p className="text-[0.8rem] font-medium text-emerald-700 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Teléfono válido ({phoneRegion})
            </p>
          )}
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
              onChange={(e) => handlePhoneAltChange(e.target.value)}
              onBlur={(e) => handlePhoneAltBlur(e.target.value)}
              placeholder="+54 9 11 9876-5432"
              className={cn(
                "pl-9 font-mono",
                phoneAltError && "border-destructive ring-destructive/20 focus-visible:ring-destructive",
                phoneAltSuccess && "border-emerald-500 focus-visible:ring-emerald-500"
              )}
              aria-label="Teléfono Alternativo (WhatsApp)"
            />
          </div>

          {/* Quick Prefixes Autocomplete Chips */}
          <div className="mt-1 flex flex-wrap gap-1 items-center">
            <span className="text-[0.7rem] text-muted-foreground mr-0.5">Prefijos:</span>
            {POPULAR_PREFIXES.map((prefix) => (
              <button
                key={prefix.code}
                type="button"
                onClick={() => applyPrefix("phoneAlt", prefix.code)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-1.5 py-0.5 text-[0.7rem] font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer"
                aria-label={`Aplicar prefijo AMBA (${prefix.code}) al teléfono de WhatsApp`}
              >
                {prefix.code}
              </button>
            ))}
          </div>

          {phoneAltError && (
            <p className="text-[0.8rem] font-medium text-destructive mt-1">
              {phoneAltError}
            </p>
          )}
          {phoneAltSuccess && (
            <p className="text-[0.8rem] font-medium text-emerald-700 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              WhatsApp válido ({phoneAltRegion})
            </p>
          )}
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
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Datos de Facturación (opcional)</span>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      cuitError && "border-destructive ring-destructive/20 focus-visible:ring-destructive",
                      cuitSuccess && "border-emerald-500 focus-visible:ring-emerald-500"
                    )}
                    value={formData.billingData.cuit}
                    onChange={(e) => {
                      const formatted = formatCUIT(e.target.value);
                      const clean = formatted.replace(/\D/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        billingData: {
                          ...prev.billingData,
                          cuit: formatted,
                        },
                      }));
                      if (clean.length === 11) {
                        if (validateCUIT(formatted)) {
                          setCuitError(null);
                          setCuitSuccess(true);
                        } else {
                          setCuitError("CUIT/CUIL inválido (verifique el dígito verificador)");
                          setCuitSuccess(false);
                        }
                      } else {
                        setCuitSuccess(false);
                        setCuitError(null);
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      const clean = val.replace(/\D/g, "");
                      if (clean) {
                        if (clean.length < 11) {
                          setCuitError("El CUIT debe tener 11 dígitos");
                          setCuitSuccess(false);
                        } else if (!validateCUIT(val)) {
                          setCuitError("CUIT/CUIL inválido (verifique el dígito verificador)");
                          setCuitSuccess(false);
                        } else {
                          setCuitError(null);
                          setCuitSuccess(true);
                        }
                      } else {
                        setCuitError(null);
                        setCuitSuccess(false);
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
                {cuitSuccess && (
                  <p className="text-[0.8rem] font-medium text-emerald-700 mt-1 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    CUIT válido
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
