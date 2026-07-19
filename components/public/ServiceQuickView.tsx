'use client';

import { Check, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PUBLIC_SITE_CONFIG } from '@/lib/config/public-site';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PublicService } from '@/lib/constants/services';
import Image from 'next/image';

interface ServiceQuickViewProps {
  service: PublicService | null;
  onClose: () => void;
}

export function ServiceQuickView({ service, onClose }: ServiceQuickViewProps) {
  return (
    <Dialog open={!!service} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-white/10 p-0 overflow-hidden">
        {service && (
          <div className="flex flex-col md:flex-row h-full">
            <div className="md:w-1/2 aspect-video md:aspect-auto bg-zinc-900 flex items-center justify-center relative overflow-hidden group">
              {service.imageUrl ? (
                <Image
                  src={service.imageUrl}
                  alt={service.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover opacity-30 group-hover:opacity-45 group-hover:scale-105 transition-all duration-1000"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/5 font-black text-6xl italic select-none">
                  RPM TECH
                </div>
              )}
              <div className="absolute inset-0 bg-brand/5" />
              <div className="relative z-10 w-20 h-20 rounded-3xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20 backdrop-blur-sm">
                <service.icon className="h-10 w-10" />
              </div>
              <div className="absolute top-6 left-6">
                <span className="px-3 py-1 bg-brand text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Servicio Técnico
                </span>
              </div>
            </div>

            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-8">
              <DialogHeader className="space-y-4">
                <DialogTitle className="text-3xl md:text-4xl font-bold text-white tracking-tighter leading-tight">
                  {service.title}
                </DialogTitle>
                <p className="text-zinc-500 font-medium uppercase tracking-widest text-xs">
                  Excelencia en Ingeniería
                </p>
              </DialogHeader>

              <div className="space-y-6">
                <p className="text-zinc-400 leading-relaxed">
                  {service.fullDescription || service.shortDescription}
                </p>

                {service.benefits && (
                  <ul className="grid grid-cols-1 gap-3">
                    {service.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center text-sm text-zinc-300">
                        <Check className="h-4 w-4 text-brand mr-3 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <Button
                  className="w-full bg-brand text-white hover:bg-brand/90 font-bold h-14 rounded-2xl transition-all duration-300 gap-3 group"
                  onClick={() => window.open(PUBLIC_SITE_CONFIG.links.whatsapp(`Hola RPM! Me interesa el servicio: ${service.title}. ¿Me podrían dar más información?`), '_blank')}
                >
                  <MessageCircle className="h-5 w-5 fill-current transition-transform group-hover:scale-110" />
                  CONSULTAR POR WHATSAPP
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-zinc-500 hover:text-white transition-colors gap-2"
                  onClick={() => {
                    onClose();
                    window.location.href = '/servicios';
                  }}
                >
                  VER PROCESO COMPLETO <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
