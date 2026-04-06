'use client';

/**
 * Product Importer Page
 * Página principal refactorizada con arquitectura modular
 */
import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { WorkOrderStepper } from '@/components/ui/stepper';
import { Upload, Settings, Eye, Play, CheckCircle } from 'lucide-react';

// Components
import { UploadStep } from '@/components/products/import/steps/UploadStep';
import { ConfigurationStep } from '@/components/products/import/steps/ConfigurationStep';
import { ReviewStep } from '@/components/products/import/steps/ReviewStep';
import { ExecuteStep } from '@/components/products/import/steps/ExecuteStep';

// Hooks
import { useImportState } from './hooks/useImportState';

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

export default function ProductImporterPage() {
  const { currentStep, reset, fileData, configuration } = useImportState();
  const [existingCategories, setExistingCategories] = useState<Category[]>([]);
  const [existingSuppliers, setExistingSuppliers] = useState<Supplier[]>([]);
  const hasReset = useRef(false);

  // Reset solo si es navegación fresca (sin datos previos) - evita bucle infinito
  useEffect(() => {
    if (!hasReset.current && !fileData && (!configuration.mapping || Object.keys(configuration.mapping).length === 0)) {
      reset();
      console.log('🧹 Estado del importador reiniciado (navegación fresca)');
      hasReset.current = true;
    }
  }, [fileData, configuration, reset]);

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

  // Load existing suppliers on mount
  useEffect(() => {
    fetch('/api/suppliers')
      .then((res) => res.json())
      .then((data) => {
        if (data.suppliers) {
          setExistingSuppliers(data.suppliers);
        }
      })
      .catch(console.error);
  }, []);

  const steps = [
    { label: 'Cargar CSV', description: 'Selecciona el archivo' },
    { label: 'Configurar', description: 'Mapea columnas y opciones' },
    { label: 'Revisar', description: 'Valida datos y categorías' },
    { label: 'Importar', description: 'Ejecuta la importación' },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <UploadStep />;
      case 1:
        return <ConfigurationStep existingCategories={existingCategories} existingSuppliers={existingSuppliers} />;
      case 2:
        return <ReviewStep existingCategories={existingCategories} />;
      case 3:
        return <ExecuteStep existingCategories={existingCategories} />;
      default:
        return <UploadStep />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Importar Productos</h1>
        <p className="text-muted-foreground">
          Importa productos desde un archivo CSV con validación y mapeo inteligente.
        </p>
      </div>

      <WorkOrderStepper
        steps={steps.map((s, i) => ({
          value: i + 1,
          label: s.label,
          icon: [Upload, Settings, Eye, Play][i] || CheckCircle,
        }))}
        currentStep={currentStep + 1}
        className="mb-8"
      />

      <Card className="p-6">
        {renderStep()}
      </Card>
    </div>
  );
}
