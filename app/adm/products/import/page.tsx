'use client';

/**
 * Product Importer Page - Versión Moderna
 * /adm/products/import
 * 
 * Flujo de 3 pasos usando arquitectura de componentes modulares
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { WorkOrderStepper } from '@/components/ui/stepper';
import { Upload, Settings, Eye, Play } from 'lucide-react';

// Importar steps modernos
import { UploadStep } from '@/components/products/import/steps/UploadStep';
import { ConfigurationStep } from '@/components/products/import/steps/ConfigurationStep';
import { ReviewStep } from '@/components/products/import/steps/ReviewStep';
import { ExecuteStep } from '@/components/products/import/steps/ExecuteStep';

// Hooks para estado global
import { useImportState } from '@/app/adm/products/import/hooks/useImportState';

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

export default function ProductImporterPage() {
  const { currentStep } = useImportState();
  const [existingCategories, setExistingCategories] = useState<Category[]>([]);
  const [existingSuppliers, setExistingSuppliers] = useState<Supplier[]>([]);

  // Load existing data on mount
  useEffect(() => {
    // Load categories
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setExistingCategories(data.categories);
        }
      })
      .catch(console.error);

    // Load suppliers
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
    { label: 'Configurar', description: 'Mapea columnas' },
    { label: 'Revisar', description: 'Valida datos' },
    { label: 'Importar', description: 'Ejecuta importación' },
  ];

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <UploadStep />;
      case 1:
        return (
          <ConfigurationStep
            existingCategories={existingCategories}
            existingSuppliers={existingSuppliers}
          />
        );
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
          Importa productos desde un archivo CSV con flujo guiado de 4 pasos.
        </p>
      </div>

      <WorkOrderStepper
        steps={steps.map((s, i) => ({
          value: i + 1,
          label: s.label,
          icon: [Upload, Settings, Eye, Play][i] || Play,
        }))}
        currentStep={currentStep + 1}
        className="mb-8"
      />

      <Card className="p-6">
        {renderCurrentStep()}
      </Card>
    </div>
  );
}
