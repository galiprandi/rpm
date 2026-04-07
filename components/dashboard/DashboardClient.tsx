'use client';

import { useState } from 'react';
import { Header } from '@/components/adm/Header';
import { QuickSaleModal } from '@/components/dashboard/QuickSaleModal';
import { ShoppingCart } from 'lucide-react';

export function DashboardClient({ onQuickSaleSuccess }: { onQuickSaleSuccess?: () => void }) {
  const [quickSaleModalOpen, setQuickSaleModalOpen] = useState(false);

  return (
    <>
      <Header
        title="Dashboard"
        description="Vista general del sistema"
        primaryAction={{
          label: 'Venta Rápida',
          onClick: () => setQuickSaleModalOpen(true),
          icon: ShoppingCart,
        }}
      />
      <QuickSaleModal
        open={quickSaleModalOpen}
        onOpenChange={setQuickSaleModalOpen}
        onSuccess={() => {
          onQuickSaleSuccess?.();
          setQuickSaleModalOpen(false);
        }}
      />
    </>
  );
}
