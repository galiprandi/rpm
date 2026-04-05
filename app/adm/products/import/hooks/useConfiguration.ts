/**
 * useConfiguration Hook
 * Configuración de importación: mapeo de columnas y opciones globales
 */

import { useState, useCallback, useEffect } from 'react';
import type { ColumnMapping, ImportOptions } from '@/lib/product-import-schemas';

interface UseConfigurationReturn {
  fieldConfig: Record<string, ColumnMapping>;
  globalOptions: ImportOptions;
  detectedCount: number;
  updateField: (field: string, config: Partial<ColumnMapping>) => void;
  updateOptions: (options: Partial<ImportOptions>) => void;
  autoDetect: (columns: string[]) => void;
  clear: () => void;
}

const STORAGE_KEY = 'product-import-configuration';

const DEFAULT_OPTIONS: ImportOptions = {
  skipStockLessThanOne: false,
  duplicateAction: 'skip',
};

export function useConfiguration(): UseConfigurationReturn {
  const [fieldConfig, setFieldConfig] = useState<Record<string, ColumnMapping>>({});
  const [globalOptions, setGlobalOptions] = useState<ImportOptions>(DEFAULT_OPTIONS);

  // Load saved configuration on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.fieldConfig) {
          setFieldConfig(parsed.fieldConfig);
        }
        if (parsed.globalOptions) {
          setGlobalOptions(parsed.globalOptions);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save configuration when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fieldConfig, globalOptions }));
    }, 1000);

    return () => clearTimeout(timer);
  }, [fieldConfig, globalOptions]);

  const updateField = useCallback((field: string, config: Partial<ColumnMapping>) => {
    setFieldConfig(prev => {
      const currentConfig = prev[field] || {
        column: '',
        transform: 'trim',
        skipEmpty: false,
        defaultValue: '',
      };
      
      return {
        ...prev,
        [field]: {
          ...currentConfig,
          ...config,
        },
      };
    });
  }, []);

  const updateOptions = useCallback((options: Partial<ImportOptions>) => {
    setGlobalOptions(prev => ({ ...prev, ...options }));
  }, []);

  const autoDetect = useCallback((columns: string[]) => {
    const detected = autoDetectMapping(columns);
    if (Object.keys(detected).length > 0) {
      setFieldConfig(detected);
    }
  }, []);

  const clear = useCallback(() => {
    setFieldConfig({});
    setGlobalOptions(DEFAULT_OPTIONS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const detectedCount = Object.values(fieldConfig).filter(config => 
    config.column && config.column !== '_none'
  ).length;

  return {
    fieldConfig,
    globalOptions,
    detectedCount,
    updateField,
    updateOptions,
    autoDetect,
    clear,
  };
}

// Auto-detection logic (moved from page.tsx)
function autoDetectMapping(columns: string[]): Record<string, ColumnMapping> {
  const mapping: Record<string, ColumnMapping> = {};
  
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
    'MAYORISTA': { field: 'replacementCost', transform: 'spanish' },
    'MINORISTA': { field: 'replacementCost', transform: 'spanish' },
    'CONTADO': { field: 'replacementCost', transform: 'spanish' },
    'PRECIO VENTA': { field: 'replacementCost', transform: 'spanish' },
  };
  
  columns.forEach((col) => {
    const upperCol = col.toUpperCase().trim();
    const config = columnMappings[upperCol];
    if (config) {
      mapping[config.field] = {
        column: col,
        transform: config.transform,
        skipEmpty: false,
      };
    }
  });
  
  return mapping;
}
