/**
 * ReviewStep Component
 * Paso 3: Revisión de datos con 4 tabs (Nuevos, Omitidos, Existentes, Categorías)
 */

import { useCallback } from 'react';
import { StepActions } from '../shared/StepActions';
import { ProductReviewTable } from '../ProductReviewTable';
import { useImportState } from '@/app/adm/products/import/hooks/useImportState';

interface ReviewStepProps {
  existingCategories: Array<{ id: string; name: string }>;
}

export function ReviewStep({ existingCategories }: ReviewStepProps) {
  const { fileData, configuration, validationResult, setValidationResult, prevStep, nextStep } = useImportState();
  const fieldConfig = configuration.mapping;
  const globalOptions = configuration.options;

  const handleValidationComplete = useCallback((result: any) => {
    setValidationResult(result);
  }, [setValidationResult]);

  const handleContinue = () => {
    if (!validationResult) return;
    
    // Validate that we have valid products to import
    if (validationResult.valid.length === 0) {
      alert('No hay productos válidos para importar');
      return;
    }
    
    nextStep();
  };

  if (!fileData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay archivo cargado</p>
      </div>
    );
  }

  // Convert file data to CSV format for ProductReviewTable
  const csvData = {
    headers: fileData.columns,
    rows: fileData.preview.map((row) => 
      fileData.columns.map((col) => row[col] || '')
    ),
    totalRows: fileData.totalRows,
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Revisar Datos</h2>
        <p className="text-muted-foreground">
          Revisa los datos importados en las diferentes categorías y configura las nuevas categorías si es necesario.
        </p>
      </div>

      <ProductReviewTable
        csvData={csvData}
        mapping={fieldConfig}
        importOptions={globalOptions}
        existingCategories={existingCategories}
        onValidationComplete={handleValidationComplete}
        autoValidate={true}
      />

      <StepActions
        onBack={prevStep}
        onContinue={handleContinue}
        onContinueDisabled={!validationResult || validationResult.valid.length === 0}
        continueLabel="Siguiente"
      />
    </div>
  );
}
