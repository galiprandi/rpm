/**
 * useImportState Hook
 * Estado global del flujo de importación con persistencia
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ColumnMapping, ImportOptions, ValidationResult, DetectedCategory, ImportResult } from '@/lib/product-import-schemas';

interface FileData {
  columns: string[];
  preview: Record<string, string>[];
  totalRows: number;
  file: File;
  delimiter?: string;
  encoding?: string;
  skippedRows?: number;
}

interface ImportState {
  // Navigation
  currentStep: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  
  // File upload
  fileData: FileData | null;
  setFileData: (data: FileData) => void;
  clearFileData: () => void;
  
  // Configuration
  configuration: {
    mapping: Record<string, ColumnMapping>;
    options: ImportOptions;
  };
  setMapping: (mapping: Record<string, ColumnMapping>) => void;
  setOptions: (options: ImportOptions) => void;
  clearConfiguration: () => void;
  
  // Validation
  validationResult: ValidationResult | null;
  setValidationResult: (result: ValidationResult) => void;
  clearValidationResult: () => void;
  
  // Categories
  categoryMappings: DetectedCategory[];
  setCategoryMappings: (categories: DetectedCategory[]) => void;
  updateCategoryMapping: (detectedName: string, updates: Partial<DetectedCategory>) => void;
  
  // Execution
  importResults: ImportResult | null;
  setImportResults: (results: ImportResult) => void;
  clearImportResults: () => void;
  
  // UI state
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const DEFAULT_OPTIONS: ImportOptions = {
  skipStockLessThanOne: false,
  duplicateAction: 'skip',
};

export const useImportState = create<ImportState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentStep: 0,
      goToStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
      reset: () => set({
        currentStep: 0,
        fileData: null,
        configuration: { mapping: {}, options: DEFAULT_OPTIONS },
        validationResult: null,
        categoryMappings: [],
        importResults: null,
        isProcessing: false,
      }),
      
      // File upload
      fileData: null,
      setFileData: (data) => set({ fileData: data }),
      clearFileData: () => set({ fileData: null }),
      
      // Configuration
      configuration: {
        mapping: {},
        options: DEFAULT_OPTIONS,
      },
      setMapping: (mapping) => set((state) => ({
        configuration: { ...state.configuration, mapping }
      })),
      setOptions: (options) => set((state) => ({
        configuration: { ...state.configuration, options }
      })),
      clearConfiguration: () => set((state) => ({
        configuration: { mapping: {}, options: DEFAULT_OPTIONS }
      })),
      
      // Validation
      validationResult: null,
      setValidationResult: (result) => set({ validationResult: result }),
      clearValidationResult: () => set({ validationResult: null }),
      
      // Categories
      categoryMappings: [],
      setCategoryMappings: (categories) => set({ categoryMappings: categories }),
      updateCategoryMapping: (detectedName, updates) => set((state) => ({
        categoryMappings: state.categoryMappings.map(cat =>
          cat.detectedName === detectedName ? { ...cat, ...updates } : cat
        )
      })),
      
      // Execution
      importResults: null,
      setImportResults: (results) => set({ importResults: results }),
      clearImportResults: () => set({ importResults: null }),
      
      // UI state
      isProcessing: false,
      setIsProcessing: (processing) => set({ isProcessing: processing }),
    }),
    {
      name: 'product-import-state',
      version: 2, // Increment version to force reset of old state that had currentStep persisted
      // Solo persistir configuración, no paso actual ni datos temporales
      partialize: (state) => ({
        configuration: state.configuration,
        // No persistir: currentStep, fileData, validationResult, categoryMappings, importResults
      }),
    }
  )
);

// Selectores para componentes específicos
export const useNavigation = () => {
  const { currentStep, goToStep, nextStep, prevStep, reset } = useImportState();
  return { currentStep, goToStep, nextStep, prevStep, reset };
};

export const useFileData = () => {
  const { fileData, setFileData, clearFileData } = useImportState();
  return { fileData, setFileData, clearFileData };
};

interface UseConfigurationReturn {
  fieldConfig: Record<string, ColumnMapping>;
  globalOptions: ImportOptions;
  detectedCount: number;
  updateField: (field: string, config: Partial<ColumnMapping>) => void;
  updateOptions: (options: Partial<ImportOptions>) => void;
  autoDetect: (columns: string[]) => void;
  clear: () => void;
}

export function useConfiguration(): UseConfigurationReturn {
  const { configuration, setMapping, setOptions, clearConfiguration } = useImportState();
  
  const detectedCount = Object.values(configuration.mapping).filter(config => 
    config.column && config.column !== '_none'
  ).length;
  
  const updateField = (field: string, config: Partial<ColumnMapping>) => {
    const currentConfig = configuration.mapping[field] || {
      column: '',
      transform: 'trim',
      skipEmpty: false,
      defaultValue: '',
    };
    
    setMapping({
      ...configuration.mapping,
      [field]: {
        ...currentConfig,
        ...config,
      },
    });
  };
  
  const updateOptions = (options: Partial<ImportOptions>) => {
    setOptions({ ...configuration.options, ...options });
  };
  
  const autoDetect = (columns: string[]) => {
    // Auto-detection logic
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
      'MAYORISTA': { field: 'salePrice', transform: 'spanish' },
      'MINORISTA': { field: 'salePrice', transform: 'spanish' },
      'CONTADO': { field: 'salePrice', transform: 'spanish' },
      'PRECIO VENTA': { field: 'salePrice', transform: 'spanish' },
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
    
    if (Object.keys(mapping).length > 0) {
      setMapping(mapping);
    }
  };
  
  const clear = () => {
    clearConfiguration();
  };
  
  return {
    fieldConfig: configuration.mapping,
    globalOptions: configuration.options,
    detectedCount,
    updateField,
    updateOptions,
    autoDetect,
    clear,
  };
};

export const useValidation = () => {
  const { validationResult, setValidationResult, clearValidationResult } = useImportState();
  return { validationResult, setValidationResult, clearValidationResult };
};

export const useCategories = () => {
  const { categoryMappings, setCategoryMappings, updateCategoryMapping } = useImportState();
  return { categoryMappings, setCategoryMappings, updateCategoryMapping };
};

export const useExecution = () => {
  const { importResults, setImportResults, clearImportResults, isProcessing, setIsProcessing } = useImportState();
  return { importResults, setImportResults, clearImportResults, isProcessing, setIsProcessing };
};
