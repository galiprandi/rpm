/**
 * useImportExecution Hook
 * Ejecución de importación y manejo de resultados
 */

import { useState, useCallback } from 'react';
import type { ImportPayload, ImportResult } from '@/lib/product-import-schemas';

interface UseImportExecutionReturn {
  isExecuting: boolean;
  progress: number;
  results: ImportResult | null;
  error: string | null;
  execute: (payload: ImportPayload) => Promise<void>;
  downloadReport: () => void;
  reset: () => void;
}

export function useImportExecution(): UseImportExecutionReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (payload: ImportPayload) => {
    setIsExecuting(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(10);

      const response = await fetch('/api/import/products/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setProgress(50);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error en la importación');
      }

      const result: ImportResult = await response.json();
      setProgress(100);
      setResults(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const downloadReport = useCallback(() => {
    if (!results) return;

    const csv = [
      ['Fila', 'Producto', 'Estado', 'Mensaje', 'ID'].join(','),
      ...results.results.map((r) =>
        [r.row, r.name || '', r.status, r.message, r.productId || ''].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const reset = useCallback(() => {
    setIsExecuting(false);
    setProgress(0);
    setResults(null);
    setError(null);
  }, []);

  return {
    isExecuting,
    progress,
    results,
    error,
    execute,
    downloadReport,
    reset,
  };
}
