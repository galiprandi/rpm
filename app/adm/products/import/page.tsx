'use client';

/**
 * Product Importer Page
 * /adm/products/import
 */
import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkOrderStepper } from '@/components/ui/stepper';
import { FileUploader } from './components/FileUploader';
import { ColumnMapper } from './components/ColumnMapper';
import { CategoryMapper } from './components/CategoryMapper';
import { ValidationPreview } from './components/ValidationPreview';
import { ImportProgress } from './components/ImportProgress';
import { Loader2, Upload, Settings, Tag, CheckCircle, Play } from 'lucide-react';

interface ColumnMapping {
  column: string;
  process: string;
  skipEmpty?: boolean;
  defaultValue?: string;
}

interface CategoryMapping {
  [key: string]: {
    action: 'create' | 'map';
    targetId?: string;
    newName?: string;
  };
}

interface ImportOptions {
  skipStockLessThanOne: boolean;
  duplicateAction: 'skip' | 'update' | 'create_with_suffix';
  defaultCategoryId: string;
}

interface ValidatedProduct {
  _rowIndex: number;
  name: string;
  sku?: string;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  categoryName: string;
  isDuplicate: boolean;
}

interface ValidationStats {
  total: number;
  valid: number;
  invalid: number;
  categoriesToCreateCount: number;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductImporterPage() {
  const [currentStep, setCurrentStep] = useState(0);

  // File upload state
  const [fileData, setFileData] = useState<{
    columns: string[];
    preview: Record<string, string>[];
    totalRows: number;
    file: File;
  } | null>(null);

  // Column mapping state
  const [mapping, setMapping] = useState<Record<string, ColumnMapping>>({});
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipStockLessThanOne: false,
    duplicateAction: 'skip',
    defaultCategoryId: '_none',
  });

  // Categories state
  const [existingCategories, setExistingCategories] = useState<Category[]>([]);
  const [categoryMapping, setCategoryMapping] = useState<CategoryMapping>({});

  // Validation state
  const [validatedData, setValidatedData] = useState<{
    valid: ValidatedProduct[];
    invalid: Array<{ row: number; reason: string; data: Record<string, string> }>;
    stats: ValidationStats;
    categoriesToCreate: Array<{ key: string; name: string; count: number }>;
  } | null>(null);

  // Import execution state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [dryRun, setDryRun] = useState(true);
  const [importResults, setImportResults] = useState<{
    stats: { total: number; created: number; updated: number; skipped: number; errors: number };
    results: Array<{
      row: number;
      status: 'success' | 'error' | 'skipped';
      message: string;
      productId?: string;
      name?: string;
    }>;
  } | null>(null);

  // Load existing categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setExistingCategories(data.categories);
        }
      })
      .catch(console.error);
  }, []);

  // Handle file analyzed
  const handleFileAnalyzed = useCallback((data: typeof fileData) => {
    setFileData(data);
    setCurrentStep(1);
  }, []);

  // Handle validation
  const handleValidate = async () => {
    if (!fileData) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Parse CSV data
      const csvContent = await fileData.file.text();
      const lines = csvContent.split('\n').filter((l) => l.trim());
      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = lines.slice(1).map((line) =>
        line.split(',').map((cell) => cell.trim().replace(/^["']|["']$/g, ''))
      );

      const response = await fetch('/api/import/products/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvData: { headers, rows },
          mapping,
          categoryMapping,
          importOptions,
        }),
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const data = await response.json();
      setValidatedData(data);

      // Initialize category mapping from detected categories
      const newCategoryMapping: CategoryMapping = { ...categoryMapping };
      data.categoriesToCreate.forEach((cat: { key: string; name: string }) => {
        if (!newCategoryMapping[cat.key]) {
          const existing = existingCategories.find(
            (c) => c.name.toLowerCase() === cat.name.toLowerCase()
          );
          if (existing) {
            newCategoryMapping[cat.key] = { action: 'map', targetId: existing.id };
          } else {
            newCategoryMapping[cat.key] = { action: 'create', newName: cat.name };
          }
        }
      });
      setCategoryMapping(newCategoryMapping);

      setCurrentStep(2);
    } catch (error) {
      console.error('Validation error:', error);
      alert('Error al validar el archivo');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle import execution
  const handleExecute = async () => {
    if (!validatedData) return;

    setIsImporting(true);
    setImportProgress(10);

    try {
      const response = await fetch('/api/import/products/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: validatedData.valid,
          categoryMapping,
          importOptions: { ...importOptions, dryRun },
        }),
      });

      setImportProgress(50);

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const data = await response.json();
      setImportProgress(100);
      setImportResults({
        stats: data.stats,
        results: data.results,
      });
      setCurrentStep(3);
    } catch (error) {
      console.error('Import error:', error);
      alert('Error al importar productos');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle download report
  const handleDownloadReport = () => {
    if (!importResults) return;

    const csv = [
      ['Fila', 'Producto', 'Estado', 'Mensaje', 'ID'].join(','),
      ...importResults.results.map((r) =>
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
  };

  // Handle reset
  const handleReset = () => {
    setCurrentStep(0);
    setFileData(null);
    setMapping({});
    setCategoryMapping({});
    setValidatedData(null);
    setImportResults(null);
    setDryRun(true);
  };

  const steps = [
    { label: 'Cargar CSV', description: 'Selecciona el archivo' },
    { label: 'Mapear', description: 'Configura columnas' },
    { label: 'Categorías', description: 'Revisa categorías' },
    { label: 'Validar', description: 'Verifica datos' },
    { label: 'Importar', description: dryRun ? 'Simulación' : 'Importar' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Importar Productos</h1>
        <p className="text-muted-foreground">
          Importa productos desde un archivo CSV. Usa el modo dry-run para validar antes de importar.
        </p>
      </div>

      <WorkOrderStepper
        steps={steps.map((s, i) => ({
          value: i + 1,
          label: s.label,
          icon: [Upload, Settings, Tag, CheckCircle, Play][i] || CheckCircle,
        }))}
        currentStep={currentStep + 1}
        className="mb-8"
      />

      <Card className="p-6">
        {currentStep === 0 && (
          <FileUploader onFileAnalyzed={handleFileAnalyzed} />
        )}

        {currentStep === 1 && fileData && (
          <div className="space-y-6">
            <ColumnMapper
              columns={fileData.columns}
              mapping={mapping}
              onMappingChange={setMapping}
              importOptions={importOptions}
              onImportOptionsChange={setImportOptions}
              existingCategories={existingCategories}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(0)}>
                Volver
              </Button>
              <Button onClick={handleValidate} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Validar Datos'
                )}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && validatedData && (
          <div className="space-y-6">
            <CategoryMapper
              detectedCategories={validatedData.categoriesToCreate}
              existingCategories={existingCategories}
              mapping={categoryMapping}
              onMappingChange={setCategoryMapping}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Volver
              </Button>
              <Button onClick={() => setCurrentStep(3)}>Continuar</Button>
            </div>
          </div>
        )}

        {currentStep === 3 && validatedData && (
          <div className="space-y-6">
            <ValidationPreview
              validProducts={validatedData.valid}
              invalidRows={validatedData.invalid}
              stats={validatedData.stats}
              categoriesToCreate={validatedData.categoriesToCreate}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Volver
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDryRun(!dryRun)}
                  className={dryRun ? 'border-yellow-400 text-yellow-700' : ''}
                >
                  {dryRun ? 'Modo: Simulación' : 'Modo: Real'}
                </Button>
                <Button
                  onClick={handleExecute}
                  disabled={isImporting || validatedData.valid.length === 0}
                  variant={dryRun ? 'secondary' : 'default'}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {dryRun ? 'Simulando...' : 'Importando...'}
                    </>
                  ) : dryRun ? (
                    'Ejecutar Simulación'
                  ) : (
                    'Importar Productos'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && importResults && (
          <ImportProgress
            isRunning={isImporting}
            progress={importProgress}
            dryRun={dryRun}
            stats={importResults.stats}
            results={importResults.results}
            onDownloadReport={handleDownloadReport}
            onReset={handleReset}
            onToggleDryRun={() => setDryRun(!dryRun)}
          />
        )}
      </Card>
    </div>
  );
}
