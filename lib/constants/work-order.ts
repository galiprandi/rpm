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
  { id: "exterior_clean", label: "Limpieza exterior", checked: false },
  { id: "interior_clean", label: "Limpieza interior", checked: false },
  { id: "fluids", label: "Niveles de fluidos", checked: false },
  { id: "tires", label: "Estado de neumáticos", checked: false },
  { id: "lights", label: "Funcionamiento de luces", checked: false },
  { id: "battery", label: "Estado de batería", checked: false },
  { id: "tools", label: "Herramientas y auxilio", checked: false },
  { id: "documents", label: "Documentación", checked: false },
];

export const DEFAULT_EXIT_CHECKLIST = [
  { id: "service_complete", label: "Servicio completado", checked: false },
  { id: "quality_check", label: "Control de calidad", checked: false },
  { id: "test_drive", label: "Prueba de manejo", checked: false },
  { id: "cleaning", label: "Limpieza final", checked: false },
  { id: "parts_returned", label: "Repuestos devueltos", checked: false },
  { id: "tags_removed", label: "Etiquetas removidas", checked: false },
];
