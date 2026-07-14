'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, X, Eye, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { featuredProducts } from '@/lib/constants/featured-products';
import { ProductQuickView } from '@/components/public/ProductQuickView';
import { formatARS } from '@/lib/utils/format';
import { PUBLIC_SITE_CONFIG, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/config/public-site';

const categories = ['Todos', 'Iluminación', 'Estética', 'Equipamiento', 'Seguridad', 'Interior'];

export default function ProductsClient() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<typeof featuredProducts[0] | null>(null);

  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId) {
      const product = featuredProducts.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
      }
    }
  }, [searchParams]);

  const filteredProducts = featuredProducts.filter(product => {
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-brand transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 w-full lg:w-80 bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-12 text-sm text-white focus:outline-none focus:border-brand/50 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "px-6 h-10 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border",
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

          {filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="group relative aspect-[3/4] bg-zinc-900 overflow-hidden rounded-3xl border border-white/5 hover:border-brand/20 transition-all duration-700 animate-fade-up"
                  style={{ animationDelay: `${0.1 * (index % 4)}s` }}
                >
                <div className="absolute inset-0 flex items-center justify-center text-[180px] font-black text-white/5 select-none transition-transform duration-700 group-hover:scale-110">
                  {product.image}
                </div>

                {/* Quick View Icon Overlay */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                  <div
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-brand hover:border-brand transition-colors"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Eye className="h-4 w-4" />
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                <div className="absolute bottom-8 left-8 right-8 space-y-4">
                  <div>
                    <p className="text-brand text-[10px] font-bold uppercase tracking-widest mb-1">{product.category}</p>
                    <h3 className="text-xl font-bold text-white tracking-tight">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    <span className="text-white font-mono font-semibold">{formatARS(product.price)}</span>
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="flex items-center text-xs font-bold text-brand hover:text-white transition-colors"
                    >
                      DETALLES <ArrowRight className="ml-2 h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="py-40 text-center animate-fade-up">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                <Search className="h-8 w-8 text-zinc-700" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No se encontraron productos</h3>
              <p className="text-zinc-500">Probá con otros filtros o términos de búsqueda.</p>
              <Button
                variant="link"
                className="mt-4 text-brand font-bold"
                onClick={() => { setSelectedCategory('Todos'); setSearchQuery(''); }}
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
               <Button asChild className="bg-brand text-white hover:bg-brand/90 font-bold px-16 h-20 text-xl rounded-full transition-all hover:scale-105 active:scale-95 border-none shadow-[0_0_40px_rgba(255,75,0,0.3)] gap-3">
                 <a href={PUBLIC_SITE_CONFIG.links.whatsapp(DEFAULT_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-6 w-6 fill-current" />
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
