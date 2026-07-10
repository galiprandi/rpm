"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/adm/Header";
import { QuickSaleModal } from "@/components/dashboard/QuickSaleModal";
import { ShoppingCart, Wrench } from "lucide-react";

// Poll every 30 seconds instead of on every mount to reduce auth queries
const CASH_STATUS_POLL_INTERVAL = 30000;

export function DashboardClient({
  onQuickSaleSuccess,
}: {
  onQuickSaleSuccess?: () => void;
}) {
  const router = useRouter();
  const [quickSaleModalOpen, setQuickSaleModalOpen] = useState(false);
  const [isCashOpen, setIsCashOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const checkCashStatus = async () => {
      try {
        const res = await fetch("/api/cash/status");
        if (res.ok) {
          const data = await res.json();
          setIsCashOpen(data.status === "OPEN");
        }
      } catch (error) {
        console.error("Error checking cash status:", error);
      }
    };

    // Initial check on mount
    checkCashStatus();

    // Set up polling interval to reduce auth queries vs checking on every mount
    const interval = setInterval(checkCashStatus, CASH_STATUS_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

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
        secondaryActions={[
          {
            label: "Nueva OT",
            onClick: () => router.push("/adm/work-orders/new"),
            icon: Wrench,
            variant: "outline",
          },
        ]}
        primaryAction={{
          label: "Venta Rápida",
          onClick: () => setQuickSaleModalOpen(true),
          icon: ShoppingCart,
          disabled: isCashOpen === false,
          title:
            isCashOpen === false
              ? "Debe abrir la caja para realizar ventas"
              : undefined,
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
