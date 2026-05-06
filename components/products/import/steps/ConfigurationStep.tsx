/**
 * ConfigurationStep Component
 * Paso 2: Configuración de mapeo de columnas y opciones globales
 */

import { useEffect, useRef } from 'react';
import { StepActions } from '../shared/StepActions';
import { useImportState } from '@/app/adm/products/import/hooks/useImportState';
import { ColumnMapper } from '../ColumnMapper';
import type { ColumnMapping, ImportOptions } from '@/lib/product-import-schemas';

interface ConfigurationStepProps {
  existingCategories: Array<{ id: string; name: string }>;
  existingSuppliers: Array<{ id: string; name: string }>;
}

export function ConfigurationStep({ existingCategories, existingSuppliers }: ConfigurationStepProps) {
  const { fileData, prevStep, nextStep, configuration, setMapping, setOptions } = useImportState();
  const fieldConfig = configuration.mapping;
  const globalOptions = configuration.options;
  const hasInitialized = useRef(false);

  // FORZAR LIMPIEZA COMPLETA AL MONTAR - Solo si no hay mapeo previo
  useEffect(() => {
    // Solo limpiar si no hay mapeo configurado (navegación fresca) y no se ha inicializado
    if (!hasInitialized.current && (!fieldConfig || Object.keys(fieldConfig).length === 0)) {
      // Limpiar completamente el mapeo para forzar configuración manual
      setMapping({});
      setOptions({
        skipStockLessThanOne: false,
        duplicateAction: 'skip',
        defaultCategoryId: undefined,
      });
      
      // También limpiar localStorage por si acaso
      localStorage.removeItem('product-import-mapping-v2');
      
      console.log('🧹 Configuración de importación limpiada - mapeo manual forzado');
      hasInitialized.current = true;
    }
  }, [setMapping, setOptions]);

  const handleContinue = () => {
    // Validate that at least name is mapped
    if (!fieldConfig.name?.column || fieldConfig.name.column === '_none') {
      alert('Debes mapear al menos la columna de nombre del producto');
      return;
    }
    nextStep();
  };

  const handleMappingChange = (newMapping: Record<string, ColumnMapping>) => {
    setMapping(newMapping);
  };

  const handleOptionsChange = (newOptions: ImportOptions) => {
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
          Mapea manualmente las columnas del CSV a los campos del sistema.
        </p>
      </div>

      <ColumnMapper
        columns={fileData.columns}
        mapping={fieldConfig}
        onMappingChange={handleMappingChange}
        importOptions={globalOptions}
        onImportOptionsChange={handleOptionsChange}
        existingCategories={existingCategories}
        existingSuppliers={existingSuppliers}
      />

      <StepActions
        onBack={prevStep}
        onContinue={handleContinue}
        onContinueDisabled={Object.keys(fieldConfig).length === 0}
        backLabel="Anterior"
        continueLabel="Siguiente"
      />
    </div>
  );
}
