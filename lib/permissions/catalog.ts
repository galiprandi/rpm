/**
 * Permission Catalog — Source of truth for all permissions in the system.
 *
 * Used by:
 * 1. Settings UI — iterates to render toggle matrix
 * 2. Backend — validates that requested permissions exist
 * 3. Sidebar — maps permissions to visible sections
 *
 * ADMIN is never included in configurable roles — always has all permissions.
 */

import {
  Package,
  ShoppingCart,
  Wallet,
  Settings,
  type LucideIcon,
} from "lucide-react";

/** A single permission definition */
export interface PermissionDef {
  /** Unique identifier stored in DB and session */
  id: string;
  /** Short label for UI */
  label: string;
  /** Longer description for UI */
  description: string;
}

/** A category grouping related permissions */
export interface PermissionCategory {
  /** Category name for UI section header */
  category: string;
  /** Icon for the category */
  icon: LucideIcon;
  /** Permissions in this category */
  permissions: PermissionDef[];
}

/** Roles that can be configured in the settings UI */
export const CONFIGURABLE_ROLES = [
  { id: "STAFF", label: "Staff" },
  { id: "VENDEDOR", label: "Vendedor" },
] as const;

/** All configurable role IDs as a union type */
export type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number]["id"];

/** The full permission catalog, grouped by category */
export const PERMISSION_CATALOG: PermissionCategory[] = [
  {
    category: "Catálogo",
    icon: Package,
    permissions: [
      {
        id: "can_edit_products",
        label: "Editar productos",
        description: "Crear, editar y desactivar productos (sin costo ni stock)",
      },
      {
        id: "can_edit_costs",
        label: "Editar costos",
        description: "Modificar precios de costo de productos y servicios",
      },
      {
        id: "can_edit_stock",
        label: "Editar stock",
        description: "Ajustar cantidades de stock de productos",
      },
      {
        id: "can_manage_categories",
        label: "Gestionar categorías",
        description: "Crear, editar y desactivar categorías",
      },
      {
        id: "can_manage_services",
        label: "Gestionar servicios",
        description: "Crear y editar servicios (sin costos)",
      },
      {
        id: "can_manage_suppliers",
        label: "Gestionar proveedores",
        description: "Crear, editar y desactivar proveedores",
      },
    ],
  },
  {
    category: "Ventas y Clientes",
    icon: ShoppingCart,
    permissions: [
      {
        id: "can_manage_customers",
        label: "Gestionar clientes",
        description: "Crear, editar y desactivar clientes",
      },
      {
        id: "can_create_sales",
        label: "Crear ventas directas",
        description: "Registrar ventas directas sin OT",
      },
      {
        id: "can_create_credit_notes",
        label: "Crear notas de crédito",
        description: "Emitir notas de crédito por devoluciones",
      },
      {
        id: "can_cancel_credit_notes",
        label: "Cancelar notas de crédito",
        description: "Anular notas de crédito (revierte stock, caja y balance)",
      },
    ],
  },
  {
    category: "Finanzas",
    icon: Wallet,
    permissions: [
      {
        id: "can_manage_cash",
        label: "Gestionar caja",
        description: "Abrir, cerrar caja y registrar movimientos",
      },
      {
        id: "can_approve_inventory",
        label: "Aprobar inventory counts",
        description: "Crear y aprobar recuentos de inventario (ajusta stock)",
      },
    ],
  },
  {
    category: "Administración",
    icon: Settings,
    permissions: [
      {
        id: "can_manage_users",
        label: "Gestionar usuarios",
        description: "Crear, editar y desactivar usuarios del sistema",
      },
      {
        id: "can_manage_settings",
        label: "Configuración global",
        description: "Modificar settings del sistema",
      },
      {
        id: "can_run_maintenance",
        label: "Mantenimiento",
        description: "Recalcular balances y operaciones de mantenimiento",
      },
    ],
  },
];

/** All permission IDs as a flat array */
export const ALL_PERMISSION_IDS: string[] = PERMISSION_CATALOG.flatMap(
  (cat) => cat.permissions.map((p) => p.id),
);

/** Type union of all permission IDs */
export type PermissionId = (typeof ALL_PERMISSION_IDS)[number];

/** Check if a string is a valid permission ID */
export function isValidPermission(id: string): boolean {
  return ALL_PERMISSION_IDS.includes(id);
}

/** Default permissions for each configurable role (seed values) */
export const DEFAULT_PERMISSIONS: Record<ConfigurableRole, string[]> = {
  STAFF: [],
  VENDEDOR: [
    "can_edit_products",
    "can_manage_categories",
    "can_manage_services",
    "can_manage_suppliers",
    "can_manage_customers",
    "can_create_sales",
    "can_create_credit_notes",
    "can_manage_cash",
  ],
};
