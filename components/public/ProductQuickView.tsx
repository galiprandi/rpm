'use client';

import { Check, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PUBLIC_SITE_CONFIG } from '@/lib/config/public-site';
import { formatARS } from '@/lib/utils/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PublicCatalogProduct } from '@/lib/services/publicCatalogService';

interface ProductQuickViewProps {
  product: PublicCatalogProduct | null;
  onClose: () => void;
}

export function ProductQuickView({ product, onClose }: ProductQuickViewProps) {
  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-white/10 p-0 overflow-hidden">
        {product && (
          <div className="flex flex-col md:flex-row h-full">
            <div className="md:w-1/2 aspect-square md:aspect-auto bg-zinc-900 flex items-center justify-center relative overflow-hidden min-h-[250px]">
              <div className="absolute inset-0 bg-brand/5" />
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover opacity-70 hover:opacity-85 transition-opacity duration-700"
                />
              ) : (
                <span className="text-[140px] font-black text-white/5 italic select-none">
                  {product.image}
                </span>
              )}
              <div className="absolute top-6 left-6 z-10">
                <span className="px-3 py-1 bg-brand text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {product.category}
                </span>
              </div>
            </div>

            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-8">
              <DialogHeader className="space-y-4">
                <DialogTitle className="text-3xl md:text-4xl font-bold text-white tracking-tighter leading-tight">
                  {product.name}
                </DialogTitle>
                <p className="text-2xl font-mono font-semibold text-brand">
                  {formatARS(product.price)}
                </p>
              </DialogHeader>

              <div className="space-y-6">
                <p className="text-zinc-400 leading-relaxed">
                  {product.description}
                </p>

                <ul className="grid grid-cols-1 gap-3">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm text-zinc-300">
                      <Check className="h-4 w-4 text-brand mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full bg-white text-black hover:bg-brand hover:text-white font-bold h-14 rounded-2xl transition-all duration-300 gap-3 group border-none outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  onClick={() => window.open(PUBLIC_SITE_CONFIG.links.whatsapp(`Hola RPM! Me interesa el producto: ${product.name}. ¿Tienen stock disponible?`), '_blank')}
                  aria-label={`Consultar por WhatsApp sobre ${product.name}`}
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
  );
}
