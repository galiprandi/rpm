/**
 * Utility functions for formatting data
 */

import { getVehicleCategoryIcon } from "@/lib/constants/vehicle-categories";

/**
 * Capitalize first letter of each name/surname (after spaces only)
 * @param text - Text to capitalize
 * @returns Capitalized text (e.g., "juan perez" -> "Juan Perez", "martínez" -> "Martínez")
 */
export function capitalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text.trim().replace(/(^|\s)\w/g, (char) => char.toUpperCase());
}

/**
 * Normalize text for case-insensitive comparison
 * @param text - Text to normalize
 * @returns Lowercase trimmed text
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text.trim().toLowerCase();
}

/**
 * Format number as ARS currency
 * @param amount - Amount to format
 * @returns Formatted string (e.g., "$485.000")
 */
export function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Mask phone number for privacy
 * @param phone - Phone number to mask
 * @returns Masked phone number (e.g., "+54 9 11-XXXX-5678")
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "No disponible";
  // Format: XXX-XXX-1234 -> XXX-XXXX-1234 (mask middle 4 digits)
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1-XXXX-$2");
}

/**
 * Format relative time (e.g., "Hace 2 horas")
 * @param date - Date to format
 * @returns Relative time string
 */
export function relativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Hace un momento";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? "minuto" : "minutos"}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} ${diffInHours === 1 ? "hora" : "horas"}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Hace ${diffInDays} ${diffInDays === 1 ? "día" : "días"}`;
  }

  // For dates older than a week, return absolute date
  return past.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: past.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Get emoji for vehicle type
 * @param category - Vehicle category
 * @returns Emoji string
 */
export function getVehicleEmoji(category: string): string {
  return getVehicleCategoryIcon(category);
}

/**
 * Format percentage change with cap for extreme values
 * @param value - Percentage value (e.g., 15 for +15%)
 * @returns Formatted string with sign and color class
 */
export function formatPercentageChange(value: number): {
  text: string;
  className: string;
} {
  const MAX_DISPLAY = 999;
  const sign = value >= 0 ? "+" : "";
  const text =
    Math.abs(value) > MAX_DISPLAY
      ? `${sign}${MAX_DISPLAY}%`
      : `${sign}${value.toFixed(1)}%`;

  let className = "text-gray-600";
  if (value > 0) {
    className = "text-emerald-700";
  } else if (value < 0) {
    className = "text-red-700";
  }

  return { text, className };
}

/**
 * Convert text to Title Case (first letter of each word capitalized)
 * @param text - Text to convert
 * @returns Title Case text (e.g., "TRANSFER bbva" -> "Transfer Bbva")
 */
export function toTitleCase(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Format phone number for Argentine numbers
 * @param phone - Raw phone number string
 * @returns Formatted phone (e.g., "5493816187329" -> "+54 9 3816 187329")
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return phone || "";
  if (digits.startsWith("549") && digits.length >= 12) {
    return `+54 9 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  if (digits.startsWith("54") && digits.length >= 10) {
    return `+54 ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return phone;
}
