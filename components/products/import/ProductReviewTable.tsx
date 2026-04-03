'use client';

/**
 * ProductReviewTable Component (Refactored)
 * 4 Tabs: Nuevos | Omitidos | Existentes | Categorías
 * Muestra datos validados exactamente como irán a la DB
 */

import { useState, useMemo, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { StatsCards } from './shared/StatsCards';
import type { ColumnDef } from '@tanstack/react-table';
import type { 
  ValidationResult, 
  ProductWithCategoryInput, 
  InvalidRow, 
  DetectedCategory,
  ColumnMapping,
  ImportOptions
} from '@/lib/product-import-schemas';

interface ProductReviewTableProps {
  csvData: {
    headers: string[];
    rows: string[][];
    totalRows: number;
  };
  mapping: Record<string, ColumnMapping>;
  importOptions: ImportOptions;
  existingCategories: Array<{ id: string; name: string }>;
  onValidationComplete?: (result: ValidationResult) => void;
  onCategoryMappingChange?: (categories: DetectedCategory[]) => void;
  autoValidate?: boolean;
}

type TabType = 'new' | 'skipped' | 'existing' | 'categories';

export function ProductReviewTable({
  csvData,
  mapping,
  importOptions,
  existingCategories,
  onValidationComplete,
  onCategoryMappingChange,
  autoValidate = true,
}: ProductReviewTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [categoryMappings, setCategoryMappings] = useState<DetectedCategory[]>([]);

  // Initialize category mappings from validation result
  useEffect(() => {
    if (validationResult?.categories) {
      setCategoryMappings(validationResult.categories);
    }
  }, [validationResult?.categories]);

  // Auto-validate on mount
  useEffect(() => {
    if (autoValidate && csvData.rows.length > 0) {
      handleValidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const payload = {
        csvData,
        mapping,
        importOptions,
      };
      
      console.log('Sending validation payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('/api/import/products/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Validation failed response:', errorText);
        throw new Error(`Validation failed: ${errorText}`);
      }

      const result: ValidationResult = await response.json();
      setValidationResult(result);
      setCategoryMappings(result.categories);
      onValidationComplete?.(result);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Build columns dynamically based on mapped fields
  const productColumns = useMemo<ColumnDef<ProductWithCategoryInput>[]>(() => {
    const mappedFields = Object.entries(mapping)
      .filter(([, config]) => config.column && config.column !== '_none')
      .map(([field]) => field);

    const columns: ColumnDef<ProductWithCategoryInput>[] = [];

    // Add columns in order of mapping
    for (const field of mappedFields) {
      switch (field) {
        case 'name':
          columns.push({
            accessorKey: 'name',
            header: 'Nombre',
            size: 250,
          });
          break;
        case 'sku':
          columns.push({
            accessorKey: 'sku',
            header: 'SKU',
            size: 120,
          });
          break;
        case 'barcode':
          columns.push({
            accessorKey: 'barcode',
            header: 'Código de barras',
            size: 150,
          });
          break;
        case 'categoryId':
          columns.push({
            accessorKey: 'categoryName',
            header: 'Categoría',
            size: 150,
            cell: ({ row }) => {
              const cat = categoryMappings.find(c => c.normalizedName === row.original.categoryId);
              return cat?.finalName || row.original.categoryId;
            },
          });
          break;
        case 'costPrice':
          columns.push({
            accessorKey: 'costPrice',
            header: 'Costo',
            size: 100,
            cell: ({ row }) => {
              const value = row.original.costPrice;
              return value !== undefined
                ? new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                  }).format(value)
                : '-';
            },
          });
          break;
        case 'salePrice':
          columns.push({
            accessorKey: 'salePrice',
            header: 'Venta',
            size: 100,
            cell: ({ row }) => {
              const value = row.original.salePrice;
              return value !== undefined
                ? new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                  }).format(value)
                : '-';
            },
          });
          break;
        case 'stock':
          columns.push({
            accessorKey: 'stock',
            header: 'Stock',
            size: 80,
          });
          break;
        case 'minStock':
          columns.push({
            accessorKey: 'minStock',
            header: 'Stock Mín.',
            size: 100,
          });
          break;
        case 'location':
          columns.push({
            accessorKey: 'location',
            header: 'Ubicación',
            size: 120,
          });
          break;
        case 'description':
          columns.push({
            accessorKey: 'description',
            header: 'Descripción',
            size: 300,
          });
          break;
      }
    }

    return columns;
  }, [mapping, categoryMappings]);

  // Columnas para productos omitidos - exactamente igual que Nuevos pero para InvalidRow
  const skippedColumns = useMemo<ColumnDef<InvalidRow>[]>(() => {
    const mappedFields = Object.entries(mapping)
      .filter(([, config]) => config.column && config.column !== '_none')
      .map(([field]) => field);

    const columns: ColumnDef<InvalidRow>[] = [];

    // Add columns in order of mapping - usar valores transformados
    for (const field of mappedFields) {
      switch (field) {
        case 'name':
          columns.push({
            accessorKey: `transformedData.name`,
            header: 'Nombre',
            size: 250,
            cell: ({ row }) => row.original.transformedData?.name || '-',
          });
          break;
        case 'sku':
          columns.push({
            accessorKey: `transformedData.sku`,
            header: 'SKU',
            size: 120,
            cell: ({ row }) => row.original.transformedData?.sku || '-',
          });
          break;
        case 'barcode':
          columns.push({
            accessorKey: `transformedData.barcode`,
            header: 'Código de barras',
            size: 150,
            cell: ({ row }) => row.original.transformedData?.barcode || '-',
          });
          break;
        case 'categoryId':
          columns.push({
            accessorKey: `transformedData.categoryId`,
            header: 'Categoría',
            size: 150,
            cell: ({ row }) => row.original.transformedData?.categoryId || '-',
          });
          break;
        case 'costPrice':
          columns.push({
            accessorKey: `transformedData.costPrice`,
            header: 'Costo',
            size: 100,
            cell: ({ row }) => {
              const value = row.original.transformedData?.costPrice;
              return value !== undefined && value !== null && value !== ''
                ? new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                  }).format(Number(value))
                : '-';
            },
          });
          break;
        case 'salePrice':
          columns.push({
            accessorKey: `transformedData.salePrice`,
            header: 'Venta',
            size: 100,
            cell: ({ row }) => {
              const value = row.original.transformedData?.salePrice;
              return value !== undefined && value !== null && value !== ''
                ? new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                  }).format(Number(value))
                : '-';
            },
          });
          break;
        case 'stock':
          columns.push({
            accessorKey: `transformedData.stock`,
            header: 'Stock',
            size: 80,
            cell: ({ row }) => row.original.transformedData?.stock || '-',
          });
          break;
        case 'minStock':
          columns.push({
            accessorKey: `transformedData.minStock`,
            header: 'Stock Mín.',
            size: 100,
            cell: ({ row }) => row.original.transformedData?.minStock || '-',
          });
          break;
        case 'location':
          columns.push({
            accessorKey: `transformedData.location`,
            header: 'Ubicación',
            size: 120,
            cell: ({ row }) => row.original.transformedData?.location || '-',
          });
          break;
        case 'description':
          columns.push({
            accessorKey: `transformedData.description`,
            header: 'Descripción',
            size: 300,
            cell: ({ row }) => row.original.transformedData?.description || '-',
          });
          break;
      }
    }

    // SIN columna "Motivo" - solo columnas mapeadas como las demás tabs
    return columns;
  }, [mapping]);

  // Tab counts
  const counts = useMemo(() => {
    if (!validationResult) return { new: 0, skipped: 0, existing: 0, categories: 0 };
    return {
      new: validationResult.valid.length,
      skipped: validationResult.invalid.length,
      existing: 0, // TODO: Implement duplicate detection
      categories: validationResult.categories.length,
    };
  }, [validationResult]);

  // Tab data
  const tabData = useMemo(() => {
    if (!validationResult) {
      return {
        new: [],
        skipped: [],
        existing: [],
        categories: [],
      };
    }
    return {
      new: validationResult.valid,
      skipped: validationResult.invalid,
      existing: [], // TODO: Implement duplicate detection
      categories: categoryMappings,
    };
  }, [validationResult, categoryMappings]);

  const handleCategoryRename = (detectedName: string, newName: string) => {
    const updated = categoryMappings.map(cat =>
      cat.detectedName === detectedName ? { ...cat, finalName: newName } : cat
    );
    setCategoryMappings(updated);
    onCategoryMappingChange?.(updated);
  };

  const handleCategoryReassign = (detectedName: string, targetId?: string) => {
    const updated: DetectedCategory[] = categoryMappings.map(cat => {
      if (cat.detectedName === detectedName) {
        return {
          ...cat,
          action: targetId ? 'map' : 'create',
          targetCategoryId: targetId
        } as DetectedCategory;
      }
      return cat;
    });
    setCategoryMappings(updated);
    onCategoryMappingChange?.(updated);
  };

  if (isValidating) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Validando productos contra la base de datos...</p>
        </div>
      </Card>
    );
  }

  if (!validationResult) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Haz clic en validar para revisar los productos</p>
          <Button onClick={handleValidate}>Validar Productos</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary - Tabs con badges */}
      <div className="flex flex-wrap gap-2 justify-between">
        <div
          className={`cursor-pointer transition-colors flex flex-col items-center gap-1 min-w-0 flex-1 ${activeTab === 'new' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
          onClick={() => setActiveTab('new')}
        >
          <Badge 
            variant="outline" 
            className={`bg-green-100 text-green-800 border-green-200 h-6 px-3 font-semibold text-sm ${activeTab === 'new' ? 'ring-2 ring-green-500' : ''}`}
          >
            {counts.new}
          </Badge>
          <span className="text-xs text-gray-500 whitespace-nowrap">Nuevos</span>
        </div>

        <div
          className={`cursor-pointer transition-colors flex flex-col items-center gap-1 min-w-0 flex-1 ${activeTab === 'skipped' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
          onClick={() => setActiveTab('skipped')}
        >
          <Badge 
            variant="outline" 
            className={`bg-red-100 text-red-800 border-red-200 h-6 px-3 font-semibold text-sm ${activeTab === 'skipped' ? 'ring-2 ring-red-500' : ''}`}
          >
            {counts.skipped}
          </Badge>
          <span className="text-xs text-gray-500 whitespace-nowrap">Omitidos</span>
        </div>

        <div
          className={`cursor-pointer transition-colors flex flex-col items-center gap-1 min-w-0 flex-1 ${activeTab === 'existing' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
          onClick={() => setActiveTab('existing')}
        >
          <Badge 
            variant="outline" 
            className={`bg-yellow-100 text-yellow-800 border-yellow-200 h-6 px-3 font-semibold text-sm ${activeTab === 'existing' ? 'ring-2 ring-yellow-500' : ''}`}
          >
            {counts.existing}
          </Badge>
          <span className="text-xs text-gray-500 whitespace-nowrap">Existentes</span>
        </div>

        <div
          className={`cursor-pointer transition-colors flex flex-col items-center gap-1 min-w-0 flex-1 ${activeTab === 'categories' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
          onClick={() => setActiveTab('categories')}
        >
          <Badge 
            variant="outline" 
            className={`bg-blue-100 text-blue-800 border-blue-200 h-6 px-3 font-semibold text-sm ${activeTab === 'categories' ? 'ring-2 ring-blue-500' : ''}`}
          >
            {counts.categories}
          </Badge>
          <span className="text-xs text-gray-500 whitespace-nowrap">Categorías</span>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'new' && (
        <DataTable
          data={tabData.new}
          columns={productColumns}
          title="Productos nuevos a crear"
          globalFilterPlaceholder="Buscar..."
        />
      )}
      {activeTab === 'skipped' && (
        <DataTable
          data={tabData.skipped}
          columns={skippedColumns}
          title="Productos omitidos"
          globalFilterPlaceholder="Buscar..."
        />
      )}
      {activeTab === 'existing' && (
        <DataTable
          data={tabData.existing}
          columns={productColumns}
          title="Productos existentes"
          globalFilterPlaceholder="Buscar..."
        />
      )}

      {activeTab === 'categories' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Mapeo de Categorías</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Categoría detectada</th>
                  <th className="text-left py-2 px-4">Productos</th>
                  <th className="text-left py-2 px-4">Acción</th>
                  <th className="text-left py-2 px-4">Renombrar / Reasignar</th>
                </tr>
              </thead>
              <tbody>
                {tabData.categories.map((cat) => (
                  <tr key={cat.detectedName} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      <div className="font-medium">{cat.detectedName}</div>
                      <div className="text-sm text-muted-foreground">
                        → {cat.finalName}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{cat.count}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={cat.action}
                        onChange={(e) => {
                          const action = e.target.value as 'create' | 'map';
                          if (action === 'create') {
                            handleCategoryReassign(cat.detectedName, undefined);
                          }
                        }}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="create">Crear nueva</option>
                        <option value="map">Mapear a existente</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {cat.action === 'create' ? (
                        <input
                          type="text"
                          value={cat.finalName}
                          onChange={(e) => handleCategoryRename(cat.detectedName, e.target.value)}
                          className="border rounded px-2 py-1 text-sm w-full"
                        />
                      ) : (
                        <select
                          value={cat.targetCategoryId || ''}
                          onChange={(e) => handleCategoryReassign(cat.detectedName, e.target.value || undefined)}
                          className="border rounded px-2 py-1 text-sm w-full"
                        >
                          <option value="">Seleccionar categoría...</option>
                          {existingCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
