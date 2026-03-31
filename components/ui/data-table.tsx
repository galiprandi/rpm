'use client';

import * as React from 'react';
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
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTableAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
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
  actions?: DataTableAction[];
  title?: React.ReactNode;
  compactActions?: boolean;
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
}
export function DataTable<TData>({
  data,
  columns,
  enableGlobalFilter = false,
  globalFilterPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron registros',
  externalGlobalFilter,
  onExternalGlobalFilterChange,
  footerPlaceholder,
  pageSize = 20,
  actions,
  title,
  compactActions = true,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState('');
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const isControlled = externalGlobalFilter !== undefined;
  const globalFilter = isControlled ? externalGlobalFilter : internalGlobalFilter;
  const setGlobalFilter = isControlled && onExternalGlobalFilterChange 
    ? onExternalGlobalFilterChange 
    : setInternalGlobalFilter;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: enableGlobalFilter ? globalFilter : undefined,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      {enableGlobalFilter && (
        <div className="flex items-center justify-between gap-4">
          {title && <div className="text-lg font-semibold">{title}</div>}
          <div className="flex items-center gap-3 w-1/2 justify-end">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={globalFilterPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            {actions && actions.length > 0 && (
              <div className="flex items-center gap-2">
                {actions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      onClick={action.onClick}
                      variant={action.variant || 'default'}
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
                {headerGroup.headers.map((header, headerIndex) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();
                  const isLastColumn = headerIndex === headerGroup.headers.length - 1;

                  return (
                    <th
                      key={header.id}
                      className={`py-3 px-4 font-medium ${isLastColumn && compactActions ? 'text-right w-24' : 'text-left'}`}
                      style={{ width: isLastColumn && compactActions ? 'auto' : header.getSize() }}
                    >
                      {canSort ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => header.column.toggleSorting()}
                          className="h-auto p-0 font-medium hover:bg-transparent"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="ml-2">
                            {isSorted === 'asc' && <ArrowUp className="h-3 w-3" />}
                            {isSorted === 'desc' && <ArrowDown className="h-3 w-3" />}
                            {!isSorted && <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />}
                          </span>
                        </Button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
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
                  className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const isLastCell = cellIndex === row.getVisibleCells().length - 1;
                    return (
                      <td 
                        key={cell.id} 
                        className={`py-3 px-4 ${isLastCell && compactActions ? 'text-right' : ''}`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
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
        <div className="text-sm text-muted-foreground">
          {footerPlaceholder}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {table.getState().pagination.pageIndex + 1}/{table.getPageCount()} · {table.getFilteredRowModel().rows.length} items
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
