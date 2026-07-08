'use client';

import { useState } from 'react';
import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, X, Check, MessageCircle, Eye } from 'lucide-react';
import { PUBLIC_SITE_CONFIG } from '@/lib/config/public-site';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categories = ['Todos', 'Iluminación', 'Estética', 'Equipamiento', 'Seguridad', 'Interior'];

const featuredProducts = [
  {
    id: '1',
    name: 'Barra LED Ultra-Beam 42"',
    category: 'Iluminación',
    price: 125000,
    image: 'B',
    description: 'Iluminación de alta performance diseñada para condiciones extremas. Su patrón de luz combinado ofrece profundidad y amplitud sin precedentes.',
    features: ['Potencia: 240W', 'Resistencia al agua IP68', 'Chasis de aluminio extruido', 'Lentes de policarbonato irrompibles']
  },
  {
    id: '2',
    name: 'Protección PPF Pro-Shield',
    category: 'Estética',
    price: 85000,
    image: 'P',
    description: 'Película de poliuretano termoplástico de alta resistencia que protege la pintura contra impactos de piedras y rayones.',
    features: ['Auto-curación con calor', 'Acabado ultra-brillante', 'Protección UV superior', 'Garantía de 10 años']
  },
  {
    id: '3',
    name: 'Kit Suspensión Off-Road',
    category: 'Equipamiento',
    price: 450000,
    image: 'S',
    description: 'Sistema de suspensión reforzado para mejorar el despeje y la capacidad de carga en terrenos difíciles.',
    features: ['Amortiguadores de nitrógeno', 'Espirales progresivos', 'Bujes de poliuretano', 'Ajuste de altura regulable']
  },
  {
    id: '4',
    name: 'Lámina Seguridad 3M CS20',
    category: 'Seguridad',
    price: 45000,
    image: 'L',
    description: 'Película de seguridad de alto espesor que mantiene los cristales unidos en caso de rotura por impacto.',
    features: ['Protección anti-vandalismo', 'Rechazo de calor 45%', 'Filtro UV 99%', 'Color estable en el tiempo']
  },
  {
    id: '5',
    name: 'Ópticas Full LED Black',
    category: 'Iluminación',
    price: 195000,
    image: 'O',
    description: 'Reemplazo directo de ópticas originales con tecnología Bi-LED y luces de giro secuenciales integradas.',
    features: ['Plug & Play', 'Look Dark Premium', 'Mayor alcance lumínico', 'Regulación de altura']
  },
  {
    id: '6',
    name: 'Tratamiento Cerámico 9H',
    category: 'Estética',
    price: 65000,
    image: 'T',
    description: 'Recubrimiento nanotecnológico de máxima dureza que protege contra contaminantes ambientales y otorga un brillo extremo.',
    features: ['Dureza certificada 9H', 'Efecto hidrofóbico radical', 'Fácil limpieza', 'Resistencia química']
  },
  {
    id: '7',
    name: 'Malacate Winch 12000lb',
    category: 'Equipamiento',
    price: 320000,
    image: 'M',
    description: 'Herramienta indispensable de rescate con motor sellado de alta potencia y cable sintético de última generación.',
    features: ['Fuerza: 12000 lb', 'Cuerda sintética Dyneema', 'Control inalámbrico', 'Freno automático']
  },
  {
    id: '8',
    name: 'Alfombras Thermo-Fit',
    category: 'Interior',
    price: 55000,
    image: 'A',
    description: 'Protección total del piso diseñada por computadora para un calce perfecto. Material ecológico e inodoro.',
    features: ['Calce láser específico', 'Borde elevado contenedor', 'Superficie antideslizante', 'Lavables en segundos']
  },
];

export default function ProductsClient() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<typeof featuredProducts[0] | null>(null);

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
                    <span className="text-white font-bold">${product.price.toLocaleString()}</span>
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

          <div className="mt-24 text-center animate-fade-up opacity-0" style={{ animationDelay: '0.5s' }}>
            <p className="text-zinc-500 text-sm mb-8">
              Mostrando {filteredProducts.length} de {featuredProducts.length} productos destacados
            </p>
            <Button variant="outline" className="border-white/10 text-white rounded-full px-12 h-14 hover:bg-white hover:text-black transition-all group">
              Explorar Catálogo Completo
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl bg-zinc-950 border-white/10 p-0 overflow-hidden">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row h-full">
              <div className="md:w-1/2 aspect-square md:aspect-auto bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-brand/5" />
                <span className="text-[140px] font-black text-white/5 italic select-none">
                  {selectedProduct.image}
                </span>
                <div className="absolute top-6 left-6">
                  <span className="px-3 py-1 bg-brand text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {selectedProduct.category}
                  </span>
                </div>
              </div>

              <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-8">
                <DialogHeader className="space-y-4">
                  <DialogTitle className="text-3xl md:text-4xl font-bold text-white tracking-tighter leading-tight">
                    {selectedProduct.name}
                  </DialogTitle>
                  <p className="text-2xl font-bold text-brand">
                    ${selectedProduct.price.toLocaleString()}
                  </p>
                </DialogHeader>

                <div className="space-y-6">
                  <p className="text-zinc-400 leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  <ul className="grid grid-cols-1 gap-3">
                    {selectedProduct.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-zinc-300">
                        <Check className="h-4 w-4 text-brand mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4">
                  <Button
                    className="w-full bg-white text-black hover:bg-brand hover:text-white font-bold h-14 rounded-2xl transition-all duration-300 gap-3 group"
                    onClick={() => window.open(PUBLIC_SITE_CONFIG.links.whatsapp(`Hola RPM! Me interesa el producto: ${selectedProduct.name}. ¿Tienen stock disponible?`), '_blank')}
                  >
                    <MessageCircle className="h-5 w-5 fill-current transition-transform group-hover:scale-110" />
                    CONSULTAR POR WHATSAPP
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PublicLayout>
  );
}
