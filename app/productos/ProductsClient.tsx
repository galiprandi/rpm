'use client';

import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import { PUBLIC_SITE_CONFIG } from '@/lib/config/public-site';

const featuredProducts = [
  { id: '1', name: 'Barra LED Ultra-Beam 42"', category: 'Iluminación', price: 125000, image: 'B' },
  { id: '2', name: 'Protección PPF Pro-Shield', category: 'Estética', price: 85000, image: 'P' },
  { id: '3', name: 'Kit Suspensión Off-Road', category: 'Equipamiento', price: 450000, image: 'S' },
  { id: '4', name: 'Lámina Seguridad 3M CS20', category: 'Seguridad', price: 45000, image: 'L' },
];

export default function ProductsClient() {
  return (
    <PublicLayout>
      <section className="pt-40 pb-24 bg-black min-h-screen">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl space-y-4">
              <h1 className="text-brand font-bold tracking-widest uppercase text-xs animate-fade-up opacity-0" style={{ animationDelay: '0.1s' }}>Catálogo Curado</h1>
              <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter leading-none animate-fade-up opacity-0" style={{ animationDelay: '0.2s' }}>
                EQUIPAMIENTO <br /> SUPERIOR.
              </h2>
            </div>
            <div className="flex gap-4 animate-fade-up opacity-0" style={{ animationDelay: '0.3s' }}>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-brand transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  className="h-12 w-64 bg-zinc-900 border border-white/5 rounded-full pl-12 pr-6 text-sm text-white focus:outline-none focus:border-brand/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, index) => (
              <div
                key={product.id}
                className="group relative aspect-[3/4] bg-zinc-900 overflow-hidden rounded-3xl border border-white/5 hover:border-brand/20 transition-all duration-700 animate-fade-up opacity-0"
                style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-[180px] font-black text-white/5 select-none transition-transform duration-700 group-hover:scale-110">
                  {product.image}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                <div className="absolute bottom-8 left-8 right-8 space-y-4">
                  <div>
                    <p className="text-brand text-[10px] font-bold uppercase tracking-widest mb-1">{product.category}</p>
                    <h3 className="text-xl font-bold text-white tracking-tight">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    <span className="text-white font-bold">${product.price.toLocaleString()}</span>
                    <button
                      onClick={() => window.open(PUBLIC_SITE_CONFIG.links.whatsapp(`Hola! Me gustaría recibir más información sobre el producto: ${product.name}`), '_blank')}
                      className="flex items-center text-xs font-bold text-brand hover:text-white transition-colors"
                    >
                      DETALLES <ArrowRight className="ml-2 h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 text-center animate-fade-up opacity-0" style={{ animationDelay: '0.8s' }}>
            <p className="text-zinc-500 text-sm mb-8">Mostrando 4 de 124 productos de alta gama</p>
            <Button variant="outline" className="border-white/10 text-white rounded-full px-12 h-14 hover:bg-white hover:text-black transition-all">
              Cargar más productos
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
