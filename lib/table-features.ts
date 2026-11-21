import {
  tableFeatures,
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  createFilteredRowModel,
  createSortedRowModel,
  createPaginatedRowModel,
  filterFns,
  sortFns,
  type ColumnDef as TanStackColumnDef,
  type FilterFn as TanStackFilterFn,
  type CellData,
  type RowData,
} from "@tanstack/react-table";

/**
 * Feature set shared by every table in the app.
 * Keep this static module-level (required by `tableFeatures`) and reuse
 * `ColumnDef`/`FilterFn` below so column definitions stay typed against
 * the features actually registered.
 */
export const appTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns,
  sortFns,
});

export type AppTableFeatures = typeof appTableFeatures;

export type ColumnDef<
  TData extends RowData,
  TValue extends CellData = CellData,
> = TanStackColumnDef<AppTableFeatures, TData, TValue>;

export type FilterFn<TData extends RowData> = TanStackFilterFn<
  AppTableFeatures,
  TData
>;
