'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Car,
  User,
  Plus,
  X,
  CheckCircle,
  Search,
  Phone,
  Mail,
} from 'lucide-react';
import { VehicleForm, type VehicleFormData } from './VehicleForm';
import { useUI } from '@/components/ui/UIProvider';
import {
  validateArgentinePhone,
  formatArgentinePhone,
} from '@/lib/utils/phone-validation';
import { cn } from '@/lib/utils';

const POPULAR_PREFIXES = [
  { code: "11", label: "AMBA (11)" },
  { code: "351", label: "Córdoba (351)" },
  { code: "341", label: "Rosario (341)" },
  { code: "261", label: "Mendoza (261)" },
  { code: "381", label: "Tucumán (381)" },
];

interface Customer {
  id: string;
  name: string;
  phone?: string;
}

interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  customerName?: string;
  preselectedIdentifier?: string;
  onSuccess?: (vehicle: { id: string; customer: Customer }) => void;
}

export function VehicleDialog({
  open,
  onOpenChange,
  customerId: customerIdProp,
  customerName: customerNameProp,
  preselectedIdentifier,
  onSuccess,
}: VehicleDialogProps) {
  const { alert } = useUI();
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(customerIdProp || null);
  const [customerName, setCustomerName] = useState(customerNameProp || '');
  const [customerSearch, setCustomerSearch] = useState('');
  const [foundCustomers, setFoundCustomers] = useState<Customer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [showCustomerCreatedToast, setShowCustomerCreatedToast] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  // Validation States for Inline Customer Phone
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState<boolean>(false);
  const [phoneRegion, setPhoneRegion] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setCustomerId(customerIdProp || null);
      setCustomerName(customerNameProp || '');
      setCustomerSearch('');
      setFoundCustomers([]);
      setIsCreatingCustomer(false);
      setNewCustomerData({ name: '', phone: '', email: '' });
      setPhoneError(null);
      setPhoneSuccess(false);
      setPhoneRegion(null);
    }
  }, [open, customerIdProp, customerNameProp]);

  const searchCustomers = async () => {
    if (!customerSearch.trim()) return;
    setSearchingCustomers(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setFoundCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setSearchingCustomers(false);
    }
  };

  const handlePhoneChange = (val: string) => {
    setNewCustomerData((prev) => ({ ...prev, phone: val }));

    const digits = val.replace(/\D/g, "");
    if (digits.length >= 10) {
      const res = validateArgentinePhone(val);
      if (res.isValid) {
        setPhoneError(null);
        setPhoneSuccess(true);
        setPhoneRegion(res.region || null);
        if (res.normalized) {
          const formatted = formatArgentinePhone(res.normalized);
          setNewCustomerData((prev) => ({ ...prev, phone: formatted }));
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
        setNewCustomerData((prev) => ({ ...prev, phone: formatted }));
      }
    } else {
      setPhoneError(res.error || "Número no válido");
      setPhoneSuccess(false);
      setPhoneRegion(null);
    }
  };

  const applyPrefix = (code: string) => {
    setNewCustomerData((prev) => {
      const currentVal = prev.phone;
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

      return {
        ...prev,
        phone: formatted,
      };
    });

    setTimeout(() => {
      const el = document.getElementById("new-customer-phone") as HTMLInputElement;
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }, 50);
  };

  const createCustomerInline = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) return;

    // Validate phone number before sending
    const res = validateArgentinePhone(newCustomerData.phone);
    if (!res.isValid) {
      setPhoneError(res.error || "Teléfono principal inválido");
      setPhoneSuccess(false);
      return;
    }

    setCreatingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerData),
      });
      if (res.ok) {
        const customer = await res.json();
        setCustomerId(customer.id);
        setCustomerName(customer.name);
        setIsCreatingCustomer(false);
        setNewCustomerData({ name: '', phone: '', email: '' });
        // Show brief confirmation
        setShowCustomerCreatedToast(true);
        setTimeout(() => setShowCustomerCreatedToast(false), 2000);
      } else {
        const error = await res.json();
        await alert({
          title: 'Error',
          description: error.error || 'Error al crear cliente',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      await alert({
        title: 'Error',
        description: 'Error al crear cliente',
        variant: 'error',
      });
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleSubmit = async (formData: VehicleFormData) => {
    const finalCustomerId = customerId || customerIdProp;
    if (!finalCustomerId) {
      await alert({
        title: 'Cliente requerido',
        description: 'Seleccione un cliente',
        variant: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customerId: finalCustomerId,
          year: formData.year ? parseInt(formData.year.toString()) : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create vehicle');

      const vehicle = await response.json();

      onOpenChange(false);
      onSuccess?.(vehicle);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      await alert({
        title: 'Error',
        description: 'Error al crear vehículo',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="h-4 w-4 text-primary pointer-events-none" aria-hidden="true" />
            </div>
            Agregar Vehículo o Equipo
          </DialogTitle>
          <DialogDescription>
            {customerId ? (
              <span className="flex items-center gap-1">
                Cliente: <span className="font-semibold text-foreground">{customerName}</span>
              </span>
            ) : (
              'Seleccione un cliente y complete los datos técnicos del vehículo o equipo'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Customer Selection - Only show if no customer pre-selected */}
          {!customerId && !customerIdProp && !isCreatingCustomer && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <Label htmlFor="customer-search" required className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Buscar Cliente
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreatingCustomer(true)}
                  className="text-primary"
                >
                  <Plus className="h-4 w-4 mr-1 pointer-events-none" aria-hidden="true" />
                  Crear nuevo
                </Button>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                  <Input
                    id="customer-search"
                    placeholder="Buscar por nombre..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchCustomers())}
                    className="pl-9"
                  />
                </div>
                <Button
                  type="button"
                  onClick={searchCustomers}
                  disabled={searchingCustomers || !customerSearch.trim()}
                >
                  {searchingCustomers ? '...' : 'Buscar'}
                </Button>
              </div>
              {foundCustomers.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {foundCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setCustomerId(customer.id);
                        setCustomerName(customer.name);
                        setFoundCustomers([]);
                      }}
                      className="w-full p-2 text-left hover:bg-accent rounded border"
                    >
                      <div className="font-medium">{customer.name}</div>
                      {customer.phone && (
                        <div className="text-xs text-muted-foreground">{customer.phone}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {foundCustomers.length === 0 && customerSearch.trim() && !searchingCustomers && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No se encontraron clientes.{' '}
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustomer(true)}
                    className="text-primary hover:underline"
                  >
                    Crear nuevo cliente
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create New Customer Form */}
          {!customerId && !customerIdProp && isCreatingCustomer && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Plus className="h-4 w-4 pointer-events-none" aria-hidden="true" />
                  Crear Nuevo Cliente
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCreatingCustomer(false);
                    setNewCustomerData({ name: '', phone: '', email: '' });
                  }}
                >
                  <X className="h-4 w-4 mr-1 pointer-events-none" aria-hidden="true" />
                  Cancelar
                </Button>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-customer-name" required>
                    Nombre
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <Input
                      id="new-customer-name"
                      value={newCustomerData.name}
                      onChange={(e) =>
                        setNewCustomerData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Ej: Juan Pérez"
                      className="pl-9"
                      aria-required="true"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-customer-phone" required>
                    Teléfono
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <Input
                      id="new-customer-phone"
                      value={newCustomerData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={(e) => handlePhoneBlur(e.target.value)}
                      placeholder="+54 9 11 1234-5678"
                      className={cn(
                        "pl-9 font-mono",
                        phoneError && "border-destructive ring-destructive/20 focus-visible:ring-destructive",
                        phoneSuccess && "border-emerald-500 focus-visible:ring-emerald-500"
                      )}
                      aria-required="true"
                    />
                  </div>

                  {/* Quick Prefixes Autocomplete Chips */}
                  <div className="mt-1 flex flex-wrap gap-1 items-center">
                    <span className="text-[0.7rem] text-muted-foreground mr-0.5">Prefijos:</span>
                    {POPULAR_PREFIXES.map((prefix) => (
                      <button
                        key={prefix.code}
                        type="button"
                        onClick={() => applyPrefix(prefix.code)}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-1.5 py-0.5 text-[0.7rem] font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer"
                        aria-label={`Aplicar prefijo (${prefix.code}) al teléfono principal`}
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
                  <Label htmlFor="new-customer-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <Input
                      id="new-customer-email"
                      type="email"
                      value={newCustomerData.email}
                      onChange={(e) =>
                        setNewCustomerData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="Ej: cliente@email.com"
                      className="pl-9 font-mono"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={createCustomerInline}
                  disabled={creatingCustomer || !newCustomerData.name || !newCustomerData.phone}
                  className="w-full"
                >
                  {creatingCustomer ? 'Creando...' : 'Crear Cliente'}
                </Button>
              </div>
            </div>
          )}

          {/* Customer Created Toast */}
          {showCustomerCreatedToast && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4" />
              <span>Cliente <strong>{customerName}</strong> creado exitosamente</span>
            </div>
          )}

          {/* Selected Customer Display */}
          {(customerId || customerIdProp) && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-emerald-600 pointer-events-none" aria-hidden="true" />
                </div>
                <span className="font-semibold text-emerald-700">{customerName || customerNameProp}</span>
              </div>
              {!customerIdProp && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomerId(null);
                    setCustomerName('');
                  }}
                >
                  Cambiar
                </Button>
              )}
            </div>
          )}

          <VehicleForm
            initialData={{ identifier: preselectedIdentifier }}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={loading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
