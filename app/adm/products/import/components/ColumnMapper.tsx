'use client';

/**
 * ColumnMapper Component
 * Mapeo de columnas CSV a campos del sistema
 */
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ColumnMapping {
  column: string;
  process: string | string[];
  skipEmpty?: boolean;
  defaultValue?: string;
}

interface Category {
  id: string;
  name: string;
}

interface ColumnMapperProps {
  columns: string[];
  mapping: Record<string, ColumnMapping>;
  onMappingChange: (mapping: Record<string, ColumnMapping>) => void;
  importOptions: {
    skipStockLessThanOne: boolean;
    duplicateAction: 'skip' | 'update' | 'create_with_suffix';
    defaultCategoryId: string;
  };
  onImportOptionsChange: (options: ColumnMapperProps['importOptions']) => void;
  existingCategories: Category[];
}

const SYSTEM_FIELDS = [
  { key: 'name', label: 'Nombre del producto', required: true, process: 'capitalize_trim' },
  { key: 'sku', label: 'SKU (código)', required: false, process: 'uppercase_trim' },
  { key: 'barcode', label: 'Código de barras (EAN)', required: false, process: 'trim' },
  { key: 'description', label: 'Descripción', required: false, process: 'capitalize_trim' },
  { key: 'categoryId', label: 'Categoría', required: false, process: 'capitalize_trim' },
  { key: 'costPrice', label: 'Precio de costo', required: false, process: ['resilient_decimal', 'round_2'] },
  { key: 'salePrice', label: 'Precio de venta', required: false, process: ['resilient_decimal', 'round_2'] },
  { key: 'stock', label: 'Stock inicial', required: false, process: 'round_int' },
  { key: 'minStock', label: 'Stock mínimo', required: false, process: 'round_int' },
  { key: 'location', label: 'Ubicación', required: false, process: 'uppercase_trim' },
];

const PROCESS_FUNCTIONS = [
  { value: 'capitalize_trim', label: 'Capitalizar + Trim' },
  { value: 'uppercase_trim', label: 'Mayúsculas + Trim' },
  { value: 'lowercase_trim', label: 'Minúsculas + Trim' },
  { value: 'trim', label: 'Solo Trim' },
  { value: 'parse_es_number', label: 'Número Español (coma decimal)' },
  { value: 'resilient_decimal', label: 'Número c/decimal (auto)' },
  { value: 'resilient_integer', label: 'Número entero (auto)' },
  { value: 'round_2', label: 'Redondear 2 decimales' },
  { value: 'round_int', label: 'Redondear Entero' },
];

const STORAGE_KEY = 'product-import-mapping';

export function ColumnMapper({
  columns,
  mapping,
  onMappingChange,
  importOptions,
  onImportOptionsChange,
  existingCategories,
}: ColumnMapperProps) {
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Load saved mapping on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedColumns = Object.values(parsed).map((m: unknown) => (m as ColumnMapping).column);
        if (savedColumns.length > 0 && savedColumns.some((c) => columns.includes(c))) {
          onMappingChange(parsed);
        }
      } catch {
        // Ignore parse errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save mapping when it changes (debounced)
  useEffect(() => {
    if (Object.keys(mapping).length === 0) return;

    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
      setSavedMessage('Mapeo guardado automáticamente');
      setTimeout(() => setSavedMessage(null), 1000);
    }, 500);

    return () => clearTimeout(timer);
     
  }, [mapping]);

  const updateFieldMapping = (fieldKey: string, updates: Partial<ColumnMapping>) => {
    onMappingChange({
      ...mapping,
      [fieldKey]: {
        ...(mapping[fieldKey] || { column: '', process: 'capitalize_trim' }),
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Global Options */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
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
                Omitir stock &lt; 1
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="duplicateAction" className="text-sm text-muted-foreground">Duplicados:</Label>
              <Select
                value={importOptions.duplicateAction}
                onValueChange={(value) =>
                  onImportOptionsChange({
                    ...importOptions,
                    duplicateAction: value as 'skip' | 'update' | 'create_with_suffix',
                  })
                }
              >
                <SelectTrigger id="duplicateAction" className="w-[140px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Omitir</SelectItem>
                  <SelectItem value="update">Actualizar</SelectItem>
                  <SelectItem value="create_with_suffix">Sufijo (2)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="defaultCategory" className="text-sm text-muted-foreground">Categoría:</Label>
              <Select
                value={importOptions.defaultCategoryId}
                onValueChange={(value) =>
                  onImportOptionsChange({
                    ...importOptions,
                    defaultCategoryId: value,
                  })
                }
              >
                <SelectTrigger id="defaultCategory" className="w-[160px] h-8 text-sm">
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
          </div>
        </CardContent>
      </Card>

      {/* Field Mapping */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Mapeo de columnas</CardTitle>
          {savedMessage && (
            <Badge variant="outline" className="text-green-600">
              {savedMessage}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Campo del sistema</TableHead>
                <TableHead className="w-[200px]">Columna CSV</TableHead>
                <TableHead className="w-[180px]">Procesamiento</TableHead>
                <TableHead className="w-[150px]">Valor por defecto</TableHead>
                <TableHead className="w-[120px]">Omitir si vacío</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SYSTEM_FIELDS.map((field) => {
                const fieldMapping = mapping[field.key] || {
                  column: '',
                  process: field.process,
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
                      <Select
                        value={fieldMapping.column || '_none'}
                        onValueChange={(value) =>
                          updateFieldMapping(field.key, {
                            column: value === '_none' ? '' : value,
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="No disponible" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">No disponible</SelectItem>
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
                        value={Array.isArray(fieldMapping.process) ? fieldMapping.process[0] : fieldMapping.process}
                        onValueChange={(value) =>
                          updateFieldMapping(field.key, { process: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROCESS_FUNCTIONS.map((fn) => (
                            <SelectItem key={fn.value} value={fn.value}>
                              {fn.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {Array.isArray(fieldMapping.process) && (
                        <span className="text-xs text-muted-foreground mt-1 block">
                          +{fieldMapping.process.length - 1} más
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={fieldMapping.defaultValue || ''}
                        onChange={(e) =>
                          updateFieldMapping(field.key, {
                            defaultValue: e.target.value,
                          })
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={fieldMapping.skipEmpty || false}
                          onChange={(e) =>
                            updateFieldMapping(field.key, {
                              skipEmpty: e.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>
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
