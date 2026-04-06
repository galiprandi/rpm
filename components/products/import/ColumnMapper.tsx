'use client';

/**
 * ColumnMapper Component (Refactored)
 * Estructura: Campos DB → Columnas CSV
 * Transformaciones simplificadas por tipo de dato
 */

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ColumnMapping, ImportOptions } from '@/lib/product-import-schemas';

// Types
interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

type FieldType = 'string' | 'decimal' | 'integer' | 'category';

interface DBField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  defaultTransform: string;
}

// DB Fields configuration (source of truth)
const DB_FIELDS: DBField[] = [
  { key: 'name', label: 'Nombre', type: 'string', required: true, defaultTransform: 'capitalize' },
  { key: 'sku', label: 'SKU / Código', type: 'string', required: false, defaultTransform: 'uppercase' },
  { key: 'barcode', label: 'Código de barras', type: 'string', required: false, defaultTransform: 'trim' },
  { key: 'description', label: 'Descripción', type: 'string', required: false, defaultTransform: 'capitalize' },
  { key: 'costPrice', label: 'Precio de costo', type: 'decimal', required: false, defaultTransform: 'spanish' },
  { key: 'replacementCost', label: 'Costo de reposición', type: 'decimal', required: false, defaultTransform: 'spanish' },
  { key: 'stock', label: 'Stock inicial', type: 'integer', required: false, defaultTransform: 'round' },
  { key: 'minStock', label: 'Stock mínimo', type: 'integer', required: false, defaultTransform: 'round' },
  { key: 'location', label: 'Ubicación', type: 'string', required: false, defaultTransform: 'uppercase' },
  { key: 'categoryId', label: 'Categoría', type: 'category', required: false, defaultTransform: 'capitalize' },
];

// Transform options by type
const TRANSFORM_OPTIONS: Record<FieldType, { value: string; label: string }[]> = {
  string: [
    { value: 'capitalize', label: 'Capitalizar' },
    { value: 'uppercase', label: 'Mayúsculas' },
    { value: 'lowercase', label: 'Minúsculas' },
    { value: 'trim', label: 'Solo trim' },
  ],
  decimal: [
    { value: 'spanish', label: 'Formato español (1.234,56)' },
    { value: 'english', label: 'Formato inglés (1,234.56)' },
  ],
  integer: [
    { value: 'round', label: 'Redondear entero' },
  ],
  category: [
    { value: 'capitalize', label: 'Capitalizar + fuzzy match' },
  ],
};

// const STORAGE_KEY = 'product-import-mapping-v2';

// Props
interface ColumnMapperProps {
  columns: string[];
  mapping: Record<string, ColumnMapping>;
  onMappingChange: (mapping: Record<string, ColumnMapping>) => void;
  importOptions: ImportOptions;
  onImportOptionsChange: (options: ImportOptions) => void;
  existingCategories: Category[];
  existingSuppliers: Supplier[];
}

export function ColumnMapper({
  columns,
  mapping,
  onMappingChange,
  importOptions,
  onImportOptionsChange,
  existingCategories,
  existingSuppliers,
}: ColumnMapperProps) {
  // Load saved mapping on mount - DESACTIVADO
  useEffect(() => {
    // SIN LOCALSTORAGE - Estado solo en memoria
  }, [columns, onMappingChange, onImportOptionsChange]);

  // Save mapping when it changes (debounced) - DESACTIVADO
  useEffect(() => {
    // SIN LOCALSTORAGE - Estado solo en memoria
    // if (Object.keys(mapping).length === 0) return;

    // const timer = setTimeout(() => {
    //   localStorage.setItem(
    //     'product-import-mapping-v2',
    //     JSON.stringify({ mapping, importOptions })
    //   );
    //   toast.success('Configuración guardada', { duration: 2000 });
    // }, 1000);

    // return () => clearTimeout(timer);
  }, [mapping, importOptions]);

  const updateFieldMapping = (fieldKey: string, updates: Partial<ColumnMapping>) => {
    const field = DB_FIELDS.find((f) => f.key === fieldKey);
    if (!field) return;

    onMappingChange({
      ...mapping,
      [fieldKey]: {
        ...mapping[fieldKey],
        column: updates.column || mapping[fieldKey]?.column || '',
        transform: updates.transform || mapping[fieldKey]?.transform || field.defaultTransform,
        skipEmpty: updates.skipEmpty !== undefined ? updates.skipEmpty : (mapping[fieldKey]?.skipEmpty || false),
        defaultValue: updates.defaultValue || mapping[fieldKey]?.defaultValue || '',
      },
    });
  };

  const getMappedFieldCount = () => {
    return Object.values(mapping).filter((m) => m.column && m.column !== '_none').length;
  };

  return (
    <div className="space-y-6">
      {/* Global Options */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Opciones de importación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros y Validación */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Filtros y Validación</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skipStock"
                  checked={importOptions.skipStockLessThanOne}
                  onChange={(e) =>
                    onImportOptionsChange({
                      ...importOptions,
                      skipStockLessThanOne: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="skipStock" className="cursor-pointer text-sm">
                  Omitir productos con stock &lt; 1
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Acción con duplicados:</Label>
                <Select
                  value={importOptions.duplicateAction}
                  onValueChange={(value) =>
                    onImportOptionsChange({
                      ...importOptions,
                      duplicateAction: value as 'skip' | 'create_with_suffix',
                    })
                  }
                >
                  <SelectTrigger className="w-[160px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Omitir</SelectItem>
                    <SelectItem value="create_with_suffix">Agregar sufijo (2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Valores por Defecto */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Valores por Defecto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground min-w-[120px]">Categoría:</Label>
                <Select
                  value={importOptions.defaultCategoryId || '_none'}
                  onValueChange={(value) =>
                    onImportOptionsChange({
                      ...importOptions,
                      defaultCategoryId: value === '_none' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="w-[180px] h-8 text-sm">
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin categoría</SelectItem>
                    {existingCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground min-w-[120px]">Proveedor:</Label>
                <Select
                  value={importOptions.defaultSupplierId || '_none'}
                  onValueChange={(value) =>
                    onImportOptionsChange({
                      ...importOptions,
                      defaultSupplierId: value === '_none' ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="w-[180px] h-8 text-sm">
                    <SelectValue placeholder="Sin proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin proveedor</SelectItem>
                    {existingSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Mapping Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Mapeo de campos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Asigna columnas CSV a campos de la base de datos
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {getMappedFieldCount()} de {DB_FIELDS.length} campos mapeados
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Campo DB</TableHead>
                <TableHead className="w-[80px]">Tipo</TableHead>
                <TableHead className="w-[220px]">Columna CSV</TableHead>
                <TableHead className="w-[200px]">Transformación</TableHead>
                <TableHead className="w-[140px]">Valor por defecto</TableHead>
                <TableHead className="w-[100px] text-center">Omitir si vacío</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DB_FIELDS.map((field) => {
                const fieldMapping = mapping[field.key] || {
                  column: '_none',
                  transform: field.defaultTransform,
                  skipEmpty: false,
                  defaultValue: '',
                };

                return (
                  <TableRow key={field.key}>
                    <TableCell>
                      <div className="font-medium">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded bg-muted">
                        {field.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={fieldMapping.column || '_none'}
                        onValueChange={(value) =>
                          updateFieldMapping(field.key, {
                            column: value === '_none' ? '' : value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="No mapear" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">No mapear</SelectItem>
                          {columns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={fieldMapping.transform}
                        onValueChange={(value) =>
                          updateFieldMapping(field.key, { transform: value })
                        }
                        disabled={!fieldMapping.column || fieldMapping.column === '_none'}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRANSFORM_OPTIONS[field.type].map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={fieldMapping.defaultValue || ''}
                        onChange={(e) =>
                          updateFieldMapping(field.key, {
                            defaultValue: e.target.value,
                          })
                        }
                        placeholder="Opcional"
                        className="w-full"
                        disabled={!fieldMapping.column || fieldMapping.column === '_none'}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={fieldMapping.skipEmpty || false}
                        onChange={(e) =>
                          updateFieldMapping(field.key, {
                            skipEmpty: e.target.checked,
                          })
                        }
                        disabled={!fieldMapping.column || fieldMapping.column === '_none'}
                        className="h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
