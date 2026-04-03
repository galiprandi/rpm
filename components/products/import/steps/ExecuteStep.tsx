/**
 * ExecuteStep Component
 * Paso 4: Ejecución de importación y resultados
 */

import { useCallback } from 'react';
import { StepActions } from '../shared/StepActions';
import { ImportProgress } from '../ImportProgress';
import { StatsCards } from '../shared/StatsCards';
import { useImportExecution } from '@/app/adm/products/import/hooks/useImportExecution';
import { useImportState } from '@/app/adm/products/import/hooks/useImportState';

interface ExecuteStepProps {
  existingCategories: Array<{ id: string; name: string }>;
}

export function ExecuteStep({ existingCategories }: ExecuteStepProps) {
  const { validationResult, configuration, reset, prevStep } = useImportState();
  const globalOptions = configuration.options;
  const { execute, isExecuting, progress, results, error, downloadReport } = useImportExecution();

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
        options: { ...globalOptions, dryRun: false },
      };

      await execute(payload);
    } catch (err) {
      console.error('Import error:', err);
    }
  }, [validationResult, globalOptions, execute]);

  const handleReset = useCallback(() => {
    reset();
    reset(); // Reset import execution state
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
            : 'Ejecuta la importación de productos.'
          }
        </p>
      </div>

      {results ? (
        <ImportProgress
          isRunning={false}
          progress={100}
          dryRun={false}
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
          onToggleDryRun={() => {}}
        />
      ) : (
        <div className="space-y-6">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <h3 className="font-semibold text-sm mb-3 text-muted-foreground">Resumen de Importación</h3>
            <StatsCards
              stats={[
                { value: validationResult.valid.length, label: 'Válidos', color: 'blue' },
                { value: validationResult.invalid.length, label: 'Inválidos', color: 'red' },
                { value: validationResult.categories?.length || 0, label: 'Categorías', color: 'green' },
                { value: validationResult.stats.total, label: 'Total', color: 'purple' },
              ]}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <StepActions
            onBack={prevStep}
            onContinue={handleExecute}
            onContinueDisabled={isExecuting || validationResult.valid.length === 0}
            backLabel="Anterior"
            continueLabel="Importar"
            loading={isExecuting}
          />
        </div>
      )}
    </div>
  );
}
