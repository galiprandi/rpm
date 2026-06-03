'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  X,
  Plus,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatARS } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

// ============================================================================
// Types
// ============================================================================

type AdjustmentType = 'PERCENTAGE_INC' | 'PERCENTAGE_DEC' | 'FIXED_INC' | 'FIXED_DEC';
type UpdateTarget = 'REPLACEMENT_COST' | 'PRICE_LIST';

interface CostUpdateFilters {
  supplierId?: string;
  categoryId?: string;
  search?: string;
  priceListId?: string;
  productIds?: string[];
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

interface PriceList {
  id: string;
  name: string;
}

interface CostUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type WizardStep = 'target' | 'selection' | 'adjustment' | 'preview' | 'confirm';

// ============================================================================
// Component
// ============================================================================

export function CostUpdateDialog({ open, onClose, onSuccess }: CostUpdateDialogProps) {

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('target');

  // Configuration state
  const [updateTarget, setUpdateTarget] = useState<UpdateTarget>('REPLACEMENT_COST');
  const [targetPriceListId, setTargetPriceListId] = useState<string>('');

  // Selection state
  const [filters, setFilters] = useState<CostUpdateFilters>({});
  const [manualProductIds, setManualProductIds] = useState<Set<string>>(new Set());
  const [manualProducts, setManualProducts] = useState<Array<{id: string, name: string, sku: string}>>([]);
  const [excludedProductIds, setExcludedProductIds] = useState<Set<string>>(new Set());

  // Data state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);

  // Adjustment state
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('PERCENTAGE_INC');
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');

  // Preview state
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Apply state
  const [isApplying, setIsApplying] = useState(false);

  // Search state for manual selection
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{id: string, name: string, sku: string}>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      const [suppliersRes, categoriesRes, priceListsRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/categories'),
        fetch('/api/price-lists'),
      ]);

      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        setSuppliers(data.suppliers || []);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }

      if (priceListsRes.ok) {
        const data = await priceListsRes.json();
        setPriceLists(data.priceLists || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open, loadInitialData]);

  // Search products for manual selection
  const searchProducts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/products-services/search?q=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results.filter((r: any) => r.type === 'product'));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchTerm) {
      searchTimeoutRef.current = setTimeout(() => searchProducts(searchTerm), 300);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, searchProducts]);

  const addManualProduct = (product: {id: string, name: string, sku: string}) => {
    if (manualProductIds.has(product.id)) return;

    setManualProductIds(prev => new Set(prev).add(product.id));
    setManualProducts(prev => [...prev, product]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeManualProduct = (id: string) => {
    setManualProductIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setManualProducts(prev => prev.filter(p => p.id !== id));
  };

  // Load preview data
  const loadPreview = async (page: number = 1) => {
    if (!adjustmentValue || Number(adjustmentValue) <= 0) {
      toast.error('Ingresa un valor de ajuste válido');
      return;
    }

    setIsLoadingPreview(true);
    try {
      const activeFilters = {
        ...filters,
        priceListId: updateTarget === 'PRICE_LIST' ? targetPriceListId : undefined,
        productIds: manualProductIds.size > 0 ? Array.from(manualProductIds) : undefined,
      };

      const response = await fetch('/api/cost-updates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: activeFilters,
          adjustment: {
            type: adjustmentType,
            value: Number(adjustmentValue),
          },
          page,
          pageSize: 100, // Show more in the new UX
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cargar preview');
      }

      const data = await response.json();
      setPreview(data);
      // Reset exclusions when loading new preview
      setExcludedProductIds(new Set());
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
      const activeFilters = {
        ...filters,
        priceListId: updateTarget === 'PRICE_LIST' ? targetPriceListId : undefined,
        // If we are applying, we need to respect exclusions
        // For simplicity, if there are exclusions, we switch to specific productIds
        productIds: preview?.items
          .filter(item => !excludedProductIds.has(item.id))
          .map(item => item.id) || Array.from(manualProductIds),
      };

      const response = await fetch('/api/cost-updates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: activeFilters,
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
    setCurrentStep('target');
    setUpdateTarget('REPLACEMENT_COST');
    setTargetPriceListId('');
    setFilters({});
    setManualProductIds(new Set());
    setManualProducts([]);
    setExcludedProductIds(new Set());
    setAdjustmentType('PERCENTAGE_INC');
    setAdjustmentValue('');
    setPreview(null);
    onClose();
  }, [onClose]);

  // Navigation
  const goToSelection = () => {
    if (updateTarget === 'PRICE_LIST' && !targetPriceListId) {
      toast.error('Selecciona una lista de precios');
      return;
    }
    setCurrentStep('selection');
  };

  const goToAdjustment = () => {
    if (manualProductIds.size === 0 && !filters.categoryId && !filters.supplierId && !filters.search) {
      toast.error('Selecciona al menos un producto o aplica un filtro');
      return;
    }
    setCurrentStep('adjustment');
  };

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
    const steps: WizardStep[] = ['target', 'selection', 'adjustment', 'preview', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const toggleExclusion = useCallback((id: string) => {
    setExcludedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Column definitions for preview table
  const previewColumns = useMemo<ColumnDef<PreviewItem>[]>(
    () => [
      {
        id: 'select',
        header: '',
        size: 40,
        cell: ({ row }) => (
          <Checkbox
            checked={!excludedProductIds.has(row.original.id)}
            onCheckedChange={() => toggleExclusion(row.original.id)}
            aria-label="Incluir producto"
          />
        ),
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        size: 100,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.sku}</span>
      },
      {
        accessorKey: 'name',
        header: 'Producto',
        size: 250,
      },
      {
        accessorKey: 'currentCost',
        header: updateTarget === 'PRICE_LIST' ? 'Precio Actual' : 'Costo Actual',
        size: 120,
        cell: ({ row }) => (
          <span className="font-mono">
            {formatARS(row.original.currentCost)}
          </span>
        ),
      },
      {
        accessorKey: 'newCost',
        header: updateTarget === 'PRICE_LIST' ? 'Nuevo Precio' : 'Nuevo Costo',
        size: 120,
        cell: ({ row }) => (
          <span
            className={cn(
              'font-mono font-medium',
              row.original.newCost < 0 && 'text-red-600',
              row.original.newCost > row.original.currentCost && 'text-emerald-600',
              row.original.newCost < row.original.currentCost &&
                row.original.newCost >= 0 &&
                'text-orange-600',
              excludedProductIds.has(row.original.id) && 'text-muted-foreground opacity-50'
            )}
          >
            {formatARS(row.original.newCost)}
          </span>
        ),
      },
      {
        accessorKey: 'variationPercent',
        header: 'Var.',
        size: 80,
        cell: ({ row }) => (
          <span
            className={cn(
              'font-medium text-xs',
              row.original.warningFlag && 'text-red-600 font-bold',
              !row.original.warningFlag &&
                row.original.variationPercent > 0 &&
                'text-emerald-600',
              !row.original.warningFlag &&
                row.original.variationPercent < 0 &&
                'text-orange-600',
              excludedProductIds.has(row.original.id) && 'opacity-30'
            )}
          >
            {row.original.variationPercent > 0 ? '+' : ''}
            {row.original.variationPercent.toFixed(1)}%
          </span>
        ),
      },
    ],
    [excludedProductIds, updateTarget, toggleExclusion]
  );

  const adjustmentDescription = useMemo(() => {
    const value = adjustmentValue || '0';
    switch (adjustmentType) {
      case 'PERCENTAGE_INC': return `Aumentar ${value}%`;
      case 'PERCENTAGE_DEC': return `Disminuir ${value}%`;
      case 'FIXED_INC': return `Aumentar $${value}`;
      case 'FIXED_DEC': return `Disminuir $${value}`;
    }
  }, [adjustmentType, adjustmentValue]);

  // ============================================================================
  // Step Renderers
  // ============================================================================

  const TargetStep = (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-1 gap-4">
        <div
          className={cn(
            "relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-muted/50",
            updateTarget === 'REPLACEMENT_COST' ? "border-primary bg-primary/5" : "border-muted"
          )}
          onClick={() => setUpdateTarget('REPLACEMENT_COST')}
        >
          <div className="flex items-center gap-3 mb-2">
            <Package className={cn("w-6 h-6", updateTarget === 'REPLACEMENT_COST' ? "text-primary" : "text-muted-foreground")} />
            <h3 className="font-bold">Costo de Reposición</h3>
            {updateTarget === 'REPLACEMENT_COST' && <CheckCircle className="ml-auto w-5 h-5 text-primary" />}
          </div>
          <p className="text-sm text-muted-foreground">
            Afecta el costo base de los productos. Esto impactará en todas las listas de precios que no tengan un precio fijo definido.
          </p>
        </div>

        <div
          className={cn(
            "relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-muted/50",
            updateTarget === 'PRICE_LIST' ? "border-primary bg-primary/5" : "border-muted"
          )}
          onClick={() => setUpdateTarget('PRICE_LIST')}
        >
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className={cn("w-6 h-6", updateTarget === 'PRICE_LIST' ? "text-primary" : "text-muted-foreground")} />
            <h3 className="font-bold">Lista de Precios Específica</h3>
            {updateTarget === 'PRICE_LIST' && <CheckCircle className="ml-auto w-5 h-5 text-primary" />}
          </div>
          <p className="text-sm text-muted-foreground">
            Afecta solamente a una lista de precios. Crea o actualiza excepciones de precio fijo para los productos seleccionados.
          </p>

          {updateTarget === 'PRICE_LIST' && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="priceList" className="mb-2 block">Seleccionar Lista de Precios</Label>
              <Select value={targetPriceListId} onValueChange={setTargetPriceListId}>
                <SelectTrigger id="priceList">
                  <SelectValue placeholder="Selecciona una lista..." />
                </SelectTrigger>
                <SelectContent>
                  {priceLists.map(pl => (
                    <SelectItem key={pl.id} value={pl.id}>{pl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const SelectionStep = (
    <div className="space-y-6 py-2">
      <div className="space-y-4">
        <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filtros Masivos (Wildcard)</span>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Busca por nombre, SKU o usa wildcard: led+cronos..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría</Label>
              <Select
                value={filters.categoryId || 'all'}
                onValueChange={(v) => setFilters(prev => ({...prev, categoryId: v === 'all' ? undefined : v}))}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Proveedor</Label>
              <Select
                value={filters.supplierId || 'all'}
                onValueChange={(v) => setFilters(prev => ({...prev, supplierId: v === 'all' ? undefined : v}))}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Plus className="w-4 h-4 text-primary" />
            <span>Selección Individual</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Busca y agrega productos específicos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />

            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map(p => (
                  <button
                    key={p.id}
                    className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between text-sm"
                    onClick={() => addManualProduct(p)}
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {manualProducts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {manualProducts.map(p => (
                <Badge key={p.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                  <span className="max-w-[150px] truncate">{p.name}</span>
                  <button onClick={() => removeManualProduct(p.id)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const AdjustmentStep = (
    <div className="space-y-6 py-4 max-w-md mx-auto">
      <div className="bg-muted/30 p-6 rounded-2xl border space-y-6">
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg">Definir Ajuste</h3>
          <p className="text-sm text-muted-foreground">¿Cómo quieres ajustar los precios?</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Ajuste</Label>
            <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as AdjustmentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE_INC">Aumento porcentual (%)</SelectItem>
                <SelectItem value="PERCENTAGE_DEC">Disminución porcentual (%)</SelectItem>
                <SelectItem value="FIXED_INC">Aumento monto fijo ($)</SelectItem>
                <SelectItem value="FIXED_DEC">Disminución monto fijo ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{adjustmentType.includes('PERCENTAGE') ? 'Porcentaje' : 'Monto en Pesos'}</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {adjustmentType.includes('PERCENTAGE') ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(e.target.value)}
                className="pl-9 text-lg font-bold"
                autoFocus
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-muted-foreground">Acción:</span>
            <span className={cn(
              "px-3 py-1 rounded-full",
              adjustmentType.includes('INC') ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            )}>
              {adjustmentDescription}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const PreviewStep = (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Productos Afectados</span>
            <span className="text-xl font-bold">{preview?.totalItems || 0}</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ajuste Seleccionado</span>
            <span className="text-sm font-semibold">{adjustmentDescription}</span>
          </div>
        </div>

        {excludedProductIds.size > 0 && (
          <Badge variant="destructive" className="animate-in zoom-in duration-200">
            {excludedProductIds.size} excluidos
          </Badge>
        )}
      </div>

      <div className="border rounded-xl overflow-hidden bg-background">
        {isLoadingPreview ? (
          <div className="h-80 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generando vista previa...</p>
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto">
            <DataTable
              data={preview?.items || []}
              columns={previewColumns}
              pageSize={100}
              emptyMessage="No se encontraron productos"
            />
          </div>
        )}
      </div>

      <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded-lg flex items-start gap-2">
        <AlertTriangle className="w-3 h-3 text-orange-500 shrink-0" />
        <p>Desmarca los productos que NO quieras actualizar en este lote. Los cambios se aplicarán solo a los elementos seleccionados.</p>
      </div>
    </div>
  );

  const ConfirmStep = (
    <div className="space-y-6 py-4">
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-amber-900">Confirmación Final</h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              Estás a punto de aplicar un ajuste masivo. Esta acción actualizará los valores de los productos seleccionados y no se puede deshacer de forma automática.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/50 p-4 rounded-xl space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Destino</span>
          <p className="font-bold text-lg flex items-center gap-2">
            {updateTarget === 'REPLACEMENT_COST' ? <Package className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
            {updateTarget === 'REPLACEMENT_COST' ? 'Costo de Reposición' : `Lista: ${priceLists.find(p => p.id === targetPriceListId)?.name}`}
          </p>
        </div>
        <div className="bg-muted/50 p-4 rounded-xl space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Ajuste</span>
          <p className={cn(
            "font-bold text-lg flex items-center gap-2",
            adjustmentType.includes('INC') ? "text-emerald-600" : "text-red-600"
          )}>
            {adjustmentType.includes('INC') ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {adjustmentDescription}
          </p>
        </div>
        <div className="bg-muted/50 p-4 rounded-xl space-y-1 col-span-2">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Productos</span>
          <p className="font-bold text-lg">
            {(preview?.totalItems || 0) - excludedProductIds.size} productos a procesar
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 border-b bg-muted/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Calculator className="h-6 w-6 text-primary" />
              Gestión Masiva de Precios
            </DialogTitle>
            <DialogDescription>
              Actualiza precios o costos en lotes de forma rápida y segura.
            </DialogDescription>
          </DialogHeader>

          {/* New Progress Indicator */}
          <div className="flex items-center justify-between mt-6 max-w-2xl mx-auto">
            {['target', 'selection', 'adjustment', 'preview', 'confirm'].map((step, idx) => {
              const steps: WizardStep[] = ['target', 'selection', 'adjustment', 'preview', 'confirm'];
              const isActive = currentStep === step;
              const isCompleted = steps.indexOf(currentStep) > idx;

              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                    isActive ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20" :
                    isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                    "bg-background border-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  {idx < 4 && (
                    <div className={cn(
                      "h-1 flex-1 mx-2 rounded-full",
                      isCompleted ? "bg-emerald-500" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
          {currentStep === 'target' && TargetStep}
          {currentStep === 'selection' && SelectionStep}
          {currentStep === 'adjustment' && AdjustmentStep}
          {currentStep === 'preview' && PreviewStep}
          {currentStep === 'confirm' && ConfirmStep}
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10 gap-3">
          <Button variant="outline" onClick={currentStep === 'target' ? handleClose : goBack} disabled={isApplying} className="px-6">
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep === 'target' ? 'Cerrar' : 'Atrás'}
          </Button>

          <div className="flex-1" />

          {currentStep === 'target' && (
            <Button onClick={goToSelection} className="px-8 font-bold">
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {currentStep === 'selection' && (
            <Button onClick={goToAdjustment} className="px-8 font-bold">
              Definir Ajuste
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {currentStep === 'adjustment' && (
            <Button
              onClick={goToPreview}
              disabled={!adjustmentValue || Number(adjustmentValue) <= 0}
              className="px-8 font-bold"
            >
              Ver Vista Previa
              <Eye className="w-4 h-4 ml-2" />
            </Button>
          )}

          {currentStep === 'preview' && (
            <Button
              onClick={goToConfirm}
              disabled={isLoadingPreview || (preview?.items.length === 0)}
              className="px-8 font-bold"
            >
              Confirmar
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {currentStep === 'confirm' && (
            <Button
              onClick={applyUpdate}
              disabled={isApplying}
              className="px-10 font-bold bg-emerald-600 hover:bg-emerald-700"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  ¡Aplicar Ahora!
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
