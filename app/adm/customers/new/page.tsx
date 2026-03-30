"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, User, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const INVOICE_TYPES = ["A", "B", "C", "M"];

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    phoneAlt: "",
    email: "",
    address: "",
    notes: "",
    billingData: {
      cuit: "",
      invoiceType: "B",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        billingData: showBilling ? formData.billingData : undefined,
      };

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create customer");

      const customer = await response.json();
      router.push(`/adm/customers/${customer.id}`);
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Error al crear cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-4">
        <Link href="/adm/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Clientes
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6" />
            Nuevo Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono Principal *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+54 11 1234-5678"
                  required
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
                <ChevronDown className={cn("h-4 w-4 transition-transform", showBilling && "rotate-180")} />
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
                            billingData: { ...prev.billingData, cuit: e.target.value },
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
                            billingData: { ...prev.billingData, invoiceType: value },
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

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Guardando..." : "Guardar Cliente"}
              </Button>
              <Link href="/adm/customers" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
