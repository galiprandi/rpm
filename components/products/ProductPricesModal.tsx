'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ModalBase } from '@/components/ui/ModalBase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Pencil, Calculator } from 'lucide-react';
import { calculateMarginPercentage, applyRounding, type RoundingRule } from '@/lib/utils/rounding';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PriceList } from '@/lib/services';
import { formatPrice } from '@/components/ui/price-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductPriceInfo {
  priceListId: string;
  priceListName: string;
  baseMargin: number;
  roundingRule: string;
  finalPrice: number;
  actualMargin: number;
  isBelowMinimum: boolean;
  fixedPrice: number | null;
}

interface Product {
  id: string;
  name: string;
  replacementCost?: number;
  costPrice: number;
}

interface ProductPricesModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

type EditMode = 'override' | 'fixed' | 'default';

export function ProductPricesModal({ isOpen, onClose, product }: ProductPricesModalProps) {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [prices, setPrices] = useState<ProductPriceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<{
    id: string;
    name: string;
    roundingRule: RoundingRule;
    baseMargin: number;
  } | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('default');
  const [overrideMargin, setOverrideMargin] = useState<string>('');
  const [fixedPrice, setFixedPrice] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [hasExistingException, setHasExistingException] = useState(false);
  const [existingItemId, setExistingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      fetchPriceLists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product]);

  const fetchPriceLists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/price-lists');
      const data = await response.json();
      const lists = data.priceLists || [];
      setPriceLists(lists);

      // Calculate prices for each list
      const calculatedPrices = await Promise.all(
        lists.map(async (list: PriceList) => {
          const priceResponse = await fetch(
            `/api/price-lists/${list.id}/calculate-price?productId=${product!.id}`
          );
          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            return {
              priceListId: list.id,
              priceListName: list.name,
              baseMargin: list.baseMarginPercentage,
              roundingRule: list.roundingRule,
              finalPrice: priceData.finalPrice,
              actualMargin: priceData.actualMargin,
              isBelowMinimum: priceData.isBelowMinimum,
              fixedPrice: priceData.fixedPrice || null,
            };
          }
          return null;
        })
      );

      setPrices(calculatedPrices.filter((p): p is ProductPriceInfo => p !== null));
    } catch (error) {
      console.error('Error fetching price lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMargin = async (
    priceListId: string,
    priceListName: string,
    roundingRule: RoundingRule,
    baseMargin: number
  ) => {
    setEditingPriceList({ id: priceListId, name: priceListName, roundingRule, baseMargin });
    
    // Check if there's an existing exception for this product in this price list
    try {
      const response = await fetch(`/api/price-lists/${priceListId}/items`);
      if (response.ok) {
        const data = await response.json();
        const existingItem = data.items?.find(
          (item: { productId: string }) => item.productId === product?.id
        );
        
        if (existingItem) {
          setHasExistingException(true);
          setExistingItemId(existingItem.id);
          
          // Set initial mode based on existing exception type
          if (existingItem.fixedPrice !== null && existingItem.fixedPrice !== undefined) {
            setEditMode('fixed');
            setFixedPrice(existingItem.fixedPrice.toString());
            setOverrideMargin('');
          } else if (existingItem.overrideMarginPercentage !== null && existingItem.overrideMarginPercentage !== undefined) {
            setEditMode('override');
            setOverrideMargin(existingItem.overrideMarginPercentage.toString());
            setFixedPrice('');
          } else {
            setEditMode('default');
            setOverrideMargin('');
            setFixedPrice('');
          }
        } else {
          setHasExistingException(false);
          setExistingItemId(null);
          setEditMode('default');
          setOverrideMargin('');
          setFixedPrice('');
        }
      }
    } catch (error) {
      console.error('Error fetching price list items:', error);
      setHasExistingException(false);
      setExistingItemId(null);
      setEditMode('default');
    }
    
    setEditDialogOpen(true);
  };

  const handleSaveException = async () => {
    if (!editingPriceList || !product) return;
    
    setSaving(true);
    try {
      // If mode is 'default' and there's an existing exception, delete it
      if (editMode === 'default' && hasExistingException && existingItemId) {
        const response = await fetch(
          `/api/price-lists/${editingPriceList.id}/items/${existingItemId}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          setEditDialogOpen(false);
          setHasExistingException(false);
          setExistingItemId(null);
          fetchPriceLists();
        } else {
          const error = await response.json();
          console.error('Error deleting exception:', error);
        }
        return;
      }

      // If mode is 'default' but no existing exception, just close
      if (editMode === 'default') {
        setEditDialogOpen(false);
        return;
      }

      const body: {
        productId: string;
        overrideMarginPercentage?: number | null;
        fixedPrice?: number | null;
      } = {
        productId: product.id,
      };

      if (editMode === 'override' && overrideMargin !== '') {
        body.overrideMarginPercentage = parseFloat(overrideMargin);
        body.fixedPrice = null;
      } else if (editMode === 'fixed' && fixedPrice !== '') {
        body.fixedPrice = parseFloat(fixedPrice);
        body.overrideMarginPercentage = null;
      } else {
        // No changes
        setEditDialogOpen(false);
        return;
      }

      const response = await fetch(`/api/price-lists/${editingPriceList.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setEditDialogOpen(false);
        setHasExistingException(true);
        // Refresh prices
        fetchPriceLists();
      } else {
        const error = await response.json();
        console.error('Error saving exception:', error);
      }
    } catch (error) {
      console.error('Error saving exception:', error);
    } finally {
      setSaving(false);
    }
  };

  // Sort prices: first alerts, then alphabetically
  const sortedPrices = useMemo(() => {
    return [...prices].sort((a, b) => {
      // First sort by alert (alerts first)
      if (a.isBelowMinimum && !b.isBelowMinimum) return -1;
      if (!a.isBelowMinimum && b.isBelowMinimum) return 1;
      // Then alphabetically by list name
      return a.priceListName.localeCompare(b.priceListName);
    });
  }, [prices]);

  const availableListsCount = priceLists.length;

  const getRoundingRuleLabel = (rule: string) => {
    const labels: Record<string, string> = {
      EXACT: 'Exacto',
      NEAREST_INTEGER: 'Entero',
      PSYCHOLOGICAL: 'Psicológico',
      SMART_HUNDREDS: 'Inteligente',
    };
    return labels[rule] || rule;
  };

  const columns: ColumnDef<ProductPriceInfo>[] = [
    {
      accessorKey: 'priceListName',
      header: 'Lista de Precios',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.priceListName}</span>
          {row.original.fixedPrice !== null && (
            <Badge variant="default" className="text-xs bg-blue-500">
              Precio fijo
            </Badge>
          )}
          {row.original.isBelowMinimum && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Margen bajo
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'baseMargin',
      header: 'Margen Base',
      cell: ({ row }) => <Badge variant="secondary">{row.original.baseMargin}%</Badge>,
    },
    {
      accessorKey: 'roundingRule',
      header: 'Redondeo',
      cell: ({ row }) => <Badge variant="outline">{getRoundingRuleLabel(row.original.roundingRule)}</Badge>,
    },
    {
      accessorKey: 'finalPrice',
      header: 'Precio Final',
      cell: ({ row }) => (
        <span className="font-bold text-lg text-primary">
          {formatPrice(row.original.finalPrice)}
        </span>
      ),
    },
    {
      accessorKey: 'actualMargin',
      header: 'Margen Real',
      cell: ({ row }) => {
        const isLow = row.original.isBelowMinimum;
        return (
          <span className={isLow ? 'text-red-700 font-bold' : 'text-muted-foreground'}>
            {row.original.actualMargin.toFixed(1)}%
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                handleEditMargin(
                  row.original.priceListId,
                  row.original.priceListName,
                  row.original.roundingRule as RoundingRule,
                  row.original.baseMargin
                )
              }
              aria-label={`Editar margen para ${row.original.priceListName}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar margen específico</TooltipContent>
        </Tooltip>
      ),
    },
  ];

  if (!product) return null;

  const replacementCost = product.replacementCost || product.costPrice;

  return (
    <>
      <ModalBase
        isOpen={isOpen}
        onClose={onClose}
        title={`Precios Calculados: ${product.name}`}
        description="Revisa los precios calculados para este producto según las diferentes listas de precios configuradas."
        maxWidth="4xl"
        maxHeight="max-h-[80vh]"
      >
        {/* Replacement Cost Section */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Costo de Reposición</p>
              <p className="text-2xl font-bold">{formatPrice(replacementCost)}</p>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              {availableListsCount} {availableListsCount === 1 ? 'lista' : 'listas'} disponibles
            </Badge>
          </div>
        </div>

        {/* Prices Table */}
        {loading ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 p-3 border-b flex gap-4">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-4 flex-1" />)}
              </div>
              {[1, 2, 3].map((row) => (
                <div key={row} className="p-4 border-b last:border-0 flex gap-4">
                  {[1, 2, 3, 4, 5].map((col) => <Skeleton key={col} className="h-8 flex-1" />)}
                </div>
              ))}
            </div>
          </div>
        ) : sortedPrices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay listas de precios activas para calcular.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={sortedPrices}
            title={`Precios por Lista (${sortedPrices.length})`}
          />
        )}
      </ModalBase>

      {/* Edit Exception Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Editar Precio: {editingPriceList?.name}
            </DialogTitle>
            <DialogDescription>
              Modifica el precio de este producto para la lista de precios seleccionada.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Replacement Cost Display */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Costo de Reposición</p>
              <p className="text-xl font-bold">{formatPrice(replacementCost)}</p>
            </div>

            {/* Mode selector buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={editMode === 'default' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode('default')}
                className={hasExistingException && editMode === 'default' ? 'border-green-500' : ''}
                aria-label="Usar configuración por defecto de la lista"
              >
                Por defecto
              </Button>
              <Button
                type="button"
                variant={editMode === 'override' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode('override')}
                aria-label="Establecer un margen específico en porcentaje"
              >
                Margen específico (%)
              </Button>
              <Button
                type="button"
                variant={editMode === 'fixed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode('fixed')}
                aria-label="Establecer un precio fijo en pesos"
              >
                Precio fijo ($)
              </Button>
            </div>
            
            {/* Show info when default mode */}
            {editMode === 'default' && (
              <div className="space-y-3">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 transition-all">
                  <p className="text-sm text-muted-foreground mb-1">
                    Usará el margen base de la lista ({editingPriceList?.baseMargin}%)
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(applyRounding(
                      replacementCost * (1 + (editingPriceList?.baseMargin || 0) / 100),
                      editingPriceList?.roundingRule || 'SMART_HUNDREDS'
                    ))}
                  </p>
                </div>
                
                {hasExistingException && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Atención:</strong> Este producto tiene un precio personalizado.
                      Guardar en modo &quot;Por defecto&quot; eliminará la excepción y volverá al precio calculado con el margen base.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {editMode === 'override' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="overrideMargin">Margen específico (%)</Label>
                  <Input
                    id="overrideMargin"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Ej: 35.5"
                    value={overrideMargin}
                    onChange={(e) => setOverrideMargin(e.target.value)}
                    className="w-full mt-1"
                    aria-label="Ingrese el porcentaje de margen deseado"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sobrescribe el margen base ({editingPriceList?.baseMargin}%)
                  </p>
                </div>
                
                {/* Preview calculated price */}
                {overrideMargin !== '' && !isNaN(parseFloat(overrideMargin)) && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 transition-all">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calculator className="h-4 w-4" />
                      <span>Precio resultante:</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(applyRounding(
                        replacementCost * (1 + parseFloat(overrideMargin) / 100),
                        editingPriceList?.roundingRule || 'SMART_HUNDREDS'
                      ))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Redondeo: {editingPriceList ? getRoundingRuleLabel(editingPriceList.roundingRule) : 'Inteligente'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {editMode === 'fixed' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="fixedPrice">Precio fijo ($)</Label>
                  <Input
                    id="fixedPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej: 15000"
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                    className="w-full mt-1"
                    aria-label="Ingrese el precio fijo en pesos"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Precio final exacto para este producto
                  </p>
                </div>

                {/* Preview calculated margin */}
                {fixedPrice !== '' && !isNaN(parseFloat(fixedPrice)) && replacementCost > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 transition-all">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calculator className="h-4 w-4" />
                      <span>Margen resultante:</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {calculateMarginPercentage(replacementCost, parseFloat(fixedPrice)).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sobre el costo de reposición
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveException}
              loading={saving}
              disabled={editMode === 'override' ? !overrideMargin : editMode === 'fixed' ? !fixedPrice : false}
            >
              {editMode === 'default' && hasExistingException ? 'Eliminar excepción' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
