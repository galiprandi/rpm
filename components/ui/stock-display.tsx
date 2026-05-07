'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Stock Display Component
 * Shows current stock quantity
 * Highlights when stock is low (below minimum)
 * Provides a tooltip with the minimum stock threshold when stock is low
 */

interface StockDisplayProps {
  stock: number;
  minStock: number;
}

export function StockDisplay({ stock, minStock }: StockDisplayProps) {
  const isLowStock = stock <= minStock;

  if (isLowStock) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="text-orange-600 font-medium cursor-help outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label={`Stock bajo: ${stock}. El nivel mínimo es ${minStock}`}
            tabIndex={0}
          >
            {stock}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Mínimo: {minStock}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span aria-label={`Stock: ${stock}`}>
      {stock}
    </span>
  );
}
