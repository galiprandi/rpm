'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  Package,
  Search,
  Filter,
  Eye,
  Save,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type AdjustmentType = 'PERCENTAGE_INC' | 'PERCENTAGE_DEC' | 'FIXED_INC' | 'FIXED_DEC';

interface CostUpdateFilters {
  supplierId?: string;
  categoryId?: string;
  search?: string;
}


interface PreviewItem {
  id: string;
  sku: string;
  name: string;
  currentCost: number;
  newCost: number;
  variationPercent: number;
  warningFlag: boolean;
}

interface PreviewResponse {
  items: PreviewItem[];
  totalItems: number;
  hasNegativeCosts: boolean;
  negativeCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface CostUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type WizardStep = 'filters' | 'adjustment' | 'preview' | 'confirm';

// ============================================================================
// Component
// ============================================================================

export function CostUpdateDialog({ open, onClose, onSuccess }: CostUpdateDialogProps) {

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('filters');

  // Filters state
  const [filters, setFilters] = useState<CostUpdateFilters>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Adjustment state
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('PERCENTAGE_INC');
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');

  // Preview state
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Apply state
  const [isApplying, setIsApplying] = useState(false);

  const loadFiltersData = useCallback(async () => {
    try {
      const [suppliersRes, categoriesRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/categories'),
      ]);

      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        setSuppliers(data.suppliers || []);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  }, []);

  // Load suppliers and categories on mount
  useEffect(() => {
    if (open) {
      setTimeout(() => loadFiltersData(), 0);
    }
  }, [open, loadFiltersData]);

  // Load preview data
  const loadPreview = async (page: number = 1) => {
    if (!adjustmentValue || Number(adjustmentValue) <= 0) {
      toast.error('Ingresa un valor de ajuste válido');
      return;
    }

    setIsLoadingPreview(true);
    try {
      const response = await fetch('/api/cost-updates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters,
          adjustment: {
            type: adjustmentType,
            value: Number(adjustmentValue),
          },
          page,
          pageSize: 20,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cargar preview');
      }

      const data = await response.json();
      setPreview(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Apply cost update
  const applyUpdate = async () => {
    setIsApplying(true);
    try {
      const response = await fetch('/api/cost-updates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters,
          adjustment: {
            type: adjustmentType,
            value: Number(adjustmentValue),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al aplicar actualización');
      }

      const data = await response.json();
      toast.success(`Actualización aplicada: ${data.batch.itemsAffected} productos actualizados`);
      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al aplicar actualización');
    } finally {
      setIsApplying(false);
    }
  };

  // Reset and close
  const handleClose = useCallback(() => {
    setCurrentStep('filters');
    setFilters({});
    setAdjustmentType('PERCENTAGE_INC');
    setAdjustmentValue('');
    setPreview(null);
    onClose();
  }, [onClose]);

  // Navigate to next step
  const goToPreview = () => {
    if (!adjustmentValue || Number(adjustmentValue) <= 0) {
      toast.error('Ingresa un valor de ajuste válido');
      return;
    }
    loadPreview(1);
    setCurrentStep('preview');
  };

  const goToConfirm = () => {
    setCurrentStep('confirm');
  };

  const goBack = () => {
    if (currentStep === 'confirm') {
      setCurrentStep('preview');
    } else if (currentStep === 'preview') {
      setCurrentStep('filters');
      setPreview(null);
    }
  };

  // Column definitions for preview table - memoized to prevent re-renders
  const previewColumns = useMemo<ColumnDef<PreviewItem>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        size: 120,
      },
      {
        accessorKey: 'name',
        header: 'Producto',
        size: 250,
      },
      {
        accessorKey: 'currentCost',
        header: 'Costo Actual',
        size: 120,
        cell: ({ row }) => (
          <span className="font-mono">
            ${row.original.currentCost.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'newCost',
        header: 'Nuevo Costo',
        size: 120,
        cell: ({ row }) => (
          <span
            className={cn(
              'font-mono font-medium',
              row.original.newCost < 0 && 'text-red-600',
              row.original.newCost > row.original.currentCost && 'text-emerald-600',
              row.original.newCost < row.original.currentCost &&
                row.original.newCost >= 0 &&
                'text-orange-600'
            )}
          >
            ${row.original.newCost.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'variationPercent',
        header: 'Variación',
        size: 100,
        cell: ({ row }) => (
          <span
            className={cn(
              'font-medium',
              row.original.warningFlag && 'text-red-600 font-bold',
              !row.original.warningFlag &&
                row.original.variationPercent > 0 &&
                'text-emerald-600',
              !row.original.warningFlag &&
                row.original.variationPercent < 0 &&
                'text-orange-600'
            )}
          >
            {row.original.variationPercent > 0 ? '+' : ''}
            {row.original.variationPercent.toFixed(1)}%
            {row.original.warningFlag && (
              <AlertTriangle className="inline-block w-4 h-4 ml-1" />
            )}
          </span>
        ),
      },
    ],
    []
  );

  // Helper to get adjustment description - memoized
  const adjustmentDescription = useMemo(() => {
    const value = adjustmentValue || '0';
    switch (adjustmentType) {
      case 'PERCENTAGE_INC':
        return `Aumentar ${value}%`;
      case 'PERCENTAGE_DEC':
        return `Disminuir ${value}%`;
      case 'FIXED_INC':
        return `Aumentar $${value}`;
      case 'FIXED_DEC':
        return `Disminuir $${value}`;
    }
  }, [adjustmentType, adjustmentValue]);

  // ============================================================================
  // Step 1: Filters - Memoized handlers to prevent recreation and focus loss
  // ============================================================================

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value || undefined }));
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      categoryId: value === 'all' ? undefined : value,
    }));
  }, []);

  const handleSupplierChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      supplierId: value === 'all' ? undefined : value,
    }));
  }, []);

  const handleAdjustmentTypeChange = useCallback((value: string) => {
    setAdjustmentType(value as AdjustmentType);
  }, []);

  const handleAdjustmentValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAdjustmentValue(e.target.value);
  }, []);

  // Memoize the FiltersStep content, not the function itself
  // Remove handlers from dependencies to prevent re-renders when typing
  const FiltersStepContent = useMemo(() => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filtrar productos a actualizar</span>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Búsqueda</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar por nombre, SKU o código de barras..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={filters.categoryId || 'all'}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor</Label>
            <Select
              value={filters.supplierId || 'all'}
              onValueChange={handleSupplierChange}
            >
              <SelectTrigger id="supplier">
                <SelectValue placeholder="Todos los proveedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proveedores</SelectItem>
                {suppliers.map((sup) => (
                  <SelectItem key={sup.id} value={sup.id}>
                    {sup.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span>Configurar ajuste de costo</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label htmlFor="adjustmentType">Tipo de ajuste</Label>
            <Select
              value={adjustmentType}
              onValueChange={handleAdjustmentTypeChange}
            >
              <SelectTrigger id="adjustmentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE_INC">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Aumentar %
                  </span>
                </SelectItem>
                <SelectItem value="PERCENTAGE_DEC">
                  <span className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    Disminuir %
                  </span>
                </SelectItem>
                <SelectItem value="FIXED_INC">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Aumentar $
                  </span>
                </SelectItem>
                <SelectItem value="FIXED_DEC">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-red-600" />
                    Disminuir $
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Adjustment Value */}
          <div className="space-y-2">
            <Label htmlFor="adjustmentValue">
              {adjustmentType.includes('PERCENTAGE') ? 'Porcentaje' : 'Monto'}
            </Label>
            <div className="relative">
              {adjustmentType.includes('PERCENTAGE') ? (
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              ) : (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
              )}
              <Input
                id="adjustmentValue"
                type="number"
                min="0"
                step={adjustmentType.includes('PERCENTAGE') ? '0.01' : '0.01'}
                placeholder="0.00"
                value={adjustmentValue}
                onChange={handleAdjustmentValueChange}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [filters, categories, suppliers, adjustmentType, adjustmentValue]);

  // ============================================================================
  // Step 2: Preview - useMemo to avoid "created during render" warning
  // ============================================================================

  const PreviewStepContent = useMemo(() => (
    <div className="space-y-4">
      {/* Alert for negative costs */}
      {preview?.hasNegativeCosts && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">
              Advertencia: Costos negativos detectados
            </p>
            <p className="text-sm text-amber-800">
              {preview.negativeCount} producto(s) quedarían con costo negativo.
              Revisa los valores antes de continuar.
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between bg-muted rounded-lg p-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>{preview?.totalItems || 0}</strong> productos afectados
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Ajuste: <strong>{adjustmentDescription}</strong>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Página {preview?.page || 1} de {preview?.totalPages || 1}
        </div>
      </div>

      {/* DataTable */}
      {isLoadingPreview ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : preview?.items.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
          <Package className="w-12 h-12 mb-2" />
          <p>No se encontraron productos con los filtros seleccionados</p>
        </div>
      ) : (
        <DataTable
          data={preview?.items || []}
          columns={previewColumns}
          pageSize={20}
          emptyMessage="No se encontraron productos"
        />
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-100 border border-green-300" />
          <span>Aumento de costo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300" />
          <span>Disminución de costo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-100 border border-red-300" />
          <span>
            Variación &gt; 20%{' '}
            <AlertTriangle className="inline w-3 h-3 text-red-500" />
          </span>
        </div>
      </div>
    </div>
  ), [preview, isLoadingPreview, previewColumns, adjustmentDescription]);

  // ============================================================================
  // Step 3: Confirm - useMemo to avoid "created during render" warning
  // ============================================================================

  const ConfirmStepContent = useMemo(() => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">
              Confirmar actualización masiva
            </p>
            <p className="text-sm text-amber-800">
              Esta acción actualizará el costo de reposición de{' '}
              <strong>{preview?.totalItems}</strong> productos. No se puede
              deshacer automáticamente.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-muted rounded-lg p-4">
        <h4 className="font-medium">Resumen de la operación</h4>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Productos afectados:</span>
            <p className="font-medium text-lg">{preview?.totalItems}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Ajuste aplicado:</span>
            <p className="font-medium text-lg">{adjustmentDescription}</p>
          </div>
        </div>

        {(filters.search || filters.categoryId || filters.supplierId) && (
          <div>
            <span className="text-muted-foreground">Filtros aplicados:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {filters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-background text-xs">
                  <Search className="w-3 h-3 mr-1" />
                  Búsqueda: {filters.search}
                </span>
              )}
              {filters.categoryId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-background text-xs">
                  Categoría:{' '}
                  {categories.find((c) => c.id === filters.categoryId)?.name}
                </span>
              )}
              {filters.supplierId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-background text-xs">
                  Proveedor:{' '}
                  {suppliers.find((s) => s.id === filters.supplierId)?.name}
                </span>
              )}
            </div>
          </div>
        )}

        {preview?.hasNegativeCosts && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {preview.negativeCount} productos quedarán con costo negativo
            </span>
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          Al confirmar, se creará un registro de auditoría con los detalles de
          esta operación.
        </p>
      </div>
    </div>
  ), [preview, adjustmentDescription, filters, categories, suppliers]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStep === 'filters' && (
              <>
                <Filter className="h-5 w-5" />
                Actualización Masiva de Costos - Filtros
              </>
            )}
            {currentStep === 'adjustment' && (
              <>
                <Calculator className="h-5 w-5" />
                Actualización Masiva de Costos - Ajuste
              </>
            )}
            {currentStep === 'preview' && (
              <>
                <Eye className="h-5 w-5" />
                Actualización Masiva de Costos - Vista Previa
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'filters' && 'Configura los filtros para seleccionar los productos a actualizar.'}
            {currentStep === 'adjustment' && 'Define el tipo y valor de ajuste a aplicar a los costos.'}
            {currentStep === 'preview' && 'Revisa la vista previa de cambios antes de aplicar la actualización.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {(['filters', 'adjustment', 'preview', 'confirm'] as WizardStep[]).map(
            (step, index) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    currentStep === step &&
                      'bg-primary text-primary-foreground',
                    currentStep !== step &&
                      (['filters', 'adjustment', 'preview', 'confirm'].indexOf(currentStep) >
                      index
                        ? 'bg-green-100 text-emerald-700'
                        : 'bg-muted text-muted-foreground')
                  )}
                >
                  {['filters', 'adjustment', 'preview', 'confirm'].indexOf(currentStep) >
                  index ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm',
                    currentStep === step
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  {step === 'filters' && 'Filtros'}
                  {step === 'preview' && 'Preview'}
                  {step === 'confirm' && 'Confirmar'}
                </span>
                {index < 2 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
                )}
              </div>
            )
          )}
        </div>

        {/* Step content */}
        {currentStep === 'filters' && FiltersStepContent}
        {currentStep === 'preview' && PreviewStepContent}
        {currentStep === 'confirm' && ConfirmStepContent}

        <DialogFooter className="flex flex-row justify-between gap-2">
          <div className="flex-1">
            {currentStep !== 'filters' && (
              <Button variant="outline" onClick={goBack} disabled={isApplying}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep === 'filters' && (
              <Button
                onClick={goToPreview}
                disabled={!adjustmentValue || Number(adjustmentValue) <= 0}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver Preview
              </Button>
            )}

            {currentStep === 'preview' && preview && preview.items.length > 0 && (
              <Button
                onClick={goToConfirm}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                Continuar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            {currentStep === 'confirm' && (
              <Button
                onClick={applyUpdate}
                disabled={isApplying}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Confirmar Actualización
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
