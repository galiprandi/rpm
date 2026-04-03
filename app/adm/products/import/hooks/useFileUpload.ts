/**
 * useFileUpload Hook
 * Manejo de carga de archivos CSV con análisis
 */

import { useState, useCallback } from 'react';
import { AnalyzeResult } from '@/lib/product-import-schemas';

interface FileData {
  columns: string[];
  preview: Record<string, string>[];
  totalRows: number;
  file: File;
  delimiter?: string;
  encoding?: string;
  skippedRows?: number;
}

interface UseFileUploadReturn {
  isUploading: boolean;
  error: string | null;
  uploadFile: (file: File) => Promise<FileData>;
  reset: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<FileData> => {
    setIsUploading(true);
    setError(null);

    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('El archivo debe ser un CSV');
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo no puede superar 10MB');
      }

      // Create FormData for API
      const formData = new FormData();
      formData.append('file', file);

      // Call analyze API
      const response = await fetch('/api/import/products/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al analizar el archivo');
      }

      const result: AnalyzeResult = await response.json();

      // Convert to FileData format
      const fileData: FileData = {
        columns: result.columns,
        preview: result.preview as Record<string, string>[],
        totalRows: result.totalRows,
        file,
        delimiter: result.delimiter,
        encoding: result.encoding,
        skippedRows: result.skippedRows,
      };

      return fileData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    isUploading,
    error,
    uploadFile,
    reset,
  };
}
