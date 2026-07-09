"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const sections = [
  "dashboard",
  "products",
  "customers",
  "suppliers",
  "services",
  "categories",
  "work-orders",
  "vehicles",
  "invoices",
  "direct-sales",
  "price-lists",
  "purchase-vouchers",
  "credit-notes",
  "cash",
  "operations",
  "users",
  "settings",
  "reports",
] as const;

const sectionPaths: Record<string, string> = {
  dashboard: "/adm",
  products: "/adm/products",
  customers: "/adm/customers",
  suppliers: "/adm/suppliers",
  services: "/adm/services",
  categories: "/adm/categories",
  "work-orders": "/adm/work-orders",
  vehicles: "/adm/vehicles",
  invoices: "/adm/invoices",
  "direct-sales": "/adm/direct-sales",
  "price-lists": "/adm/price-lists",
  "purchase-vouchers": "/adm/purchase-vouchers",
  "credit-notes": "/adm/credit-notes",
  cash: "/adm/cash",
  operations: "/adm/operations",
  users: "/adm/users",
  settings: "/adm/settings",
  reports: "/adm/reports",
};

export function WebMCPNavTools() {
  const router = useRouter();

  useEffect(() => {
    const mc = document.modelContext;
    if (!mc) {
      console.log("[WebMCP] navigation tools not available");
      return;
    }

    const controller = new AbortController();
    let registered = false;

    mc.registerTool(
      {
        name: "navigate_to_section",
        description:
          "Navega a una sección del panel de administración. Úsala cuando el usuario pide ir a una página específica como productos, clientes, órdenes de trabajo, etc.",
        inputSchema: {
          type: "object",
          properties: {
            section: {
              type: "string",
              enum: sections,
              description: "Sección a la que navegar",
            },
          },
          required: ["section"],
        },
        annotations: {
          readOnlyHint: true,
          untrustedContentHint: false,
        },
        execute: async ({ section }) => {
          const path = sectionPaths[section as string];
          if (!path) {
            throw new Error(`Sección desconocida: ${section}`);
          }
          router.push(path);
          return `Navegando a la sección: ${section}`;
        },
      },
      { signal: controller.signal },
    )
      .then(() => {
        registered = true;
        console.log("[WebMCP] registered tool: navigate_to_section");
      })
      .catch((e) => {
        if (e?.name === "AbortError" || e?.message?.includes("aborted")) return;
        console.error("[WebMCP] failed to register navigation tool:", e);
      });

    return () => {
      if (!registered) controller.abort();
    };
  }, [router]);

  return null;
}
