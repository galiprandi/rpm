/**
 * ConfigurationStep Component
 * Paso 2: Configuración de mapeo de columnas y opciones globales
 */

import { useEffect } from 'react';
import { StepActions } from '../shared/StepActions';
import { useImportState } from '@/app/adm/products/import/hooks/useImportState';
import { ColumnMapper } from '../ColumnMapper';

interface ConfigurationStepProps {
  existingCategories: Array<{ id: string; name: string }>;
}

export function ConfigurationStep({ existingCategories }: ConfigurationStepProps) {
  const { fileData, prevStep, nextStep, configuration, setMapping, setOptions } = useImportState();
  const fieldConfig = configuration.mapping;
  const globalOptions = configuration.options;

  // Auto-detect mapping when file is loaded
  useEffect(() => {
    if (fileData?.columns) {
      const columnMappings: Record<string, { field: string; transform: string }> = {
        'PRODUCTO': { field: 'name', transform: 'capitalize' },
        'NOMBRE': { field: 'name', transform: 'capitalize' },
        'RUBRO': { field: 'categoryId', transform: 'capitalize' },
        'CATEGORIA': { field: 'categoryId', transform: 'capitalize' },
        'CODIGO': { field: 'sku', transform: 'uppercase' },
        'CODPROV': { field: 'sku', transform: 'uppercase' },
        'SKU': { field: 'sku', transform: 'uppercase' },
        'BARCODE': { field: 'barcode', transform: 'trim' },
        'COD_BARRA': { field: 'barcode', transform: 'trim' },
        'STOCK': { field: 'stock', transform: 'round' },
        'PRESENTACION': { field: 'description', transform: 'capitalize' },
        'DESCRIPCION': { field: 'description', transform: 'capitalize' },
        'PRECIO COMPRA': { field: 'costPrice', transform: 'spanish' },
        'COSTO': { field: 'costPrice', transform: 'spanish' },
        'MAYORISTA': { field: 'salePrice', transform: 'spanish' },
        'MINORISTA': { field: 'salePrice', transform: 'spanish' },
        'CONTADO': { field: 'salePrice', transform: 'spanish' },
        'PRECIO VENTA': { field: 'salePrice', transform: 'spanish' },
      };
      
      const detectedMapping: Record<string, { column: string; transform: string; skipEmpty: boolean }> = {};
      
      fileData.columns.forEach((col) => {
        const upperCol = col.toUpperCase().trim();
        const config = columnMappings[upperCol];
        if (config) {
          detectedMapping[config.field] = {
            column: col,
            transform: config.transform,
            skipEmpty: false,
          };
        }
      });
      
      if (Object.keys(detectedMapping).length > 0) {
        setMapping(detectedMapping);
      }
    }
  }, [fileData?.columns, setMapping]);

  const handleContinue = () => {
    // Validate that at least name is mapped
    if (!fieldConfig.name?.column || fieldConfig.name.column === '_none') {
      alert('Debes mapear al menos la columna de nombre del producto');
      return;
    }
    nextStep();
  };

  const handleMappingChange = (newMapping: Record<string, any>) => {
    setMapping(newMapping);
  };

  const handleOptionsChange = (newOptions: any) => {
    setOptions(newOptions);
  };

  if (!fileData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay archivo cargado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Configurar Importación</h2>
        <p className="text-muted-foreground">
          Mapea las columnas del CSV a los campos del sistema y configura las opciones de importación.
        </p>
      </div>

      <ColumnMapper
        columns={fileData.columns}
        mapping={fieldConfig}
        onMappingChange={handleMappingChange}
        importOptions={globalOptions}
        onImportOptionsChange={handleOptionsChange}
        existingCategories={existingCategories}
      />

      <StepActions
        onBack={prevStep}
        onContinue={handleContinue}
        onContinueDisabled={Object.keys(fieldConfig).length === 0}
      />
    </div>
  );
}
