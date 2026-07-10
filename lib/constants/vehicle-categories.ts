export interface VehicleCategory {
  value: string;
  label: string;
  icon: string;
}

export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  { value: "CAR", label: "Auto", icon: "🚗" },
  { value: "SUV", label: "SUV/4x4", icon: "🚙" },
  { value: "PICKUP", label: "Pickup", icon: "🛻" },
  { value: "TRUCK", label: "Camión", icon: "🚚" },
  { value: "MOTORCYCLE", label: "Moto", icon: "🏍️" },
  { value: "TRAILER", label: "Trailer/Acoplado", icon: "🚛" },
  { value: "AUDIO_EQUIPMENT", label: "Equipo de Audio", icon: "🔊" },
  { value: "ELECTRIC_SCOOTER", label: "Monopatín Eléctrico", icon: "🛴" },
  { value: "OTHER", label: "Otro Equipo", icon: "📦" },
];

const categoryMap = new Map(VEHICLE_CATEGORIES.map((c) => [c.value, c]));

export function getVehicleCategory(value: string): VehicleCategory {
  return categoryMap.get(value) ?? { value, label: value, icon: "📦" };
}

export function getVehicleCategoryLabel(value: string): string {
  return getVehicleCategory(value).label;
}

export function getVehicleCategoryIcon(value: string): string {
  return getVehicleCategory(value).icon;
}
