/**
 * Utility functions for formatting data
 */

/**
 * Format number as ARS currency
 * @param amount - Amount to format
 * @returns Formatted string (e.g., "$485.000")
 */
export function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
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
  if (!phone) return 'No disponible';
  // Format: XXX-XXX-1234 -> XXX-XXXX-1234 (mask middle 4 digits)
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1-XXXX-$2');
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
    return 'Hace un momento';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  }

  // For dates older than a week, return absolute date
  return past.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: past.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Get emoji for vehicle type
 * @param category - Vehicle category
 * @returns Emoji string
 */
export function getVehicleEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    CAR: '🚗',
    SEDAN: '🚙',
    SUV: '🚙',
    PICKUP: '🛻',
    TRUCK: '🚚',
    MOTORCYCLE: '🏍️',
    TRAILER: '🚛',
    AUDIO_EQUIPMENT: '🎧',
    ELECTRIC_SCOOTER: '🛴',
    OTHER: '📦',
  };
  return emojiMap[category] || '📦';
}

/**
 * Format percentage change
 * @param value - Percentage value (e.g., 15 for +15%)
 * @returns Formatted string with sign and color class
 */
export function formatPercentageChange(value: number): {
  text: string;
  className: string;
} {
  const sign = value >= 0 ? '+' : '';
  const text = `${sign}${value.toFixed(1)}%`;
  
  let className = 'text-gray-600';
  if (value > 0) {
    className = 'text-green-600';
  } else if (value < 0) {
    className = 'text-red-600';
  }
  
  return { text, className };
}
