'use client';

/**
 * CategoryMapper Component
 * Mapeo de rubros del CSV a categorías del sistema
 */
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, Link2 } from 'lucide-react';

interface CategoryMapping {
  [key: string]: {
    action: 'create' | 'map';
    targetId?: string;
    newName?: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface DetectedCategory {
  key: string;
  name: string;
  count: number;
}

interface CategoryMapperProps {
  detectedCategories: DetectedCategory[];
  existingCategories: Category[];
  mapping: CategoryMapping;
  onMappingChange: (mapping: CategoryMapping) => void;
}

export function CategoryMapper({
  detectedCategories,
  existingCategories,
  mapping,
  onMappingChange,
}: CategoryMapperProps) {
  const [newCategoryNames, setNewCategoryNames] = useState<Record<string, string>>({});

  const handleActionChange = (categoryKey: string, action: 'create' | 'map') => {
    onMappingChange({
      ...mapping,
      [categoryKey]: {
        ...mapping[categoryKey],
        action,
        // Reset other fields when changing action
        targetId: action === 'map' ? existingCategories[0]?.id : undefined,
        newName: action === 'create' ? capitalize(categoryKey) : undefined,
      },
    });
  };

  const handleTargetChange = (categoryKey: string, targetId: string) => {
    onMappingChange({
      ...mapping,
      [categoryKey]: {
        ...mapping[categoryKey],
        targetId,
      },
    });
  };

  const handleNewNameChange = (categoryKey: string, newName: string) => {
    setNewCategoryNames((prev) => ({ ...prev, [categoryKey]: newName }));
    onMappingChange({
      ...mapping,
      [categoryKey]: {
        ...mapping[categoryKey],
        newName,
      },
    });
  };

  const capitalize = (str: string) => {
    return str.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  };

  if (detectedCategories.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-muted-foreground">
          No se detectaron categorías en el archivo CSV.
          <br />
          Los productos se asignarán a la categoría por defecto.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Mapeo de Categorías</h3>
          <p className="text-sm text-muted-foreground">
            {detectedCategories.length} categorías detectadas
          </p>
        </div>
        <Badge variant="outline">
          {detectedCategories.reduce((acc, c) => acc + c.count, 0)} productos
        </Badge>
      </div>

      <div className="space-y-3">
        {detectedCategories.map((category) => {
          const categoryMapping = mapping[category.key] || { action: 'create' };
          const isExisting = existingCategories.some(
            (c) => c.name.toLowerCase() === category.name.toLowerCase()
          );

          return (
            <Card key={category.key} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* Category Info */}
                <div className="md:col-span-1">
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {category.count} productos
                  </div>
                  {isExisting && (
                    <Badge variant="secondary" className="mt-1">
                      <Link2 className="h-3 w-3 mr-1" />
                      Existente
                    </Badge>
                  )}
                </div>

                {/* Action Select */}
                <div className="md:col-span-1">
                  <Label className="text-xs mb-1 block">Acción</Label>
                  <Select
                    value={categoryMapping.action}
                    onValueChange={(value) =>
                      handleActionChange(category.key, value as 'create' | 'map')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create">
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Crear nueva
                        </span>
                      </SelectItem>
                      <SelectItem value="map">
                        <span className="flex items-center gap-2">
                          <Link2 className="h-4 w-4" />
                          Usar existente
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Create New - Name Input */}
                {categoryMapping.action === 'create' && (
                  <div className="md:col-span-2">
                    <Label className="text-xs mb-1 block">Nombre de la nueva categoría</Label>
                    <Input
                      value={categoryMapping.newName || newCategoryNames[category.key] || capitalize(category.name)}
                      onChange={(e) => handleNewNameChange(category.key, e.target.value)}
                      placeholder="Nombre de categoría"
                    />
                  </div>
                )}

                {/* Map Existing - Select Category */}
                {categoryMapping.action === 'map' && (
                  <div className="md:col-span-2">
                    <Label className="text-xs mb-1 block">Categoría existente</Label>
                    <Select
                      value={categoryMapping.targetId || '_none'}
                      onValueChange={(value) =>
                        handleTargetChange(category.key, value === '_none' ? '' : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">-- Seleccionar --</SelectItem>
                        {existingCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
