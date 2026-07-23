"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Plus, Package } from "lucide-react";
import { ReactNode } from "react";
import { CrudStats, StatItem } from "./CrudStats";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef, type FilterFn } from "@tanstack/react-table";

interface CrudAdminProps<T extends { id: string }> {
  title?: string;
  description?: string;
  items: T[];
  loading: boolean;
  onCreate?: () => void;
  hideCreateAction?: boolean;
  columns: ColumnDef<T>[];
  stats?: StatItem[];
  filterFn?: FilterFn<T>;
  headerFilter?: ReactNode;
  emptyIcon?: ReactNode;
  emptyMessage: string;
  emptyActionText?: string;
  createButtonText: string;
  tableTitle?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  enableExport?: boolean;
  getExportData?: (items: T[]) => Record<string, string>[];
  exportFilename?: string;
  rowActions?: (item: T) => React.ReactNode;
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "outline" | "ghost" | "secondary";
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  onExport?: () => void;
  externalGlobalFilter?: string;
  onExternalGlobalFilterChange?: (value: string) => void;
  /**
   * When true, indicates the parent is actively filtering items (search term,
   * category, etc.) so the empty state with CTA is suppressed in favor of
   * rendering the DataTable (which keeps the search input visible and shows
   * its own "no results" row). Defaults to false.
   */
  hasActiveFilters?: boolean;
}

export function CrudAdmin<T extends { id: string }>({
  title,
  description,
  items,
  loading,
  onCreate,
  hideCreateAction = false,
  columns,
  stats,
  filterFn,
  headerFilter,
  emptyIcon,
  emptyMessage,
  emptyActionText = "Crear primero",
  createButtonText,
  tableTitle = "Listado",
  enableSearch = true,
  searchPlaceholder = "Buscar...",
  enableExport = true,
  getExportData,
  exportFilename = "export.csv",
  rowActions,
  secondaryActions,
  onExport,
  externalGlobalFilter,
  onExternalGlobalFilterChange,
  hasActiveFilters = false,
}: CrudAdminProps<T>) {
  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }

    if (!items.length) return;

    const data = getExportData
      ? getExportData(items)
      : items.map((item) => {
          const flattened: Record<string, string> = {};
          Object.entries(item).forEach(([key, value]) => {
            if (value !== null && typeof value !== "object") {
              flattened[key] = String(value);
            }
          });
          return flattened;
        });

    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => `"${String(row[h] || "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = exportFilename;
    link.click();
  };

  const headerActions = [...(secondaryActions || [])];

  const createAction = onCreate
    ? {
        label: createButtonText,
        onClick: onCreate,
        variant: "default" as const,
        icon: Plus,
      }
    : null;

  const exportAction = {
    label: "Exportar",
    onClick: handleExport,
    variant: "outline" as const,
    icon: Download,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="mt-10 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 p-4 border-b">
              <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-4 flex-1" />
                ))}
              </div>
            </div>
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="p-4 border-b last:border-0 flex gap-4 items-center"
              >
                {[1, 2, 3, 4].map((col) => (
                  <Skeleton key={col} className="h-10 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasHeader = title || description || stats || headerActions.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      {hasHeader && (
        <div className="flex justify-between items-start">
          <div>
            {title && (
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            )}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
            {stats && (
              <div className="mt-2">
                <CrudStats stats={stats} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || "default"}
                className={
                  (action.variant || "default") === "default"
                    ? "bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold"
                    : undefined
                }
              >
                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className={hasHeader ? "mt-10" : ""}>
        {items.length > 0 || hasActiveFilters ? (
          <div className="overflow-x-auto -mx-6 px-6">
            <DataTable
              data={items}
              columns={columns}
              title={tableTitle}
              enableGlobalFilter={enableSearch}
              globalFilterPlaceholder={searchPlaceholder}
              emptyMessage={emptyMessage}
              filterFn={filterFn}
              headerFilter={headerFilter}
          externalGlobalFilter={externalGlobalFilter}
          onExternalGlobalFilterChange={onExternalGlobalFilterChange}
              headerActions={[
                ...(enableExport && items.length > 0 ? [exportAction] : []),
                ...(createAction && !hideCreateAction ? [createAction] : []),
              ]}
              rowActions={rowActions}
            />
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              {emptyIcon || (
                <Package className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <p className="text-muted-foreground mb-4">{emptyMessage}</p>
            {onCreate && (
              <Button
                onClick={onCreate}
                variant="default"
                className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                {emptyActionText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
