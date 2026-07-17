'use client';

import { Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PUBLIC_SITE_CONFIG } from '@/lib/config/public-site';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GalleryItem } from './AboutClient';

interface ProjectQuickViewProps {
  project: GalleryItem | null;
  onClose: () => void;
}

export function ProjectQuickView({ project, onClose }: ProjectQuickViewProps) {
  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-white/10 p-0 overflow-hidden">
        {project && (
          <div className="flex flex-col md:flex-row h-full">
            {/* Left Column: Stylized Visual Placeholder */}
            <div className="md:w-1/2 aspect-square md:aspect-auto bg-zinc-900 flex items-center justify-center relative overflow-hidden min-h-[250px]">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-60" />
              <span className="text-[140px] font-black text-white/5 select-none transition-transform duration-700 hover:scale-105">
                {project.visualKey}
              </span>
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <span className="px-3 py-1 bg-brand text-white text-[10px] font-bold uppercase tracking-widest rounded-full self-start">
                  Hito {project.year}
                </span>
                <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-full self-start border border-white/5">
                  {project.category}
                </span>
              </div>
            </div>

            {/* Right Column: Information & Actions */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-8">
              <DialogHeader className="space-y-4">
                <DialogTitle className="text-3xl md:text-4xl font-bold text-white tracking-tighter leading-tight">
                  {project.title}
                </DialogTitle>
                <div className="h-px bg-white/5 w-12" />
              </DialogHeader>

              <div className="space-y-6">
                <p className="text-zinc-400 leading-relaxed text-sm">
                  {project.description}
                </p>

                <ul className="grid grid-cols-1 gap-3">
                  {project.details.map((detail, i) => (
                    <li key={i} className="flex items-center text-sm text-zinc-300">
                      <Check className="h-4 w-4 text-brand mr-3 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full bg-white text-black hover:bg-brand hover:text-white font-bold h-14 rounded-2xl transition-all duration-300 gap-3 group border-none outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  onClick={() => window.open(PUBLIC_SITE_CONFIG.links.whatsapp(`Hola RPM! Me interesa conocer más sobre su especialización en ${project.title} (${project.year}). ¿Qué servicios similares ofrecen actualmente?`), '_blank')}
                  aria-label={`Consultar por WhatsApp sobre ${project.title}`}
                >
                  <MessageCircle className="h-5 w-5 fill-current transition-transform group-hover:scale-110" />
                  CONSULTAR DETALLES
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
