/**
 * UploadStep Component
 * Paso 1: Carga de archivo CSV
 */

import { useCallback } from 'react';
import { FileUploader } from '../FileUploader';
import { useFileUpload } from '@/app/adm/products/import/hooks/useFileUpload';
import { useImportState } from '@/app/adm/products/import/hooks/useImportState';

interface FileData {
  columns: string[];
  preview: Record<string, string>[];
  totalRows: number;
  file: File;
  delimiter?: string;
  encoding?: string;
  skippedRows?: number;
}

interface UploadStepProps {
  onUpload?: (data: FileData) => void;
}

export function UploadStep({ onUpload }: UploadStepProps) {
  const { uploadFile, error, reset } = useFileUpload();
  const { setFileData, nextStep } = useImportState();

  const handleFileAnalyzed = useCallback(async (data: FileData) => {
    try {
      setFileData(data);
      onUpload?.(data);
      nextStep();
    } catch (err) {
      console.error('Error processing file:', err);
    }
  }, [setFileData, onUpload, nextStep]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Cargar Archivo CSV</h2>
        <p className="text-muted-foreground">
          Selecciona el archivo CSV con los productos que quieres importar.
          El sistema analizará el archivo y te mostrará un preview antes de continuar.
        </p>
      </div>

      <FileUploader 
        onFileAnalyzed={handleFileAnalyzed}
      />

      {error && (
        <div className="flex justify-center">
          <button 
            onClick={reset}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Intentar con otro archivo
          </button>
        </div>
      )}
    </div>
  );
}
