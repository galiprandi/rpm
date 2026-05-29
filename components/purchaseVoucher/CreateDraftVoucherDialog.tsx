"use client";

import { useState, useEffect } from "react";
import { ModalBase, ModalBaseFooter } from "@/components/ui/ModalBase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUI } from "@/components/ui/UIProvider";
import { Plus } from "lucide-react";
import { SupplierDialog } from "@/components/suppliers/SupplierDialog";
import { type SupplierFormData } from "@/components/suppliers/SupplierForm";

interface SupplierOption {
  id: string;
  name: string;
}

interface PaymentMethodOption {
  id: string;
  name: string;
}

interface CreateDraftVoucherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDraftCreated?: (voucher: { id: string; totalAmount?: unknown; letter: string; number: string; supplier?: { name: string } }) => void;
}

export function CreateDraftVoucherDialog({
  isOpen,
  onClose,
  onDraftCreated,
}: CreateDraftVoucherDialogProps) {
  const { alert } = useUI();
  const [loading, setLoading] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState<SupplierFormData>({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  // Lists
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);

  // Form Fields
  const [supplierId, setSupplierId] = useState("");
  const [letter, setLetter] = useState("A");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [notes, setNotes] = useState("");

  // Load suppliers and payment methods
  useEffect(() => {
    const loadData = async () => {
      try {
        const [suppRes, payRes] = await Promise.all([
          fetch("/api/suppliers"),
          fetch("/api/payment-methods"),
        ]);
        if (suppRes.ok) {
          const suppData = await suppRes.json();
          setSuppliers(suppData.suppliers || []);
        }
        if (payRes.ok) {
          const payData = await payRes.json();
          setPaymentMethods(payData.paymentMethods || []);
        }
      } catch (err) {
        console.error("Error fetching form dependency options:", err);
      }
    };
    if (isOpen) loadData();
  }, [isOpen]);

  const handleCreateSupplier = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!supplierFormData.name.trim()) return;

    try {
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierFormData),
      });

      if (response.ok) {
        const newSupplier = await response.json();
        setSuppliers([...suppliers, newSupplier]);
        setSupplierId(newSupplier.id);
        setSupplierFormData({
          name: '',
          contactName: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
        });
        setIsSupplierDialogOpen(false);
      } else {
        const errorData = await response.json();
        await alert({
          title: "Error",
          description: errorData.error || "Error al crear proveedor",
          variant: "error",
        });
      }
    } catch {
      await alert({
        title: "Error",
        description: "Error al crear proveedor",
        variant: "error",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !letter || !number || !date || !totalAmount) {
      await alert({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos requeridos.",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/purchase-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          letter,
          number,
          date: new Date(date).toISOString(),
          totalAmount: parseFloat(totalAmount),
          paymentMethodId: paymentMethodId || null,
          notes,
          createdBy: "admin",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "No se pudo crear el comprobante");
      }

      const voucher = await res.json();
      onDraftCreated?.(voucher);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear el comprobante.";
      await alert({
        title: "Error",
        description: message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Comprobante de Compra"
      description="Registra la cabecera del comprobante para comenzar la carga de productos"
      maxWidth="lg"
      footer={
        <ModalBaseFooter
          onCancel={onClose}
          onSave={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
          saveText="Crear Borrador"
          isLoading={loading}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor *</Label>
            <div className="flex gap-2">
              <select
                id="supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Seleccione un proveedor...</option>
                {suppliers.map((s) => (
                  <option key={s.id || s.name} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSupplierDialogOpen(true)}
                className="h-9 px-2"
                title="Crear nuevo proveedor"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Forma de Pago</Label>
            <select
              id="paymentMethod"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Cuenta Corriente</option>
              {paymentMethods
                .filter((p) => p.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="letter">Letra *</Label>
            <select
              id="letter"
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="X">X</option>
              <option value="M">M</option>
            </select>
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="number">Número de Factura *</Label>
            <Input
              id="number"
              placeholder="0001-00000234"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha de Emisión *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalAmount">Monto Total ($) *</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas / Observaciones</Label>
          <Textarea
            id="notes"
            placeholder="Cargar detalles o notas internas de compra..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </form>

      <SupplierDialog
        isOpen={isSupplierDialogOpen}
        onClose={() => setIsSupplierDialogOpen(false)}
        editingSupplier={null}
        formData={supplierFormData}
        setFormData={setSupplierFormData}
        onSubmit={(e) => { handleCreateSupplier(e); }}
      />
    </ModalBase>
  );
}
