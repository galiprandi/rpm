'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Search, Trash2, Package, Wrench, Minus, Plus as PlusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatARS } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';

/**
 * ProductServiceSelector
 *
 * Search and selection component for products and services with integrated cart.
 * Cart state is ephemeral (lives only in memory during the session).
 *
 * @example
 * // Basic usage in QuickSaleModal
 * <ProductServiceSelector
 *   showPriceListSelector
 *   showCategoryFilter
 *   priceLists={priceLists}
 *   categories={categories}
 *   onSelectionChange={(items) => setCartItems(items)}
 *   onQuickCreate={() => setShowQuickServiceDialog(true)}
 * />
 *
 * @example
 * // Usage in Work Order with initial items
 * <ProductServiceSelector
 *   showPriceListSelector
 *   priceLists={priceLists}
 *   defaultPriceListId={selectedPriceListId}
 *   initialItems={existingItems}
 *   onSelectionChange={(items) => setWorkOrderItems(items)}
 * />
 *
 * @example
 * // Without selected table (parent handles its own UI)
 * <ProductServiceSelector
 *   showSelectedTable={false}
 *   priceLists={priceLists}
 *   onSelectionChange={(items) => setSelectedItems(items)}
 * />
 */

// Types
export interface SelectedItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  isManualPrice: boolean;
  priceListId?: string;
  sku?: string;
  stock?: number;
  categoryId?: string;
  categoryName?: string;
}

interface PriceInfo {
  finalPrice: number;
  isBelowMinimum: boolean;
}

interface SearchResult {
  id: string;
  type: 'product' | 'service';
  name: string;
  basePrice: number;
  minimumPrice?: number;
  isBelowMinimum?: boolean;
  allPrices?: Record<string, PriceInfo>;
  sku?: string;
  stock?: number;
  categoryId?: string;
  categoryName?: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
}

interface PriceList {
  id: string;
  name: string;
  baseMarginPercentage: number;
}

interface ProductServiceSelectorProps {
  showPriceListSelector?: boolean;
  defaultPriceListId?: string;
  showCategoryFilter?: boolean;
  showQuickCreate?: boolean;
  showSelectedTable?: boolean;
  initialItems?: SelectedItem[];
  onSelectionChange: (items: SelectedItem[]) => void;
  onQuickCreate?: () => void;
  searchEndpoint?: string;
  categories?: Category[];
  priceLists?: PriceList[];
}

export function ProductServiceSelector({
  showPriceListSelector = false,
  defaultPriceListId = '',
  showCategoryFilter = false,
  showQuickCreate = false,
  showSelectedTable = true,
  initialItems = [],
  onSelectionChange,
  onQuickCreate,
  searchEndpoint = '/api/products-services/search',
  categories = [],
  priceLists = [],
}: ProductServiceSelectorProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('none');
  
  // Default price list: prop > first in list > empty
  const defaultPriceList = defaultPriceListId || priceLists[0]?.id || '';
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>(defaultPriceList);

  // Cart state - efímero, solo vive en memoria durante la sesión
  const [cartItems, setCartItems] = useState<SelectedItem[]>(initialItems);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Helper simple para actualizar carrito y notificar al parent
  const updateCartAndNotify = (newItems: SelectedItem[]) => {
    setCartItems(newItems);
    onSelectionChange(newItems);
  };

  // Cache for all prices by product ID
  const priceCacheRef = useRef<Map<string, Record<string, PriceInfo>>>(new Map());

  // Debounced search - search function defined inside effect to avoid dependency issues
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    
    setSearchLoading(true);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams();
      params.set('q', searchTerm);
      if (selectedCategoryId && selectedCategoryId !== 'none') {
        params.set('categoryId', selectedCategoryId);
      }
      if (selectedPriceListId && selectedPriceListId !== 'none') {
        params.set('priceListId', selectedPriceListId);
      }
      params.set('limit', '20');

      try {
        const response = await fetch(`${searchEndpoint}?${params.toString()}`);
        const data = await response.json();
        
        // Cache all prices for each product
        for (const result of data.results || []) {
          if (result.allPrices) {
            priceCacheRef.current.set(result.id, result.allPrices);
          }
        }
        
        setSearchResults(data.results || []);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, selectedCategoryId, selectedPriceListId, searchEndpoint]);

  // Update prices when price list changes (use cache if available)
  useEffect(() => {
    if (searchTerm.length < 2 || searchResults.length === 0) return;
    
    // Update displayed prices from cache
    const updatedResults = searchResults.map(result => {
      if (result.type === 'product' && priceCacheRef.current.has(result.id)) {
        const cachedPrices = priceCacheRef.current.get(result.id);
        if (selectedPriceListId !== 'none' && cachedPrices?.[selectedPriceListId]) {
          const priceInfo = cachedPrices[selectedPriceListId];
          return {
            ...result,
            basePrice: priceInfo.finalPrice,
            isBelowMinimum: priceInfo.isBelowMinimum,
          };
        }
      }
      return result;
    });
    
    setSearchResults(updatedResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPriceListId]);

  const addToCart = (result: SearchResult) => {
    const existingIndex = cartItems.findIndex(item => item.id === result.id);
    
    if (existingIndex >= 0) {
      // Incrementar cantidad
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      updateCartAndNotify(updated);
    } else {
      // Agregar nuevo item
      const newItem: SelectedItem = {
        id: result.id,
        type: result.type,
        name: result.name,
        quantity: 1,
        unitPrice: result.basePrice,
        originalPrice: result.basePrice,
        isManualPrice: false,
        priceListId: selectedPriceListId !== 'none' ? selectedPriceListId : undefined,
        sku: result.sku,
        stock: result.stock,
        categoryId: result.categoryId,
        categoryName: result.categoryName,
      };
      updateCartAndNotify([...cartItems, newItem]);
    }

    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const removeFromCart = (index: number) => {
    updateCartAndNotify(cartItems.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    if (index < 0 || index >= cartItems.length) return;
    
    const item = cartItems[index];
    const newQuantity = item.quantity + delta;
    
    if (newQuantity <= 0) {
      updateCartAndNotify(cartItems.filter((_, i) => i !== index));
      return;
    }

    const updated = [...cartItems];
    updated[index] = { ...item, quantity: newQuantity };
    updateCartAndNotify(updated);
  };

  const updatePrice = (index: number, newPrice: number) => {
    if (index < 0 || index >= cartItems.length) return;
    const item = cartItems[index];
    const updated = [...cartItems];
    updated[index] = { ...item, unitPrice: Math.max(0, newPrice), isManualPrice: true };
    updateCartAndNotify(updated);
  };

  const handleQuickCreate = () => {
    setShowResults(false);
    onQuickCreate?.();
  };

  const total = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div ref={containerRef} className="space-y-4 w-full">
      {/* Search and Filters */}
      <div className="space-y-3 w-full">
        {/* Filters row */}
        {(showCategoryFilter || showPriceListSelector) && (
          <div className="flex gap-3 w-full">
            {showCategoryFilter && (
              <div className="w-[70%] min-w-[200px] space-y-1.5">
                <label className="text-sm font-medium">Categoría</label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todas las categorías</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showPriceListSelector && (
              <div className="w-[30%] min-w-[140px] space-y-1.5">
                <label className="text-sm font-medium">Lista de Precios</label>
                <Select value={selectedPriceListId} onValueChange={setSelectedPriceListId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lista" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceLists.map(pl => (
                      <SelectItem key={pl.id} value={pl.id}>
                        {pl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Search input */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar: led+cronos (ambas) o filtro aire (cualquiera)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="pl-10"
          />
        </div>

        {/* Search results dropdown - always visible with fixed height */}
        <div className="border rounded-md shadow-lg bg-popover z-50 h-[35vh] max-h-80 overflow-hidden w-full">
          <div className="h-full overflow-y-auto overflow-x-hidden">
            {!showResults ? (
              <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground px-4 text-center">
                <span>Escribe para buscar productos o servicios</span>
                <span className="text-xs mt-1 opacity-70">led+cronos (ambas) · &quot;LED-123&quot; (exacto) · filtro aire (cualquiera)</span>
              </div>
            ) : searchTerm.length < 2 ? (
              <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground px-4 text-center">
                <span>Escribe al menos 2 caracteres</span>
                <span className="text-xs mt-1 opacity-70">led+cronos (ambas) · fiat cronos (cualquiera) · &quot;ABC-123&quot; (exacto)</span>
              </div>
            ) : searchLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Buscando...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No se encontraron resultados
              </div>
            ) : (
              <>
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    className={cn(
                      'w-full px-4 py-2 text-left hover:bg-accent transition-colors border-b last:border-0',
                      'grid grid-cols-[1fr_auto] gap-3 items-center'
                    )}
                    onClick={() => addToCart(result)}
                  >
                    <div className="min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2">
                        {result.type === 'product' ? (
                          <Package className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        ) : (
                          <Wrench className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{result.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 pl-6 min-w-0">
                        <Badge variant="outline" className="text-xs flex-shrink-0 h-5 px-1.5">
                          {result.type === 'product' ? 'Producto' : 'Servicio'}
                        </Badge>
                        {result.type === 'product' ? (
                          <span className="text-xs text-muted-foreground truncate min-w-0">
                            {result.sku && <span>SKU: {result.sku}</span>}
                            {result.stock !== undefined && (
                              <span className="ml-1.5">Stock: {result.stock}</span>
                            )}
                          </span>
                        ) : (
                          result.description && (
                            <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">{result.description}</span>
                          )
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          "font-semibold whitespace-nowrap",
                          result.isBelowMinimum && "text-destructive"
                        )}>
                          {formatARS(result.basePrice)}
                        </span>
                        {result.isBelowMinimum && result.minimumPrice && (
                          <span className="text-xs text-destructive">
                            Mín: {formatARS(result.minimumPrice)}
                          </span>
                        )}
                      </div>
                      <PlusIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
            
            {showQuickCreate && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleQuickCreate}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear servicio rápido
                </Button>
              </div>
            )}
          </div>
        </div>

      {/* Selected items (Cart) */}
      {showSelectedTable && cartItems.length > 0 && (
        <div className="border rounded-md overflow-x-hidden w-full">
          <div className="px-4 py-1.5 bg-muted border-b">
            <span className="font-medium text-sm">Seleccionados ({cartItems.length})</span>
          </div>
          
          <div className="divide-y overflow-x-hidden min-w-0">
            {cartItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="p-2 flex items-center gap-3 min-w-0">
                {/* Icon */}
                {item.type === 'product' ? (
                  <Package className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <Wrench className="h-4 w-4 text-orange-500 flex-shrink-0" />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{item.name}</span>
                    {item.isManualPrice && (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 flex-shrink-0 h-5 px-1.5">
                        Manual
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {item.type === 'product' && item.stock !== undefined && (
                      <span>Stock: {item.stock}</span>
                    )}
                  </div>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(index, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(index, 1)}
                  >
                    <PlusIcon className="h-3 w-3" />
                  </Button>
                </div>

                {/* Price input */}
                <div className="w-24 flex-shrink-0">
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={Math.round(item.unitPrice)}
                    onChange={(e) => updatePrice(index, parseFloat(e.target.value) || 0)}
                    className={cn(
                      'h-8 text-right',
                      item.isManualPrice && 'border-yellow-400 bg-yellow-50/30'
                    )}
                  />
                </div>

                {/* Subtotal */}
                <div className="w-20 text-right font-medium flex-shrink-0">
                  {formatARS(item.unitPrice * item.quantity)}
                </div>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => removeFromCart(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="px-4 py-3 bg-muted border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">{formatARS(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
