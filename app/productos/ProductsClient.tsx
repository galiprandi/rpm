'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, X, Eye, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ProductQuickView } from '@/components/public/ProductQuickView';
import { formatARS } from '@/lib/utils/format';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PUBLIC_SITE_CONFIG, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/config/public-site';
import type { PublicCatalogProduct } from '@/lib/services/publicCatalogService';

interface ProductsClientProps {
  initialProducts: PublicCatalogProduct[];
  initialCategories: string[];
}

// Custom descriptions for each category to increase context and conversion
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Todos': 'Explorá nuestra colección completa de equipamiento premium para elevar el rendimiento, la seguridad y el diseño de tu vehículo.',
  'Iluminación': 'Sistemas Bi-LED, luces auxiliares y proyectores de alta potencia para una visibilidad nocturna superior y de estándar profesional.',
  'Estética': 'Tratamientos cerámicos, PPF (Paint Protection Film) y acabados detallados para conservar el valor y brillo original de tu vehículo.',
  'Equipamiento': 'Accesorios off-road robustos, enganches y protectores diseñados para resistir las condiciones de terreno más extremas.',
  'Seguridad': 'Sistemas de alarma avanzados, rastreo satelital y sensores para mantener tu vehículo siempre protegido en todo momento.',
  'Audio y Electrónica': 'Mejoras de conectividad, pantallas de infoentretenimiento y sistemas de audio premium DSP de alta definición.',
};

const SUGGESTED_CHIPS = [
  { label: '💡 Bi-LED', query: 'Bi-LED' },
  { label: '✨ PPF', query: 'PPF' },
  { label: '🛡️ Cerámico', query: 'Cerámico' },
  { label: '🔌 Audio DSP', query: 'Audio DSP' },
  { label: '🏔️ Off-Road', query: 'Off-Road' },
];

export default function ProductsClient({ initialProducts, initialCategories }: ProductsClientProps) {
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize state directly from URL search params on mount
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return searchParams?.get('category') || 'Todos';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    return searchParams?.get('q') || '';
  });

  const [selectedProduct, setSelectedProduct] = useState<PublicCatalogProduct | null>(null);
  const [productsList] = useState<PublicCatalogProduct[]>(initialProducts);
  const [categoriesList] = useState<string[]>(initialCategories);

  // Sync state when URL params change (e.g. from browser back/forward or deep linking)
  useEffect(() => {
    if (!searchParams) return;
    const cat = searchParams.get('category') || 'Todos';
    const q = searchParams.get('q') || '';
    setSelectedCategory(cat);
    setSearchQuery(q);
  }, [searchParams]);

  // Sync active filters to URL search params dynamically without reloading the page
  const updateUrlParams = (category: string, query: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (category && category !== 'Todos') {
      params.set('category', category);
    }
    if (query) {
      params.set('q', query);
    }
    const newRelativePathQuery = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    window.history.replaceState(null, '', newRelativePathQuery);
  };

  // Safe handlers that update state and URL together
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateUrlParams(category, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateUrlParams(selectedCategory, query);
  };

  const handleSuggestionClick = (query: string) => {
    setSearchQuery(query);
    updateUrlParams(selectedCategory, query);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('Todos');
    setSearchQuery('');
    updateUrlParams('Todos', '');
  };

  useEffect(() => {
    let cancelled = false;
    const productId = searchParams?.get('product');
    if (productId) {
      const product = productsList.find(p => p.id === productId);
      if (product) {
        Promise.resolve().then(() => {
          if (!cancelled) {
            setSelectedProduct(product);
          }
        });
      }
    }
    return () => {
      cancelled = true;
    };
  }, [searchParams, productsList]);

  const filteredProducts = productsList.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PublicLayout>
      <section className="pt-40 pb-24 bg-black min-h-screen">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-12">
            <div className="max-w-2xl space-y-4">
              <h1 className="text-brand font-bold tracking-widest uppercase text-xs animate-fade-up opacity-0" style={{ animationDelay: '0.1s' }}>Catálogo Curado</h1>
              <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter leading-none animate-fade-up opacity-0" style={{ animationDelay: '0.2s' }}>
                EQUIPAMIENTO <br /> SUPERIOR.
              </h2>
            </div>

            <div className="w-full lg:w-auto space-y-8 animate-fade-up opacity-0" style={{ animationDelay: '0.3s' }}>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-brand transition-colors pointer-events-none" aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-14 w-full lg:w-80 bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-12 text-sm text-white focus:outline-none focus:border-brand/50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-all"
                  aria-label="Buscar producto en el catálogo"
                />
                {searchQuery && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleSearchChange('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-offset-1"
                        aria-label="Limpiar búsqueda"
                      >
                        <X className="h-3 w-3 pointer-events-none" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 border-white/10 text-white text-xs font-bold uppercase tracking-widest">
                      Limpiar
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {categoriesList.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    aria-label={`Filtrar productos por categoría ${category}`}
                    className={cn(
                      "px-6 h-10 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                      selectedCategory === category
                        ? "bg-brand border-brand text-white shadow-[0_0_20px_rgba(255,75,0,0.3)]"
                        : "bg-zinc-900 border-white/5 text-zinc-500 hover:text-white hover:border-white/20"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic category descriptions */}
          <div className="mb-12 max-w-4xl animate-fade-up opacity-0" style={{ animationDelay: '0.4s' }}>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed tracking-wide border-l-2 border-brand/50 pl-4 font-medium">
              {CATEGORY_DESCRIPTIONS[selectedCategory] || CATEGORY_DESCRIPTIONS['Todos']}
            </p>
          </div>

          {filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ver detalles de ${product.name}`}
                  onClick={() => setSelectedProduct(product)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedProduct(product);
                    }
                  }}
                  className="group relative aspect-[3/4] bg-zinc-900 overflow-hidden rounded-3xl border border-white/5 hover:border-brand/20 transition-all duration-700 animate-fade-up cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  style={{ animationDelay: `${0.1 * (index % 4)}s` }}
                >
                {product.imageUrl ? (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      priority={index < 2}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[180px] font-black text-white/5 select-none transition-transform duration-700 group-hover:scale-110">
                    {product.image}
                  </div>
                )}

                {/* Quick View Icon Overlay */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 group-focus-within:translate-x-0 z-20">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-brand hover:border-brand transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        aria-label={`Vista rápida de ${product.name}`}
                      >
                        <Eye className="h-4 w-4 pointer-events-none" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-zinc-900 border-white/10 text-white text-xs font-bold uppercase tracking-widest">
                      Vista Rápida
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                <div className="absolute bottom-8 left-8 right-8 space-y-4">
                  <div>
                    <p className="text-brand text-[10px] font-bold uppercase tracking-widest mb-1">{product.category}</p>
                    <h3 className="text-xl font-bold text-white tracking-tight">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-500">
                    <span className="text-white font-mono font-semibold">{formatARS(product.price)}</span>
                    <span
                      className="flex items-center text-xs font-bold text-brand hover:text-white transition-colors rounded-lg cursor-pointer"
                    >
                      DETALLES <ArrowRight className="ml-2 h-3 w-3 pointer-events-none" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="py-40 text-center animate-fade-up">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                <Search className="h-8 w-8 text-zinc-700 pointer-events-none" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No se encontraron productos</h3>
              <p className="text-zinc-500 mb-6">Probá con otros filtros o términos de búsqueda.</p>

              {/* Interactive suggestion chips inside empty state */}
              <div className="flex flex-col items-center justify-center gap-3 mb-8">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Sugerencias de Búsqueda</p>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
                  {SUGGESTED_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleSuggestionClick(chip.query)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-brand/30 text-xs font-semibold text-zinc-300 hover:text-white rounded-full transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="link"
                className="text-brand font-bold cursor-pointer"
                onClick={handleClearFilters}
              >
                Limpiar filtros
              </Button>
            </div>
          )}

        </div>
      </section>

      {/* High-Impact CTA */}
      <section className="py-60 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,75,0,0.1)_0,transparent_70%)]" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">
              ¿No encontrás lo que <br /> estás buscando?
            </h2>
            <p className="text-xl text-zinc-500 leading-relaxed">
              Nuestro catálogo digital es una selección. Si necesitás un accesorio específico o una cotización a medida, contactanos.
            </p>
            <div className="flex justify-center">
               <Button asChild className="bg-brand text-white hover:bg-brand/90 font-bold px-16 h-20 text-xl rounded-full transition-all hover:scale-105 active:scale-95 border-none shadow-[0_0_40px_rgba(255,75,0,0.3)] gap-3 cursor-pointer">
                 <a href={PUBLIC_SITE_CONFIG.links.whatsapp(DEFAULT_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer" aria-label="Consultar por WhatsApp a medida">
                    <MessageCircle className="h-6 w-6 fill-current pointer-events-none" aria-hidden="true" />
                    Consultar a Medida
                 </a>
               </Button>
            </div>
          </div>
        </div>
      </section>

      <ProductQuickView
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </PublicLayout>
  );
}
