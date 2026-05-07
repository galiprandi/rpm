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

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function StockDisplay({ stock, minStock }: StockDisplayProps) {
  const isLowStock = stock <= minStock;

  const content = (
    <span className={isLowStock ? 'text-orange-600 font-medium' : ''}>
      {stock}
    </span>
  );

  if (!isLowStock) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent>
        Stock bajo el mínimo ({minStock})
      </TooltipContent>
    </Tooltip>
  );
}
