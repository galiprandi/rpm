'use client';

import { MessageCircle } from 'lucide-react';
import { PUBLIC_SITE_CONFIG, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/config/public-site';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function FloatingWhatsApp() {
  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={PUBLIC_SITE_CONFIG.links.whatsapp(DEFAULT_WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group relative flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgb(37,211,102,0.4)] transition-all duration-500 hover:scale-110 active:scale-95"
            )}
            aria-label="Contactar por WhatsApp"
          >
            {/* Ping animation effect */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping" />
            <MessageCircle className="relative h-8 w-8 transition-transform duration-500 group-hover:rotate-12" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-zinc-900 text-white border-white/10 px-4 py-2 font-bold tracking-tight">
          ¿En qué podemos ayudarte?
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
