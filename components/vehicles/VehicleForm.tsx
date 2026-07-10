"use client";

import { useState } from "react";
import {
  validatePlate,
  getPlateFormatHint,
} from "@/lib/utils/plate-validation";
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
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Car,
  Tag,
  Hash,
  CarFront,
  Calendar,
  Palette,
  Package,
  Wrench,
  FileText,
  Eye,
} from "lucide-react";
import { VEHICLE_CATEGORIES } from "@/lib/constants/vehicle-categories";
import type { VehicleFormData } from "@/lib/types/vehicle";

export { VEHICLE_CATEGORIES };
export type { VehicleFormData };

interface VehicleFormProps {
  initialData?: Partial<VehicleFormData>;
  onSubmit: (data: VehicleFormData) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function VehicleForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Guardar Vehículo",
  isSubmitting = false,
}: VehicleFormProps) {
  const [formData, setFormData] = useState<VehicleFormData>({
    identifier: initialData?.identifier || "",
    category: initialData?.category || "CAR",
    makeName: initialData?.makeName || "",
    modelName: initialData?.modelName || "",
    year: initialData?.year?.toString() || "",
    color: initialData?.color || "",
    equipmentName: initialData?.equipmentName || "",
    equipmentType: initialData?.equipmentType || "",
    description: initialData?.description || "",
    notes: initialData?.notes || "",
  });

  const [plateError, setPlateError] = useState<string | null>(null);

  const isVehicle = [
    "CAR",
    "TRUCK",
    "SUV",
    "PICKUP",
    "MOTORCYCLE",
    "TRAILER",
  ].includes(formData.category);

  const handleChange = (field: keyof VehicleFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "identifier") {
      setPlateError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isVehicle) {
      const isValid = validatePlate(formData.identifier);
      if (!isValid) {
        setPlateError(
          `Formato de patente inválido para Argentina. ${getPlateFormatHint(formData.category)}`,
        );
        return;
      }
    }

    setPlateError(null);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Categoría */}
      <div className="space-y-2">
        <Label
          htmlFor="vehicle-category-select"
          required
          className="flex items-center gap-2"
        >
          Categoría
        </Label>
        <div className="relative">
          <Tag
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10"
            aria-hidden="true"
          />
          <Select
            value={formData.category}
            onValueChange={(value) => handleChange("category", value)}
          >
            <SelectTrigger id="vehicle-category-select" className="pl-9" aria-label="Categoría de vehículo o equipo">
              <SelectValue placeholder="Seleccione categoría" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Identificador */}
      <div className="space-y-2">
        <Label htmlFor="vehicle-identifier" required>
          {isVehicle ? "Patente" : "Número de Serie/Identificador"}
        </Label>
        <div className="relative">
          <Hash
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="vehicle-identifier"
            value={formData.identifier}
            onChange={(e) =>
              handleChange("identifier", e.target.value.toUpperCase())
            }
            placeholder={isVehicle ? "Ej: AB123CD" : "Ej: SN123456"}
            required
            className={`pl-9 font-mono uppercase tracking-wider ${
              plateError
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            aria-required="true"
            aria-label={isVehicle ? "Patente del vehículo" : "Número de serie o identificador del equipo"}
          />
        </div>
        {plateError && (
          <p className="text-[0.8rem] font-medium text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
            {plateError}
          </p>
        )}
      </div>

      {/* Campos para vehículos */}
      {isVehicle ? (
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border border-dashed">
          <div className="space-y-2">
            <Label htmlFor="makeName">Marca</Label>
            <div className="relative">
              <Car
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="makeName"
                value={formData.makeName}
                onChange={(e) => handleChange("makeName", e.target.value)}
                placeholder="Ej: Toyota"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelName">Modelo</Label>
            <div className="relative">
              <CarFront
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="modelName"
                value={formData.modelName}
                onChange={(e) => handleChange("modelName", e.target.value)}
                placeholder="Ej: Hilux"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Año</Label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleChange("year", e.target.value)}
                placeholder="Ej: 2020"
                min="1900"
                max={new Date().getFullYear() + 1}
                className="pl-9 font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="relative">
              <Palette
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleChange("color", e.target.value)}
                placeholder="Ej: Blanco"
                className="pl-9"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Campos para equipos */
        <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-dashed">
          <div className="space-y-2">
            <Label htmlFor="equipmentName" required={!isVehicle}>
              Nombre del Equipo
            </Label>
            <div className="relative">
              <Package
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="equipmentName"
                value={formData.equipmentName}
                onChange={(e) => handleChange("equipmentName", e.target.value)}
                placeholder="Ej: Equipo de Sonido JBL"
                required={!isVehicle}
                className="pl-9"
                aria-required={!isVehicle}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipmentType">Tipo de Equipo</Label>
            <div className="relative">
              <Wrench
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="equipmentType"
                value={formData.equipmentType}
                onChange={(e) => handleChange("equipmentType", e.target.value)}
                placeholder="Ej: Audio Profesional"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <div className="relative">
              <FileText
                className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Detalles adicionales del equipo..."
                rows={3}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Summary Preview */}
      {(formData.makeName ||
        formData.modelName ||
        formData.color ||
        formData.year) && (
        <div className="p-4 bg-primary/[0.02] rounded-lg border border-primary/10 border-dashed">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary/60 uppercase tracking-widest mb-3">
            <Eye
              className="h-3.5 w-3.5 pointer-events-none"
              aria-hidden="true"
            />
            Vista previa técnica
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="font-mono bg-background shadow-sm border-primary/20 text-primary"
            >
              {formData.identifier || "SIN ID"}
            </Badge>
            {formData.makeName && (
              <Badge variant="secondary" className="font-medium">
                {formData.makeName}
              </Badge>
            )}
            {formData.modelName && (
              <Badge variant="secondary" className="font-medium">
                {formData.modelName}
              </Badge>
            )}
            {formData.year && (
              <Badge variant="outline" className="font-mono">
                {formData.year}
              </Badge>
            )}
            {formData.color && (
              <Badge
                variant="outline"
                className="border-dashed text-muted-foreground bg-muted/30"
              >
                {formData.color}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="vehicle-notes">Notas</Label>
        <div className="relative">
          <FileText
            className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Textarea
            id="vehicle-notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Notas internas sobre el vehículo/equipo..."
            rows={2}
            className="pl-9 min-h-[80px]"
            aria-label="Notas internas adicionales"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
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
          className="gap-2 shadow-sm min-w-[140px]"
        >
          {isSubmitting ? (
            "Guardando..."
          ) : (
            <>
              <Save
                className="h-4 w-4 pointer-events-none"
                aria-hidden="true"
              />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
