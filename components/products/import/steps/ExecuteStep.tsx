/**
 * ExecuteStep Component
 * Paso 4: Ejecución de importación y resultados
 */

import { useState, useCallback } from 'react';
import { StepActions } from '../shared/StepActions';
import { ImportProgress } from '../ImportProgress';
import { useImportExecution } from '@/app/adm/products/import/hooks/useImportExecution';
import { useImportState } from '@/app/adm/products/import/hooks/useImportState';

interface ExecuteStepProps {
  existingCategories: Array<{ id: string; name: string }>;
}

export function ExecuteStep({ existingCategories }: ExecuteStepProps) {
  const { validationResult, configuration, reset } = useImportState();
  const globalOptions = configuration.options;
  const { execute, isExecuting, progress, results, error, downloadReport } = useImportExecution();
  const [dryRun, setDryRun] = useState(true);

  const handleExecute = useCallback(async () => {
    if (!validationResult) return;

    try {
      // Build payload for API
      const payload = {
        products: validationResult.valid,
        categoryMappings: validationResult.categories?.map(cat => ({
          sourceName: cat.detectedName,
          action: 'create' as const,
          newName: cat.finalName,
          productCount: cat.count || 0,
        })) || [],
        options: { ...globalOptions, dryRun },
      };

      await execute(payload);
    } catch (err) {
      console.error('Import error:', err);
    }
  }, [validationResult, globalOptions, dryRun, execute]);

  const handleReset = useCallback(() => {
    reset();
    reset(); // Reset import execution state
    setDryRun(true);
  }, [reset]);

  const handleDownloadReport = useCallback(() => {
    downloadReport();
  }, [downloadReport]);

  if (!validationResult) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay datos validados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">
          {results ? 'Resultados de Importación' : 'Importar Productos'}
        </h2>
        <p className="text-muted-foreground">
          {results 
            ? 'Revisa los resultados de la importación y descarga el reporte si es necesario.'
            : 'Ejecuta la importación de productos. Usa modo simulación para validar antes de importar.'
          }
        </p>
      </div>

      {results ? (
        <ImportProgress
          isRunning={false}
          progress={100}
          dryRun={dryRun}
          stats={{
            total: results.stats.attempted,
            updated: 0,
            created: results.stats.created,
            skipped: results.stats.skipped,
            errors: 0,
          }}
          results={results.results}
          onDownloadReport={handleDownloadReport}
          onReset={handleReset}
          onToggleDryRun={() => setDryRun(!dryRun)}
        />
      ) : (
        <div className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Resumen de Importación</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{validationResult.valid.length}</div>
                <div className="text-sm text-muted-foreground">Productos Válidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{validationResult.invalid.length}</div>
                <div className="text-sm text-muted-foreground">Productos Inválidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{validationResult.categories?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Categorías Nuevas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{validationResult.stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Filas</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <StepActions
            onBack={() => setDryRun(!dryRun)}
            onContinue={handleExecute}
            onContinueDisabled={isExecuting || validationResult.valid.length === 0}
            backLabel={dryRun ? 'Cambiar a Modo Real' : 'Cambiar a Modo Simulación'}
            continueLabel={dryRun ? 'Ejecutar Simulación' : 'Importar Productos'}
            loading={isExecuting}
            extraActions={
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  dryRun 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {dryRun ? 'MODO: SIMULACIÓN' : 'MODO: REAL'}
                </span>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
