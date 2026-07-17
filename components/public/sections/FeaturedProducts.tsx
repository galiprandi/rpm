'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { featuredProducts, FeaturedProduct } from '@/lib/constants/featured-products';
import { ProductQuickView } from '@/components/public/ProductQuickView';
import { formatARS } from '@/lib/utils/format';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.21, 0.47, 0.32, 0.98] as const,
    }
  },
};

export function FeaturedProducts() {
  const [selectedProduct, setSelectedProduct] = useState<FeaturedProduct | null>(null);
  const [displayedProducts, setDisplayedProducts] = useState<FeaturedProduct[]>(featuredProducts.slice(0, 4));

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      try {
        const res = await fetch('/api/public/catalog');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.products && data.products.length > 0) {
            setDisplayedProducts(data.products.slice(0, 4));
          }
        }
      } catch (err) {
        console.error('Failed to load home featured products from DB, falling back to static:', err);
      }
    }
    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-32 bg-black overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-brand font-bold tracking-widest uppercase text-xs mb-4">Selección Premium</h2>
            <h3 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none">
              PRODUCTOS <br /> DESTACADOS.
            </h3>
          </div>
          <div className="flex flex-col items-start md:items-end gap-6">
            <p className="text-gray-400 text-lg max-w-sm md:text-right">
              Una curaduría exclusiva de los mejores accesorios para elevar el estándar de tu vehículo.
            </p>
            <Link href="/productos">
              <Button variant="link" className="text-brand font-bold p-0 h-auto hover:text-white transition-colors group">
                VER CATÁLOGO COMPLETO
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {displayedProducts.map((product) => (
            <motion.div
              key={product.id}
              variants={cardVariants}
              whileHover={{
                scale: 0.98,
                transition: { duration: 0.4 }
              }}
              className="group relative aspect-[3/4] bg-zinc-900 overflow-hidden rounded-3xl border border-white/5 hover:border-brand/20 transition-all duration-700"
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[180px] font-black text-white/5 select-none transition-transform duration-700 group-hover:scale-110">
                  {product.image}
                </div>
              )}

              {/* Quick View Icon Overlay */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 z-20">
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
                      <Eye className="h-4 w-4" />
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
            </motion.div>
          ))}
        </motion.div>
      </div>

      <ProductQuickView
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
