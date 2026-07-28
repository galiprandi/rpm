"use client";

import {
  Car,
  CarFront,
  Truck,
  Bike,
  Package,
  Speaker,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps vehicle category values to Lucide icons,
 * replacing emoji-based icons from VEHICLE_CATEGORIES.
 */
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  CAR: Car,
  SUV: CarFront,
  PICKUP: Truck,
  TRUCK: Truck,
  MOTORCYCLE: Bike,
  TRAILER: Truck,
  AUDIO_EQUIPMENT: Speaker,
  ELECTRIC_SCOOTER: Bike,
  OTHER: Package,
};

/**
 * Returns the Lucide icon component for a given vehicle category.
 * Falls back to `Package` for unknown categories.
 */
export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICON_MAP[category] ?? Package;
}
