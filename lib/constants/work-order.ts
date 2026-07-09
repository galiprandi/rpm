import { Clock, Wrench, CheckCircle2, Package, ClipboardCheck, Wallet, Check } from "lucide-react";

export const WORK_ORDER_STATUSES = [
  {
    id: "CONFIRMED",
    label: "Confirmada",
    color: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
    icon: ClipboardCheck
  },
  {
    id: "WAITING",
    label: "En Espera",
    color: "bg-yellow-50 border-yellow-200",
    textColor: "text-yellow-700",
    icon: Clock
  },
  {
    id: "IN_PROGRESS",
    label: "En Proceso",
    color: "bg-orange-50 border-orange-200",
    textColor: "text-orange-700",
    icon: Wrench
  },
  {
    id: "QC_CHECK",
    label: "Control QC",
    color: "bg-purple-50 border-purple-200",
    textColor: "text-purple-700",
    icon: CheckCircle2
  },
  {
    id: "READY",
    label: "Listo",
    color: "bg-emerald-50 border-emerald-200",
    textColor: "text-emerald-700",
    icon: Package
  },
  {
    id: "PAID",
    label: "Pagado",
    color: "bg-zinc-100 border-zinc-300",
    textColor: "text-zinc-700",
    icon: Wallet
  },
  {
    id: "DELIVERED",
    label: "Entregada",
    color: "bg-zinc-900 border-zinc-950",
    textColor: "text-white",
    icon: Check
  },
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number]["id"];
