'use client';

/**
 * ImportProgress Component
 * Progreso de importación y resultados
 */
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Download, RotateCcw } from 'lucide-react';
import { StatsCards } from './shared/StatsCards';

interface ImportResult {
  row: number;
  status: 'success' | 'error' | 'skipped';
  message: string;
  productId?: string;
  name?: string;
}

interface ImportStats {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

interface ImportProgressProps {
  isRunning: boolean;
  progress: number;
  dryRun: boolean;
  stats: ImportStats;
  results: ImportResult[];
  onDownloadReport: () => void;
  onReset: () => void;
  onToggleDryRun?: () => void;
}

export function ImportProgress({
  isRunning,
  progress,
  stats,
  results,
  onDownloadReport,
  onReset,
}: ImportProgressProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-700">Éxito</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700">Error</Badge>;
      case 'skipped':
        return <Badge className="bg-yellow-100 text-yellow-700">Omitido</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      {isRunning && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Procesando...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      {!isRunning && stats.total > 0 && (
        <StatsCards
          stats={[
            { value: stats.total, label: 'Total', color: 'gray' },
            { value: stats.created, label: 'Creados', color: 'green' },
            { value: stats.updated, label: 'Actualizados', color: 'blue' },
            { value: stats.skipped, label: 'Omitidos', color: 'yellow' },
            { value: stats.errors, label: 'Errores', color: 'red' },
          ]}
        />
      )}

      {/* Results Table */}
      {!isRunning && results.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Resultados</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onDownloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Descargar Reporte
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Fila</th>
                  <th className="text-left py-2 px-2">Estado</th>
                  <th className="text-left py-2 px-2">Producto</th>
                  <th className="text-left py-2 px-2">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2 px-2 text-muted-foreground">{result.row}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        {getStatusBadge(result.status)}
                      </div>
                    </td>
                    <td className="py-2 px-2 font-medium">{result.name || '-'}</td>
                    <td className="py-2 px-2 text-muted-foreground">{result.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Actions */}
      {!isRunning && stats.total > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Nueva Importación
          </Button>
        </div>
      )}
    </div>
  );
}
