'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  ean?: string;
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
  ean?: string;
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
  allowMultiple?: boolean;
  maxSelection?: number;
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
  allowMultiple = true,
  maxSelection,
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
  // Find default price list
  const getDefaultPriceListId = useCallback(() => {
    if (defaultPriceListId) return defaultPriceListId;
    if (priceLists.length === 0) return '';
    return priceLists[0]?.id || '';
  }, [defaultPriceListId, priceLists]);

  const [selectedPriceListId, setSelectedPriceListId] = useState<string>('');
  
  // Sync selected price list when lists change or default is provided
  useEffect(() => {
    const defaultId = getDefaultPriceListId();
    if (defaultId) {
      setSelectedPriceListId(prev => prev !== defaultId ? defaultId : prev);
    }
  }, [getDefaultPriceListId, priceLists.length, defaultPriceListId]);

  // Cart state - use ref to avoid re-renders triggering effects
  const [cartItems, setCartItems] = useState<SelectedItem[]>(initialItems);
  const cartItemsRef = useRef<SelectedItem[]>(initialItems);
  const isInitialMountRef = useRef(true);
  const isProcessingRef = useRef(false);
  const prevCartItemsRef = useRef<SelectedItem[]>(initialItems);
  
  // Sync cartItems ref whenever it changes for functions that need current value
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);
  
  // Mark initial mount complete after first render
  useEffect(() => {
    const timeout = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  // Track last initialItems to detect real changes from parent
  const lastInitialItemsRef = useRef<SelectedItem[]>(initialItems);
  
  // Sync initialItems from parent - only when IDs actually change
  useEffect(() => {
    // Skip during initial mount
    if (isInitialMountRef.current) return;
    
    const lastIds = lastInitialItemsRef.current.map(i => i.id).join(',');
    const newIds = initialItems.map(i => i.id).join(',');
    
    // Only update if the items IDs are actually different
    if (lastIds !== newIds) {
      setCartItems(initialItems);
      prevCartItemsRef.current = initialItems;
      lastInitialItemsRef.current = initialItems;
    }
  }, [initialItems]);

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
  
  // Helper to update cart and notify parent in one go
  const updateCartAndNotify = useCallback((newItems: SelectedItem[]) => {
    // Skip if processing
    if (isProcessingRef.current) {
      console.log('[ProductServiceSelector] Skipping update - already processing');
      return;
    }
    
    // Compare with previous items to avoid unnecessary updates
    const prevItems = prevCartItemsRef.current;
    const hasChanges = !(prevItems.length === newItems.length && 
        prevItems.every((item, idx) => 
          item.id === newItems[idx]?.id &&
          item.quantity === newItems[idx]?.quantity &&
          item.unitPrice === newItems[idx]?.unitPrice
        ));
    
    if (!hasChanges) {
      console.log('[ProductServiceSelector] Skipping update - no changes detected');
      return; // No change, skip update
    }
    
    console.log('[ProductServiceSelector] Updating cart:', newItems.length, 'items');
    
    isProcessingRef.current = true;
    prevCartItemsRef.current = newItems;
    
    setCartItems(newItems);
    
    // Always notify parent of changes
    console.log('[ProductServiceSelector] Notifying parent with', newItems.length, 'items');
    onSelectionChange(newItems);
    
    // Reset after this execution cycle
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 0);
  }, [onSelectionChange]);

  // Cache for all prices by product ID
  const priceCacheRef = useRef<Map<string, Record<string, PriceInfo>>>(new Map());

  // Stable search function using useCallback
  const performSearch = useCallback(async (term: string, category: string, priceList: string) => {
    if (term.length < 2) return;
    
    setSearchLoading(true);
    
    const params = new URLSearchParams();
    params.set('q', term);
    if (category && category !== 'none') params.set('categoryId', category);
    if (priceList && priceList !== 'none') params.set('priceListId', priceList);
    params.set('limit', '20');
    params.set('includeAllPrices', 'true'); // Always get all prices for caching

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
  }, [searchEndpoint]);

  // Debounced search - triggers when searchTerm changes
  useEffect(() => {
    if (!isInitialMountRef.current) {
      isInitialMountRef.current = true;
      return;
    }

    if (searchTerm.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    
    // Show loading immediately when typing starts
    setSearchLoading(true);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      performSearch(searchTerm, selectedCategoryId, selectedPriceListId);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, performSearch, selectedCategoryId, selectedPriceListId]);

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
    // Use ref to get current cart state and avoid stale closure
    const currentCart = cartItemsRef.current;
    
    if (!allowMultiple) {
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
        ean: result.ean,
        stock: result.stock,
        categoryId: result.categoryId,
        categoryName: result.categoryName,
      };
      updateCartAndNotify([newItem]);
      setShowResults(false);
      return;
    }

    // Check max selection
    if (maxSelection && currentCart.length >= maxSelection) {
      return;
    }

    const existingIndex = currentCart.findIndex(item => item.id === result.id);
    
    if (existingIndex >= 0) {
      // Increment quantity
      const updated = [...currentCart];
      updated[existingIndex].quantity += 1;
      updateCartAndNotify(updated);
    } else {
      // Add new item
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
        ean: result.ean,
        stock: result.stock,
        categoryId: result.categoryId,
        categoryName: result.categoryName,
      };
      updateCartAndNotify([...currentCart, newItem]);
    }

    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const removeFromCart = (index: number) => {
    const currentCart = cartItemsRef.current;
    updateCartAndNotify(currentCart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    const currentCart = cartItemsRef.current;
    console.log('[updateQuantity] Current cart length:', currentCart.length, 'index:', index, 'delta:', delta);
    
    if (index < 0 || index >= currentCart.length) {
      console.log('[updateQuantity] Invalid index');
      return;
    }
    
    const item = currentCart[index];
    const newQuantity = item.quantity + delta;
    
    console.log('[updateQuantity] Item:', item.name, 'current qty:', item.quantity, 'new qty:', newQuantity, 'stock:', item.stock);
    
    if (newQuantity <= 0) {
      console.log('[updateQuantity] Removing item');
      updateCartAndNotify(currentCart.filter((_, i) => i !== index));
      return;
    }

    // Check stock limit for products (only if stock is a positive number)
    if (item.type === 'product' && typeof item.stock === 'number' && item.stock > 0 && newQuantity > item.stock) {
      console.log('[updateQuantity] Blocked by stock limit');
      return; // Don't allow exceeding stock
    }

    // Create new item with updated quantity (don't mutate original)
    const updated = [...currentCart];
    updated[index] = { ...item, quantity: newQuantity };
    
    console.log('[updateQuantity] Updating with new quantity:', newQuantity);
    updateCartAndNotify(updated);
  };

  const updatePrice = (index: number, newPrice: number) => {
    const currentCart = cartItemsRef.current;
    const item = currentCart[index];
    const updated = [...currentCart];
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
            placeholder="Buscar por nombre, SKU o código de barras..."
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
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Escribe para buscar...
              </div>
            ) : searchTerm.length < 2 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Escribe al menos 2 caracteres...
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
                    disabled={item.type === 'product' && typeof item.stock === 'number' && item.stock > 0 && item.quantity >= item.stock}
                    title={item.type === 'product' && typeof item.stock === 'number' && item.stock > 0 && item.quantity >= item.stock ? 'Stock máximo alcanzado' : undefined}
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
