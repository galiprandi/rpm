'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Package, Search, Download } from 'lucide-react';
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
  emptyActionText?: string;
  createButtonText: string;
  tableTitle?: string;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  enableExport?: boolean;
  getExportData?: (items: T[]) => Record<string, string>[];
  exportFilename?: string;
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
  emptyActionText = 'Crear primero',
  createButtonText,
  tableTitle = 'Listado',
  enableSearch = true,
  searchPlaceholder = 'Buscar...',
  enableExport = true,
  getExportData,
  exportFilename = 'export.csv',
}: CrudAdminProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('');

  const handleExport = () => {
    if (!items.length) return;
    
    const data = getExportData 
      ? getExportData(items)
      : items.map(item => {
          const flattened: Record<string, string> = {};
          Object.entries(item).forEach(([key, value]) => {
            if (value !== null && typeof value !== 'object') {
              flattened[key] = String(value);
            }
          });
          return flattened;
        });
    
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = exportFilename;
    link.click();
  };

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          {stats && (
            <div className="mt-2">
              <CrudStats stats={stats} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {enableExport && items.length > 0 && (
            <Button
              onClick={handleExport}
              variant="outline"
              className="hidden sm:flex h-10"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
          <Button
            onClick={onCreate}
            variant="default"
            className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2 h-10"
          >
            <Plus className="h-5 w-5 mr-2" />
            {createButtonText}
          </Button>
        </div>
      </div>

      {/* Items Table */}
      <div>
        <div className="flex flex-row items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">{tableTitle}</h2>
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
        </div>
          {items.length > 0 ? (
            <div className="overflow-x-auto -mx-6 px-6">
              <DataTable
                data={items}
                columns={columns}
                enableGlobalFilter={enableSearch}
                globalFilterPlaceholder={searchPlaceholder}
                emptyMessage={emptyMessage}
                externalGlobalFilter={globalFilter}
                onExternalGlobalFilterChange={setGlobalFilter}
              />
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                {emptyIcon || <Package className="h-8 w-8 text-muted-foreground" />}
              </div>
              <p className="text-muted-foreground mb-4">{emptyMessage}</p>
              <Button
                onClick={onCreate}
                variant="default"
                className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                {emptyActionText}
              </Button>
            </div>
          )}
        </div>
    </div>
  );
}
