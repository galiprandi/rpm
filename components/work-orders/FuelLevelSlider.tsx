import { Slider } from "@/components/ui/slider";
import { Droplet } from "lucide-react";

interface FuelLevelSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export function FuelLevelSlider({ value, onChange, label }: FuelLevelSliderProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium">
        {label || `Nivel de Combustible: ${value}%`}
      </label>
      <Slider
        value={[value]}
        onValueChange={(values: number[]) => onChange(values[0])}
        max={100}
        step={5}
        className="py-4 [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-range]]:bg-blue-700 [&_[data-slot=slider-thumb]]:bg-gray-600 [&_[data-slot=slider-thumb]]:border-gray-700 [&_[data-slot=slider-thumb]]:w-4 [&_[data-slot=slider-thumb]]:h-4"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Droplet className="h-3 w-3" />
          Vacío
        </span>
        <span className="flex items-center gap-1">
          Lleno
          <Droplet className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
