'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/adm/Header';
import { QuickSaleModal } from '@/components/dashboard/QuickSaleModal';
import { ShoppingCart } from 'lucide-react';

export function DashboardClient({ onQuickSaleSuccess }: { onQuickSaleSuccess?: () => void }) {
  const router = useRouter();
  const [quickSaleModalOpen, setQuickSaleModalOpen] = useState(false);

  const handleSuccess = () => {
    onQuickSaleSuccess?.();
    // Refresh server data to update cash movements and payment methods
    router.refresh();
    setQuickSaleModalOpen(false);
  };

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
        onSuccess={handleSuccess}
      />
    </>
  );
}
