'use client';

import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface DashboardHeaderProps {
  onQuickSaleClick: () => void;
}

export function DashboardHeader({ onQuickSaleClick }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        onClick={onQuickSaleClick}
        className="gap-2"
      >
        <ShoppingCart className="h-4 w-4" />
        Venta Rápida
      </Button>
    </div>
  );
}
