'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Tagline */}
          <div className="overflow-hidden mb-6">
            <p className="text-brand font-bold tracking-[0.2em] uppercase text-xs animate-fade-up opacity-0" style={{ animationDelay: '0.2s' }}>
              Precision & Performance
            </p>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-[120px] font-bold tracking-tighter leading-[0.9] text-white mb-8 opacity-0 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            EQUIPÁ TU <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">PASIÓN.</span>
          </h1>

          {/* Subhead */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12 opacity-0 animate-fade-up text-balance" style={{ animationDelay: '0.6s' }}>
            Diseño, tecnología y mano de obra experta para transformar tu vehículo en algo extraordinario.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 opacity-0 animate-fade-up" style={{ animationDelay: '0.8s' }}>
            <Link href="/productos">
              <Button className="group h-16 px-10 bg-white text-black hover:bg-white/90 text-lg font-bold rounded-full transition-all duration-500 hover:scale-105">
                Explorar Catálogo
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              variant="link" 
              className="text-white text-lg font-bold hover:text-brand transition-colors"
              onClick={() => window.open('https://wa.me/543813199647?text=Hola%20RPM%20Accesorios!%20Me%20gustaría%20agendar%20un%20turno%20para%20mi%20vehículo.', '_blank')}
            >
              Reservar una consulta
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
        <div className="w-px h-12 bg-white" />
      </div>
    </section>
  );
}
