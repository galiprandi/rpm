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

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setCustomerId(customerIdProp || null);
      setCustomerName(customerNameProp || '');
      setCustomerSearch('');
      setFoundCustomers([]);
      setIsCreatingCustomer(false);
      setNewCustomerData({ name: '', phone: '', email: '' });
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

  const createCustomerInline = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) return;
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
        alert(error.error || 'Error al crear cliente');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Error al crear cliente');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleSubmit = async (formData: VehicleFormData) => {
    const finalCustomerId = customerId || customerIdProp;
    if (!finalCustomerId) {
      alert('Seleccione un cliente');
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
      alert('Error al crear vehículo');
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
                      onChange={(e) =>
                        setNewCustomerData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="Ej: 1123456789"
                      className="pl-9 font-mono"
                      aria-required="true"
                    />
                  </div>
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
