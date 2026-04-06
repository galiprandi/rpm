/**
 * useImportState Hook
 * Estado global del flujo de importación con persistencia
 */

import { create } from 'zustand';
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
  defaultCategoryId: undefined,
  defaultSupplierId: undefined,
};

export const useImportState = create<ImportState>()(
  (set) => ({
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
      clearConfiguration: () => set({
        configuration: { mapping: {}, options: DEFAULT_OPTIONS }
      }),
      
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
    })
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
  
  const autoDetect = () => {
    // AUTO-DETECCIÓN DESACTIVADA - Forzar mapeo manual
    console.log('Auto-detección desactivada - el usuario debe mapear manualmente');
    // Código de auto-detección eliminado - usar useConfiguration.ts para mapeo
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
