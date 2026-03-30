'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
}

interface SearchableSelectProps {
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  createButtonText?: string;
  apiUrl: string;
  onSelect: (item: SearchableItem) => void;
  onCreateNew?: () => void;
  disabled?: boolean;
}

export function SearchableSelect({
  placeholder,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  createButtonText = 'Crear nuevo',
  apiUrl,
  onSelect,
  onCreateNew,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<SearchableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchableItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function with debounce
  const searchItems = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const url = term 
        ? `${apiUrl}?search=${encodeURIComponent(term)}` 
        : apiUrl;
      const response = await fetch(url);
      const data = await response.json();
      
      // Handle different response structures
      const itemsList = data.services || data.products || [];
      const mappedItems: SearchableItem[] = itemsList.map((item: unknown) => {
        const typedItem = item as { 
          id: string; 
          name: string; 
          description?: string | null; 
          baseCost?: number; 
          salePrice?: number;
        };
        return {
          id: typedItem.id,
          name: typedItem.name,
          description: typedItem.description,
          price: typedItem.baseCost || typedItem.salePrice || 0,
        };
      });
      setItems(mappedItems);
    } catch (error) {
      console.error('Error searching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchItems(searchTerm);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, searchItems]);

  // Load initial items when opening
  useEffect(() => {
    if (isOpen && items.length === 0) {
      searchItems('');
    }
  }, [isOpen, items.length, searchItems]);

  const handleSelect = (item: SearchableItem) => {
    setSelectedItem(item);
    setIsOpen(false);
    onSelect(item);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    onCreateNew?.();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button showing selected or placeholder */}
      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        type="button"
      >
        {selectedItem ? (
          <span className="truncate">
            {selectedItem.name} - ${selectedItem.price.toLocaleString('es-AR')}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          {/* Results list */}
          <div className="max-h-60 overflow-auto">
            {loading ? (
              <div className="p-4 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchTerm ? emptyMessage : 'Escribe para buscar...'}
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-accent transition-colors',
                    selectedItem?.id === item.id && 'bg-accent'
                  )}
                  onClick={() => handleSelect(item)}
                >
                  <div className="font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </div>
                  )}
                  <div className="text-sm font-medium text-primary">
                    ${item.price.toLocaleString('es-AR')}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Create new button */}
          {onCreateNew && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={handleCreateNew}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createButtonText}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
