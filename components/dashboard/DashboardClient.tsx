"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/adm/Header";
import { QuickSaleModal } from "@/components/dashboard/QuickSaleModal";
import { ShoppingCart, Wrench } from "lucide-react";
import { UserRole } from "@/lib/auth/roles-client";

// Poll every 30 seconds instead of on every mount to reduce auth queries
const CASH_STATUS_POLL_INTERVAL = 30000;

export function DashboardClient({
  role = UserRole.STAFF,
  onQuickSaleSuccess,
}: {
  role?: UserRole;
  onQuickSaleSuccess?: () => void;
}) {
  const router = useRouter();
  const [quickSaleModalOpen, setQuickSaleModalOpen] = useState(false);
  const [isCashOpen, setIsCashOpen] = useState<boolean | null>(null);

  // Quick sale (Venta Rápida) is a counter-sales tool — relevant for ADMIN
  // and STAFF. Technicians (USER) don't sell, so they don't get the button
  // nor the cash-status polling that gates it.
  const canQuickSale = role !== UserRole.USER;
  // "Nueva OT" is workshop-facing — useful for everyone, but especially the
  // technician. Keep it for all roles that can reach the dashboard.
  const canCreateOT = true;

  useEffect(() => {
    if (!canQuickSale) return;
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
  }, [canQuickSale]);

  const handleSuccess = () => {
    onQuickSaleSuccess?.();
    // Refresh server data to update cash movements and payment methods
    router.refresh();
    setQuickSaleModalOpen(false);
  };

  const secondaryActions = canCreateOT
    ? [
        {
          label: "Nueva OT",
          onClick: () => router.push("/adm/work-orders/new"),
          icon: Wrench,
          variant: "outline" as const,
        },
      ]
    : undefined;

  const primaryAction = canQuickSale
    ? {
        label: "Venta Rápida",
        onClick: () => setQuickSaleModalOpen(true),
        icon: ShoppingCart,
        disabled: isCashOpen === false,
        title:
          isCashOpen === false
            ? "Debe abrir la caja para realizar ventas"
            : undefined,
      }
    : undefined;

  return (
    <>
      <Header
        title="Dashboard"
        shortTitle="Dash"
        iconOnlyOnMobile
        description="Vista general del sistema"
        secondaryActions={secondaryActions}
        primaryAction={primaryAction}
      />
      {canQuickSale && (
        <QuickSaleModal
          open={quickSaleModalOpen}
          onOpenChange={setQuickSaleModalOpen}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
