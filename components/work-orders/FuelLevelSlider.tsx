import { Slider } from "@/components/ui/slider";
import { Droplet } from "lucide-react";

interface FuelLevelSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

const TICKS = [0, 25, 50, 75, 100];

export function FuelLevelSlider({ value, onChange, label }: FuelLevelSliderProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label || `Nivel de Combustible: ${value}%`}
      </label>
      <div className="relative py-4">
        <Slider
          value={[value]}
          onValueChange={(values: number[]) => onChange(values[0])}
          max={100}
          step={5}
          className="[&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-range]]:bg-blue-700 [&_[data-slot=slider-thumb]]:bg-gray-600 [&_[data-slot=slider-thumb]]:border-gray-700 [&_[data-slot=slider-thumb]]:w-5 [&_[data-slot=slider-thumb]]:h-5"
        />
        {/* Tick marks */}
        <div className="flex justify-between mt-2 px-1">
          {TICKS.map((tick) => (
            <div key={tick} className="flex flex-col items-center">
              <div className="w-0.5 h-1.5 bg-muted-foreground/40 mb-1" />
              <span className={`text-[10px] ${value === tick ? 'text-blue-700 font-bold' : 'text-muted-foreground/70'}`}>
                {tick}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Droplet className="h-3 w-3 text-red-500" />
          Vacío
        </span>
        <span className="flex items-center gap-1">
          Lleno
          <Droplet className="h-3 w-3 text-blue-600" />
        </span>
      </div>
    </div>
  );
}
