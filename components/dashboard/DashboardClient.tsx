'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickSaleModal } from '@/components/dashboard/QuickSaleModal';

export function DashboardClient({ onQuickSaleSuccess }: { onQuickSaleSuccess?: () => void }) {
  const [quickSaleModalOpen, setQuickSaleModalOpen] = useState(false);

  return (
    <>
      <DashboardHeader onQuickSaleClick={() => setQuickSaleModalOpen(true)} />
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
