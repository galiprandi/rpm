"use client";

// React Compiler skips this component because useReactTable returns non-memoizable functions
// This is expected behavior from TanStack Table - see: https://tanstack.com/table/latest/docs/faq
"use no memo";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  type FilterFn,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataTableAction {
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "secondary"
    | "destructive"
    | "link";
  icon?: React.ComponentType<{ className?: string }>;
}

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableGlobalFilter?: boolean;
  globalFilterPlaceholder?: string;
  emptyMessage?: string;
  externalGlobalFilter?: string;
  onExternalGlobalFilterChange?: (value: string) => void;
  footerPlaceholder?: React.ReactNode;
  pageSize?: number;
  headerActions?: DataTableAction[];
  title?: React.ReactNode;
  rowActions?: (row: TData) => React.ReactNode;
  filterFn?: FilterFn<TData>;
  getRowId?: (row: TData) => string;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selection: any[]) => void;
  rowSelection?: Record<string, boolean>;
  onRowSelectionStateChange?: (selection: Record<string, boolean>) => void;
}
export function DataTable<TData>({
  data,
  columns,
  enableGlobalFilter = false,
  globalFilterPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron registros",
  externalGlobalFilter,
  onExternalGlobalFilterChange,
  footerPlaceholder,
  pageSize = 20,
  headerActions,
  title,
  rowActions,
  filterFn,
  getRowId,
  enableRowSelection = false,
  onRowSelectionChange,
  rowSelection: externalRowSelection,
  onRowSelectionStateChange,
}: DataTableProps<TData>) {
  // Build columns with optional actions and selection columns
  const allColumns = React.useMemo(() => {
    let result = [...columns];

    if (enableRowSelection) {
      result = [
        {
          id: "selection",
          header: ({ table }) => (
            <div className="px-1">
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                  table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Seleccionar todos"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-1">
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Seleccionar fila"
              />
            </div>
          ),
          size: 40,
        } as ColumnDef<TData>,
        ...result,
      ];
    }

    if (rowActions) {
      result = [
        ...result,
        {
          id: "actions",
          header: "",
          size: 1,
          cell: ({ row }) => (
            <div className="flex justify-end">{rowActions(row.original)}</div>
          ),
        } as ColumnDef<TData>,
      ];
    }

    return result;
  }, [columns, rowActions, enableRowSelection]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });
  const [internalRowSelection, setInternalRowSelection] = React.useState<
    Record<string, boolean>
  >({});

  const rowSelectionValue = externalRowSelection ?? internalRowSelection;
  const setRowSelectionValue = React.useCallback(
    (updaterOrValue: any) => {
      const nextValue =
        typeof updaterOrValue === "function"
          ? updaterOrValue(rowSelectionValue)
          : updaterOrValue;

      if (onRowSelectionStateChange) {
        onRowSelectionStateChange(nextValue);
      } else {
        setInternalRowSelection(nextValue);
      }
    },
    [onRowSelectionStateChange, rowSelectionValue],
  );

  const isControlled = externalGlobalFilter !== undefined;
  const globalFilter = isControlled
    ? externalGlobalFilter
    : internalGlobalFilter;
  const setGlobalFilter =
    isControlled && onExternalGlobalFilterChange
      ? onExternalGlobalFilterChange
      : setInternalGlobalFilter;

  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      sorting,
      globalFilter: enableGlobalFilter ? globalFilter : undefined,
      columnFilters,
      pagination,
      rowSelection: rowSelectionValue,
    },
    enableRowSelection,
    getRowId,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelectionValue,
    globalFilterFn: filterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Notify parent of selection changes (TData[])
  // We use a stable selection string to avoid re-triggering if content hasn't changed
  const selectedRows = React.useMemo(() => {
    if (!enableRowSelection) return [];
    return table.getSelectedRowModel().flatRows.map((row) => row.original);
  }, [rowSelectionValue, table, enableRowSelection]);

  React.useEffect(() => {
    if (onRowSelectionChange) {
      onRowSelectionChange(selectedRows);
    }
  }, [selectedRows, onRowSelectionChange]);

  return (
    <div className="space-y-4">
      {enableGlobalFilter && (
        <div className="grid grid-cols-2 items-center gap-4">
          <div>
            {title && <div className="text-lg font-semibold">{title}</div>}
          </div>
          <div className="flex items-center justify-end gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={globalFilterPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 pr-10 h-9"
              />
              {globalFilter && (
                <button
                  type="button"
                  onClick={() => setGlobalFilter("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {headerActions && headerActions.length > 0 && (
              <div className="flex items-center gap-2">
                {headerActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      onClick={action.onClick}
                      variant={action.variant || "default"}
                      size="sm"
                      className="h-9"
                    >
                      {Icon && <Icon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className="text-left py-3 px-4 font-medium"
                      style={{ width: header.getSize() }}
                    >
                      {canSort ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => header.column.toggleSorting()}
                          className="h-auto p-0 font-medium hover:bg-transparent"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <span className="ml-2">
                            {isSorted === "asc" && (
                              <ArrowUp className="h-3 w-3" />
                            )}
                            {isSorted === "desc" && (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {!isSorted && (
                              <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                            )}
                          </span>
                        </Button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">{footerPlaceholder}</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()} · {table.getFilteredRowModel().rows.length}{" "}
            {table.getFilteredRowModel().rows.length === 1
              ? "registro"
              : "registros"}
          </span>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Primera página"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Primera página</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Página anterior</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Página siguiente</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                  aria-label="Última página"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Última página</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
