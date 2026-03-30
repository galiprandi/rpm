"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ArrowLeft, Save, Car } from "lucide-react";
import Link from "next/link";

const VEHICLE_CATEGORIES = [
  { value: "CAR", label: "Auto/Camioneta", icon: "🚗" },
  { value: "SUV", label: "SUV/4x4", icon: "🚙" },
  { value: "PICKUP", label: "Pickup", icon: "🛻" },
  { value: "TRUCK", label: "Camión", icon: "🚚" },
  { value: "MOTORCYCLE", label: "Moto", icon: "🏍️" },
  { value: "TRAILER", label: "Trailer/Acoplado", icon: "🚛" },
  { value: "AUDIO_EQUIPMENT", label: "Equipo de Audio", icon: "🔊" },
  { value: "ELECTRIC_SCOOTER", label: "Monopatín Eléctrico", icon: "🛴" },
  { value: "OTHER", label: "Otro Equipo", icon: "📦" },
];

interface Customer {
  id: string;
  name: string;
}

export default function NewVehiclePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId");

  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    identifier: "",
    category: "CAR",
    makeName: "",
    modelName: "",
    year: "",
    color: "",
    equipmentName: "",
    equipmentType: "",
    description: "",
    notes: "",
  });

  useEffect(() => {
    if (customerId) {
      fetch(`/api/customers/${customerId}`)
        .then((res) => res.json())
        .then((data) => setCustomer(data));
    }
  }, [customerId]);

  const isVehicle = ["CAR", "TRUCK", "SUV", "PICKUP", "MOTORCYCLE", "TRAILER"].includes(
    formData.category
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;

    setLoading(true);
    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          customerId,
          year: formData.year ? parseInt(formData.year) : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to create vehicle");

      const vehicle = await response.json();
      router.push(`/adm/customers/${customerId}`);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      alert("Error al crear vehículo");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!customerId) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">ID de cliente requerido</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-4">
        <Link href={`/adm/customers/${customerId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Cliente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Car className="h-6 w-6" />
            Nuevo Vehículo / Equipo
          </CardTitle>
          {customer && (
            <div className="text-sm text-muted-foreground">
              Cliente: {customer.name}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">
                {isVehicle ? "Patente" : "Código/N° Serie"} *
              </Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) =>
                  handleChange("identifier", e.target.value.toUpperCase())
                }
                placeholder={isVehicle ? "AB123CD" : "SN-12345"}
                required
              />
            </div>

            {isVehicle ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="makeName">Marca</Label>
                    <Input
                      id="makeName"
                      value={formData.makeName}
                      onChange={(e) => handleChange("makeName", e.target.value)}
                      placeholder="Toyota"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelName">Modelo</Label>
                    <Input
                      id="modelName"
                      value={formData.modelName}
                      onChange={(e) => handleChange("modelName", e.target.value)}
                      placeholder="Hilux"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Año</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => handleChange("year", e.target.value)}
                      placeholder="2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => handleChange("color", e.target.value)}
                      placeholder="Blanco"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="equipmentName">Nombre del Equipo *</Label>
                  <Input
                    id="equipmentName"
                    value={formData.equipmentName}
                    onChange={(e) => handleChange("equipmentName", e.target.value)}
                    placeholder="Parlante Sony GTK-XB90"
                    required={!isVehicle}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipmentType">Tipo de Equipo *</Label>
                  <Input
                    id="equipmentType"
                    value={formData.equipmentType}
                    onChange={(e) => handleChange("equipmentType", e.target.value)}
                    placeholder="Equipo de audio portátil"
                    required={!isVehicle}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Detalles adicionales del equipo..."
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Guardando..." : "Guardar Vehículo"}
              </Button>
              <Link href={`/adm/customers/${customerId}`} className="flex-1">
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
