'use client';

/**
 * Price Display Component
 * Formats prices using Intl.NumberFormat for Argentine Peso (ARS)
 * No styling - returns formatted string
 */

interface PriceDisplayProps {
  value: number;
  currency?: string;
  locale?: string;
}

export function formatPrice(
  value: number,
  currency: string = 'ARS',
  locale: string = 'es-AR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PriceDisplay({
  value,
  currency = 'ARS',
  locale = 'es-AR',
}: PriceDisplayProps) {
  const formatted = formatPrice(value, currency, locale);
  return <>{formatted}</>;
}
