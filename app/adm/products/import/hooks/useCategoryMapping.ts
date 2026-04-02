/**
 * useCategoryMapping Hook
 * Manejo de mapeo de categorías detectadas
 */

import { useCallback } from 'react';
import type { DetectedCategory, CategoryMapping } from '@/lib/product-import-schemas';

interface UseCategoryMappingReturn {
  categories: DetectedCategory[];
  renameCategory: (detectedName: string, newName: string) => void;
  reassignCategory: (detectedName: string, targetId?: string) => void;
  getFinalMappings: () => CategoryMapping[];
  setCategories: (categories: DetectedCategory[]) => void;
}

export function useCategoryMapping(initialCategories: DetectedCategory[] = []): UseCategoryMappingReturn {
  const renameCategory = useCallback((detectedName: string, newName: string) => {
    // This would be implemented in the parent hook
    console.log('renameCategory', detectedName, newName);
  }, []);

  const reassignCategory = useCallback((detectedName: string, targetId?: string) => {
    // This would be implemented in the parent hook
    console.log('reassignCategory', detectedName, targetId);
  }, []);

  const getFinalMappings = useCallback((): CategoryMapping[] => {
    return initialCategories.map(cat => ({
      sourceName: cat.detectedName,
      action: cat.action,
      targetId: cat.targetCategoryId,
      newName: cat.finalName,
      productCount: cat.count,
    }));
  }, [initialCategories]);

  const setCategories = useCallback((categories: DetectedCategory[]) => {
    // This would be implemented in the parent hook
    console.log('setCategories', categories);
  }, []);

  return {
    categories: initialCategories,
    renameCategory,
    reassignCategory,
    getFinalMappings,
    setCategories,
  };
}
