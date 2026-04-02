'use client';

/**
 * ProductReviewTable Component (Refactored)
 * 4 Tabs: Nuevos | Omitidos | Existentes | Categorías
 * Muestra datos validados exactamente como irán a la DB
 */

import { useState, useMemo, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle, XCircle, Tag } from 'lucide-react';
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

  const invalidColumns: ColumnDef<InvalidRow>[] = [
    {
      accessorKey: 'rowIndex',
      header: 'Fila',
      size: 70,
    },
    {
      accessorKey: 'reason',
      header: 'Motivo',
      size: 200,
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      size: 200,
      cell: ({ row }) => row.original.rawData?.name || '-',
    },
  ];

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
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-colors ${activeTab === 'new' ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{counts.new}</div>
              <div className="text-sm text-muted-foreground">Nuevos</div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeTab === 'skipped' ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => setActiveTab('skipped')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <div className="text-2xl font-bold">{counts.skipped}</div>
              <div className="text-sm text-muted-foreground">Omitidos</div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeTab === 'existing' ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => setActiveTab('existing')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold">{counts.existing}</div>
              <div className="text-sm text-muted-foreground">Existentes</div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeTab === 'categories' ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <Tag className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{counts.categories}</div>
              <div className="text-sm text-muted-foreground">Categorías</div>
            </div>
          </CardContent>
        </Card>
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
          columns={invalidColumns}
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
