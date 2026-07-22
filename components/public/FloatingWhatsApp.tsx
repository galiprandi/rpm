'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { PUBLIC_SITE_CONFIG, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/config/public-site';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const QUICK_QUESTIONS = [
  {
    label: '📅 Reservar Turno',
    message: '¡Hola! Me gustaría coordinar un turno para mi vehículo.',
  },
  {
    label: '💡 Iluminación LED',
    message: '¡Hola! Quisiera recibir una cotización de iluminación LED para mi vehículo.',
  },
  {
    label: '✨ Detailing o PPF',
    message: '¡Hola! Me interesa proteger la pintura de mi auto con PPF o tratamiento cerámico. ¿Me pasarían información?',
  },
  {
    label: '🏔️ Equipamiento Off-Road',
    message: '¡Hola! Me interesa equipar mi camioneta para Off-Road. ¿Qué opciones tienen?',
  }
];

export function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const widgetRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Toggle widget visibility
  const toggleWidget = () => {
    setIsOpen((prev) => !prev);
  };

  // Close widget
  const closeWidget = () => {
    setIsOpen(false);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeWidget();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        closeWidget();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Quick Question chip click
  const handleQuickQuestion = (message: string) => {
    setCustomMessage(message);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Trigger WhatsApp redirection
  const handleSendMessage = () => {
    const messageToSend = customMessage.trim() || DEFAULT_WHATSAPP_MESSAGE;
    window.open(PUBLIC_SITE_CONFIG.links.whatsapp(messageToSend), '_blank');
    closeWidget();
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4" ref={widgetRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="w-[360px] max-w-[calc(100vw-2rem)] bg-zinc-950 border border-white/10 rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Chat de consulta de WhatsApp"
          >
            {/* Header */}
            <div className="bg-zinc-900 px-6 py-5 border-b border-white/5 flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full bg-zinc-800 overflow-hidden border border-white/10 flex-shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120"
                    alt="Sofi"
                    width={44}
                    height={44}
                    className="object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm tracking-tight">Sofi</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-400">Asesora RPM</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">En Línea</span>
                  </div>
                </div>
              </div>

              <button
                onClick={closeWidget}
                className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50"
                aria-label="Cerrar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-6 space-y-5 max-h-[350px] overflow-y-auto custom-scrollbar bg-zinc-950">
              {/* Agent Welcome Message */}
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Sofi</span>
                <div className="bg-zinc-900 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none text-zinc-300 text-sm leading-relaxed max-w-[90%]">
                  ¡Hola! 👋 ¿En qué podemos ayudarte hoy? Elegí una de las opciones rápidas o escribí tu propia consulta.
                </div>
              </div>

              {/* Quick Options Chips */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Preguntas Frecuentes</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((question) => (
                    <button
                      key={question.label}
                      onClick={() => handleQuickQuestion(question.message)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-brand/30 text-xs font-semibold text-zinc-300 hover:text-white rounded-full transition-all duration-300 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      {question.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Form */}
            <div className="p-6 bg-zinc-900/50 border-t border-white/5 space-y-4">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Escribí tu consulta aquí..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand/50 placeholder-zinc-500 h-20 resize-none custom-scrollbar transition-all"
                  aria-label="Tu mensaje de consulta"
                />
              </div>

              <button
                onClick={handleSendMessage}
                className="w-full h-12 bg-[#25D366] hover:bg-[#20ba56] text-white font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(37,211,102,0.3)] outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label="Enviar consulta por WhatsApp"
              >
                <Send className="h-4 w-4" />
                Iniciar Conversación
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleWidget}
            className={cn(
              "group relative flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgb(37,211,102,0.4)] transition-all duration-500 hover:scale-110 active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-emerald-400"
            )}
            aria-label="Abrir chat de WhatsApp"
            aria-expanded={isOpen}
          >
            {/* Ping animation effect when closed */}
            {!isOpen && (
              <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none" />
            )}

            {isOpen ? (
              <X className="relative h-7 w-7 transition-transform duration-500 rotate-0 group-hover:scale-110" />
            ) : (
              <MessageCircle className="relative h-8 w-8 transition-transform duration-500 group-hover:rotate-12" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-zinc-900 text-white border-white/10 px-4 py-2 font-bold tracking-tight">
          {isOpen ? "Cerrar chat" : "¿En qué podemos ayudarte?"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
