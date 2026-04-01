'use client';

/**
 * FileUploader Component
 * File input + detección de encoding + preview de CSV
 */
import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploaderProps {
  onFileAnalyzed: (data: {
    columns: string[];
    preview: Record<string, string>[];
    totalRows: number;
    delimiter: string;
    encoding: string;
    file: File;
  }) => void;
}

export function FileUploader({ onFileAnalyzed }: FileUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/products/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error analyzing file');
      }

      const data = await response.json();
      onFileAnalyzed({
        ...data,
        file,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error analyzing file');
    } finally {
      setIsLoading(false);
    }
  }, [onFileAnalyzed]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        analyzeFile(file);
      } else {
        setError('Solo se permiten archivos .csv o .txt');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      analyzeFile(file);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-3">
          {isLoading ? (
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          ) : (
            <Upload className="h-12 w-12 text-gray-400" />
          )}

          <div className="text-lg font-medium">
            {isDragOver
              ? 'Suelta el archivo aquí...'
              : isLoading
                ? 'Analizando archivo...'
                : 'Arrastra un archivo CSV aquí'}
          </div>

          <p className="text-sm text-muted-foreground">
            o haz clic para seleccionar un archivo
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Soporta: .csv, .txt (UTF-8, Latin1)</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          Seleccionar Archivo
        </Button>
      </div>
    </div>
  );
}
