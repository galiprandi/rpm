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

export const DEFAULT_ENTRY_CHECKLIST = [
  { id: "exterior_clean", label: "Limpieza exterior", status: "PENDING" },
  { id: "interior_clean", label: "Limpieza interior", status: "PENDING" },
  { id: "fluids", label: "Niveles de fluidos", status: "PENDING" },
  { id: "tires", label: "Estado de neumáticos", status: "PENDING" },
  { id: "lights", label: "Funcionamiento de luces", status: "PENDING" },
  { id: "battery", label: "Estado de batería", status: "PENDING" },
  { id: "tools", label: "Herramientas y auxilio", status: "PENDING" },
  { id: "documents", label: "Documentación", status: "PENDING" },
];

export const DEFAULT_EXIT_CHECKLIST = [
  { id: "service_complete", label: "Servicio completado", status: "PENDING" },
  { id: "quality_check", label: "Control de calidad", status: "PENDING" },
  { id: "test_drive", label: "Prueba de manejo", status: "PENDING" },
  { id: "cleaning", label: "Limpieza final", status: "PENDING" },
  { id: "parts_returned", label: "Repuestos devueltos", status: "PENDING" },
  { id: "tags_removed", label: "Etiquetas removidas", status: "PENDING" },
];
