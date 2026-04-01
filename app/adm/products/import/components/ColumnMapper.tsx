'use client';

/**
 * ColumnMapper Component
 * Mapeo de columnas CSV a campos del sistema
 */
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ColumnMapping {
  column: string;
  process: string;
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
  { key: 'name', label: 'Nombre', required: true, process: 'capitalize_trim' },
  { key: 'code', label: 'Código (SKU)', required: false, process: 'uppercase_trim' },
  { key: 'barcode', label: 'Código de Barras', required: false, process: 'trim' },
  { key: 'categoryId', label: 'Categoría', required: false, process: 'capitalize_trim' },
  { key: 'costPrice', label: 'Precio Costo', required: false, process: 'parse_es_number' },
  { key: 'wholesalePrice', label: 'Precio Mayorista', required: false, process: 'parse_es_number' },
  { key: 'retailPrice', label: 'Precio Venta', required: false, process: 'parse_es_number' },
  { key: 'stock', label: 'Stock', required: false, process: 'round_int' },
];

const PROCESS_FUNCTIONS = [
  { value: 'capitalize_trim', label: 'Capitalizar + Trim' },
  { value: 'uppercase_trim', label: 'Mayúsculas + Trim' },
  { value: 'lowercase_trim', label: 'Minúsculas + Trim' },
  { value: 'trim', label: 'Solo Trim' },
  { value: 'parse_es_number', label: 'Número Español (coma decimal)' },
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
        // Only use saved mapping if columns match
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapping]);

  const updateFieldMapping = (
    fieldKey: string,
    updates: Partial<ColumnMapping>
  ) => {
    onMappingChange({
      ...mapping,
      [fieldKey]: {
        ...(mapping[fieldKey] || { column: '', process: 'capitalize_trim' }),
        ...updates,
      },
    });
  };

  // Get default category name from ID
  const getDefaultCategoryName = () => {
    if (importOptions.defaultCategoryId === '_none') return 'Sin categoría';
    const cat = existingCategories.find((c) => c.id === importOptions.defaultCategoryId);
    return cat?.name || 'Sin categoría';
  };

  return (
    <div className="space-y-6">
      {/* Global Options */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">Opciones de Importación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
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
            <Label htmlFor="skipStock" className="cursor-pointer">
              Omitir productos con stock &lt; 1
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duplicateAction">Acción con duplicados</Label>
            <Select
              value={importOptions.duplicateAction}
              onValueChange={(value) =>
                onImportOptionsChange({
                  ...importOptions,
                  duplicateAction: value as 'skip' | 'update' | 'create_with_suffix',
                })
              }
            >
              <SelectTrigger id="duplicateAction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skip">Omitir duplicados</SelectItem>
                <SelectItem value="update">Actualizar existentes</SelectItem>
                <SelectItem value="create_with_suffix">Crear con sufijo (2)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultCategory">Categoría por defecto</Label>
            <Select
              value={importOptions.defaultCategoryId}
              onValueChange={(value) =>
                onImportOptionsChange({
                  ...importOptions,
                  defaultCategoryId: value,
                })
              }
            >
              <SelectTrigger id="defaultCategory">
                <SelectValue placeholder="Seleccionar categoría..." />
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
            <p className="text-xs text-muted-foreground">
              Se usará &quot;{getDefaultCategoryName()}&quot; cuando no haya categoría asignada
            </p>
          </div>
        </div>
      </Card>

      {/* Field Mapping */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Mapeo de Columnas</h3>
          {savedMessage && (
            <Badge variant="outline" className="text-green-600">
              {savedMessage}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {SYSTEM_FIELDS.map((field) => {
            const fieldMapping = mapping[field.key] || {
              column: '',
              process: field.process,
              skipEmpty: false,
              defaultValue: '',
            };

            return (
              <Card key={field.key} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                  {/* Field Label */}
                  <div className="md:col-span-1">
                    <Label className="font-medium">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                  </div>

                  {/* Column Select */}
                  <div className="md:col-span-1">
                    <Select
                      value={fieldMapping.column || '_none'}
                      onValueChange={(value) =>
                        updateFieldMapping(field.key, {
                          column: value === '_none' ? '' : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar columna..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">-- No mapear --</SelectItem>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Process Function */}
                  <div className="md:col-span-1">
                    <Select
                      value={fieldMapping.process}
                      onValueChange={(value) =>
                        updateFieldMapping(field.key, { process: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Procesamiento..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PROCESS_FUNCTIONS.map((fn) => (
                          <SelectItem key={fn.value} value={fn.value}>
                            {fn.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Default Value */}
                  <div className="md:col-span-1">
                    <Input
                      placeholder="Valor por defecto"
                      value={fieldMapping.defaultValue || ''}
                      onChange={(e) =>
                        updateFieldMapping(field.key, {
                          defaultValue: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Skip Empty */}
                  <div className="md:col-span-1 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`skip-${field.key}`}
                      checked={fieldMapping.skipEmpty || false}
                      onChange={(e) =>
                        updateFieldMapping(field.key, {
                          skipEmpty: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`skip-${field.key}`} className="cursor-pointer text-sm">
                      Omitir si vacío
                    </Label>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
