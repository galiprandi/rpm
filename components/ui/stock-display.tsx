'use client';

/**
 * Stock Display Component
 * Shows current stock quantity
 * Highlights when stock is low (below minimum)
 */

interface StockDisplayProps {
  stock: number;
  minStock: number;
}

export function StockDisplay({ stock, minStock }: StockDisplayProps) {
  const isLowStock = stock <= minStock;

  return (
    <span className={isLowStock ? 'text-orange-600 font-medium' : ''}>
      {stock}
    </span>
  );
}
