'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { featuredProducts } from '@/lib/constants/featured-products';
import { publicServices } from '@/lib/constants/services';
import { useRouter } from 'next/navigation';
import { formatARS } from '@/lib/utils/format';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  image: string;
  imageUrl: string | null;
  description: string;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [liveProducts, setLiveProducts] = useState<SearchProduct[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Reset query when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Fetch live public catalog on open
  useEffect(() => {
    if (isOpen && !liveProducts && !isLoading) {
      setIsLoading(true);
      fetch('/api/public/catalog')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch public catalog');
          return res.json();
        })
        .then((data) => {
          if (data && Array.isArray(data.products)) {
            const mapped: SearchProduct[] = data.products.map((p: any) => ({
              id: p.id,
              sku: p.sku || '',
              name: p.name,
              category: p.category || 'Varios',
              price: Number(p.price) || 0,
              image: p.image || (p.name ? p.name.charAt(0).toUpperCase() : 'P'),
              imageUrl: p.imageUrl || null,
              description: p.description || '',
            }));
            setLiveProducts(mapped);
          } else {
            setLiveProducts([]);
          }
        })
        .catch((err) => {
          console.error('Error fetching dynamic public catalog for search:', err);
          // Set to empty array to prevent infinite re-fetch loops while reverting to static featuredProducts
          setLiveProducts([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, liveProducts, isLoading]);

  // Determine which list of products to search across
  const productsToSearch = useMemo<SearchProduct[]>(() => {
    if (liveProducts && liveProducts.length > 0) {
      return liveProducts;
    }
    // Revert seamlessly to static featuredProducts
    return featuredProducts.map((p) => ({
      id: p.id,
      sku: '',
      name: p.name,
      category: p.category,
      price: p.price,
      image: p.image,
      imageUrl: p.imageUrl || null,
      description: p.description,
    }));
  }, [liveProducts]);

  const results = useMemo(() => {
    if (!query.trim()) return { products: [], services: [] };

    const searchStr = query.toLowerCase();

    const filteredProducts = productsToSearch.filter(p =>
      p.name.toLowerCase().includes(searchStr) ||
      p.category.toLowerCase().includes(searchStr) ||
      p.description.toLowerCase().includes(searchStr)
    ).slice(0, 5);

    const filteredServices = publicServices.filter(s =>
      s.title.toLowerCase().includes(searchStr) ||
      s.shortDescription.toLowerCase().includes(searchStr) ||
      s.fullDescription?.toLowerCase().includes(searchStr)
    ).slice(0, 5);

    return {
      products: filteredProducts,
      services: filteredServices
    };
  }, [query, productsToSearch]);

  const hasResults = results.products.length > 0 || results.services.length > 0;

  const handleSelectProduct = (productId: string) => {
    onClose();
    router.push(`/productos?product=${productId}`);
  };

  const handleSelectService = (serviceId: string) => {
    onClose();
    router.push(`/servicios?service=${serviceId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-white/10 p-0 overflow-hidden top-[20%] translate-y-0">
        <div className="p-6 border-b border-white/5">
          <div className="relative group">
            {isLoading ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-brand transition-colors" />
            )}
            <Input
              autoFocus
              placeholder="Buscar productos, servicios..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-14 bg-zinc-900 border-none pl-12 pr-12 text-lg text-white focus-visible:ring-1 focus-visible:ring-brand/50 rounded-2xl"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-offset-1"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {!query && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                <Search className="h-8 w-8 text-zinc-700" />
              </div>
              <p className="text-zinc-500 font-medium italic">¿Qué estás buscando hoy?</p>
            </div>
          )}

          {query && !hasResults && (
            <div className="p-12 text-center">
              <p className="text-zinc-500">No se encontraron resultados para &quot;<span className="text-white font-bold">{query}</span>&quot;</p>
            </div>
          )}

          {query && hasResults && (
            <div className="space-y-6 p-4">
              {/* Services Results */}
              {results.services.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Servicios Técnicos</h3>
                  <div className="grid gap-2">
                    {results.services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleSelectService(service.id)}
                        className="flex items-center p-3 rounded-2xl bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group text-left w-full"
                      >
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand mr-4 shrink-0 group-hover:scale-110 transition-transform">
                          <service.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-white font-bold text-sm truncate">{service.title}</h4>
                          <p className="text-zinc-500 text-xs truncate">{service.shortDescription}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-700 group-hover:text-brand transition-colors ml-4 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Results */}
              {results.products.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Productos Destacados</h3>
                  <div className="grid gap-2">
                    {results.products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product.id)}
                        className="flex items-center p-3 rounded-2xl bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group text-left w-full"
                      >
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center relative overflow-hidden mr-4 shrink-0 group-hover:scale-110 transition-transform border border-white/5">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              sizes="40px"
                              className="object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <span className="text-white/20 font-black italic select-none">
                              {product.image}
                            </span>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-bold text-sm truncate">{product.name}</h4>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500 uppercase font-black">{product.category}</span>
                          </div>
                          <p className="text-zinc-500 text-xs truncate">{product.description}</p>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className="text-white font-mono font-semibold text-sm">{formatARS(product.price)}</p>
                          <p className="text-[10px] text-brand font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalle</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {query && hasResults && (
           <div className="p-4 bg-zinc-900/50 border-t border-white/5 text-center">
             <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
               Mostrando los resultados más relevantes
             </p>
           </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
