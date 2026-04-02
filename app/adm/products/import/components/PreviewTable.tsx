'use client';

/**
 * PreviewTable Component
 * Muestra una previsualización de cómo quedarán los registros procesados usando DataTable
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';

interface ColumnMapping {
  column: string;
  process: string;
  skipEmpty?: boolean;
  defaultValue?: string;
}

interface PreviewProduct {
  rowIndex: number;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  costPrice?: number;
  salePrice?: number;
  stock?: number;
  minStock?: number;
  location?: string;
  categoryName: string;
}

interface PreviewTableProps {
  previewData: PreviewProduct[];
  totalRows: number;
  mapping: Record<string, ColumnMapping>;
}

export function PreviewTable({ previewData, totalRows, mapping }: PreviewTableProps) {
  // Get mapped fields info
  const mappedFields = Object.entries(mapping)
    .filter(([, config]) => config.column)
    .map(([field, config]) => ({
      field,
      sourceColumn: config.column,
      process: config.process,
    }));

  // Define columns for DataTable
  const columns: ColumnDef<PreviewProduct>[] = [
    {
      accessorKey: 'rowIndex',
      header: '#',
      size: 60,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">{row.original.rowIndex}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      size: 250,
      cell: ({ row }) => (
        <span className="font-medium max-w-[250px] truncate block" title={row.original.name}>
          {row.original.name || (
            <span className="text-muted-foreground italic">Sin nombre</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      size: 120,
      cell: ({ row }) => (
        <span className="text-xs">{row.original.sku || '-'}</span>
      ),
    },
    {
      accessorKey: 'costPrice',
      header: 'Precio Costo',
      size: 120,
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.costPrice !== undefined
            ? new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
              }).format(row.original.costPrice)
            : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'salePrice',
      header: 'Precio Venta',
      size: 120,
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.salePrice !== undefined
            ? new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
              }).format(row.original.salePrice)
            : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      size: 80,
      cell: ({ row }) => (
        <span className="text-xs">{row.original.stock ?? '-'}</span>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: 'Categoría',
      size: 150,
      cell: ({ row }) => (
        <span className="text-xs max-w-[150px] truncate block" title={row.original.categoryName}>
          {row.original.categoryName || (
            <span className="text-muted-foreground">Sin categoría</span>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Vista previa del mapeo</h3>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            {previewData.length} de {totalRows} registros
          </Badge>
          <Badge variant="outline">
            {mappedFields.length} campos mapeados
          </Badge>
        </div>
      </div>

      {/* DataTable Preview */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={previewData}
            columns={columns}
            pageSize={20}
            enableGlobalFilter={true}
            globalFilterPlaceholder="Buscar productos..."
            emptyMessage="No hay datos para mostrar. Asegúrate de haber mapeado al menos el campo 'nombre'."
            footerPlaceholder="Vista previa con paginación. Los valores pueden variar según la configuración de categorías."
          />
        </CardContent>
      </Card>
    </div>
  );
}
