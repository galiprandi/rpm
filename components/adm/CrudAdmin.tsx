'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Package, Search } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { CrudStats, StatItem } from './CrudStats';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';

interface CrudAdminProps<T extends { id: string }> {
  title: string;
  description: string;
  items: T[];
  loading: boolean;
  onCreate: () => void;
  columns: ColumnDef<T>[];
  stats?: StatItem[];
  emptyIcon?: ReactNode;
  emptyMessage: string;
  createButtonText: string;
  tableTitle?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
}

export function CrudAdmin<T extends { id: string }>({
  title,
  description,
  items,
  loading,
  onCreate,
  columns,
  stats,
  emptyIcon,
  emptyMessage,
  createButtonText,
  tableTitle = 'Listado',
  enableSearch = true,
  searchPlaceholder = 'Buscar...',
}: CrudAdminProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando {title.toLowerCase()}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-4">
          {stats && <CrudStats stats={stats} />}
          <Button
            onClick={onCreate}
            variant="default"
            className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2"
          >
            <Plus className="h-5 w-5 mr-2" />
            {createButtonText}
          </Button>
        </div>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{tableTitle}</CardTitle>
          {enableSearch && items.length > 0 && (
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <DataTable
              data={items}
              columns={columns}
              enableGlobalFilter={enableSearch}
              globalFilterPlaceholder={searchPlaceholder}
              emptyMessage={emptyMessage}
              externalGlobalFilter={globalFilter}
              onExternalGlobalFilterChange={setGlobalFilter}
            />
          ) : (
            <div className="p-8 text-center">
              {emptyIcon || <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />}
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
