'use client';

import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PriceDisplay } from '@/components/ui/price-display';
import { StockDisplay } from '@/components/ui/stock-display';
import { DataTable } from '@/components/ui/data-table';
import {
  Search,
  Edit2,
  Trash2,
} from 'lucide-react';

import { type Product } from './types';

interface ProductTableProps {
  products: Product[];
  search: string;
  onSearchChange: (search: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductTable({ 
  products, 
  search, 
  onSearchChange, 
  onEdit, 
  onDelete 
}: ProductTableProps) {
  // Definición de columnas para DataTable
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'barcode',
        header: 'EAN/Código',
        cell: ({ row }) => {
          const barcode = row.original.barcode;
          return barcode ? (
            <span className="font-mono text-xs">{barcode}</span>
          ) : (
            <span className="text-xs text-muted-foreground italic">Sin EAN</span>
          );
        },
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.sku}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Producto',
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div>
              <div className="font-medium">{product.name}</div>
              {product.description && (
                <div className="text-xs text-muted-foreground">
                  {product.description.substring(0, 60)}...
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'category.name',
        header: 'Categoría',
        cell: ({ row }) => {
          const category = row.original.category;
          return category ? (
            <Badge 
              variant="secondary"
              style={{ backgroundColor: category.color || undefined }}
            >
              {category.name}
            </Badge>
          ) : null;
        },
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }) => (
          <div className="text-right">
            <StockDisplay stock={row.original.stock} minStock={row.original.minStock} />
          </div>
        ),
      },
      {
        accessorKey: 'replacementCost',
        header: 'Costo de reposición',
        cell: ({ row }) => (
          <div className="text-right font-medium">
            <PriceDisplay value={row.original.replacementCost} />
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex justify-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(product)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete]
  );

  return (
    <div>
      <div className="relative w-[300px] mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por EAN, nombre o SKU..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <DataTable
        data={products}
        columns={columns}
        enableGlobalFilter
        globalFilterPlaceholder="Buscar por EAN, nombre o SKU..."
        emptyMessage="No se encontraron productos"
        externalGlobalFilter={search}
        onExternalGlobalFilterChange={onSearchChange}
      />
    </div>
  );
}
