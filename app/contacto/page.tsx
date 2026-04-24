'use client';

import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  return (
    <PublicLayout>
      <section className="pt-40 pb-32 bg-black min-h-screen overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            <div className="space-y-12">
              <div className="space-y-6">
                <h1 className="text-brand font-bold tracking-widest uppercase text-xs animate-fade-up opacity-0" style={{ animationDelay: '0.1s' }}>Atención Directa</h1>
                <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter leading-none animate-fade-up opacity-0" style={{ animationDelay: '0.2s' }}>
                  HABLEMOS.
                </h2>
                <p className="text-xl text-zinc-500 leading-relaxed max-w-lg animate-fade-up opacity-0" style={{ animationDelay: '0.3s' }}>
                  ¿Tenés un proyecto en mente? Nuestro equipo técnico está listo para asesorarte.
                </p>
              </div>

              <div className="space-y-8">
                <a 
                  href="https://wa.me/543813199647?text=Hola%20RPM%20Accesorios!%20Me%20gustaría%20agendar%20un%20turno%20para%20mi%20vehículo." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-8 bg-zinc-900/50 border border-white/5 rounded-3xl hover:border-brand/50 transition-all group animate-fade-up opacity-0"
                  style={{ animationDelay: '0.4s' }}
                >
                  <div className="w-12 h-12 rounded-full bg-green-600/10 flex items-center justify-center text-green-500 mr-6 group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">WhatsApp</h4>
                    <p className="text-zinc-500 text-sm">Respuesta inmediata</p>
                  </div>
                </a>

                <div 
                  className="flex items-center p-8 bg-zinc-900/50 border border-white/5 rounded-3xl group animate-fade-up opacity-0"
                  style={{ animationDelay: '0.5s' }}
                >
                  <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand mr-6">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Local Tucumán</h4>
                    <p className="text-zinc-500 text-sm">San Lorenzo 1462, S.M. de Tucumán</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-12 space-y-8 animate-fade-up opacity-0" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-2xl font-bold text-white tracking-tight">Enviar Mensaje</h3>
              <form className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nombre Completo</label>
                  <input type="text" className="w-full bg-black/50 border border-white/10 rounded-2xl h-14 px-6 text-white focus:outline-none focus:border-brand/50 transition-all" placeholder="Juan Pérez" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email</label>
                  <input type="email" className="w-full bg-black/50 border border-white/10 rounded-2xl h-14 px-6 text-white focus:outline-none focus:border-brand/50 transition-all" placeholder="juan@ejemplo.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mensaje / Consulta</label>
                  <textarea className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-brand/50 transition-all min-h-[150px]" placeholder="¿En qué podemos ayudarte?"></textarea>
                </div>
                <Button className="w-full h-16 bg-brand text-white font-bold text-lg rounded-2xl hover:bg-brand/90 transition-all active:scale-95">
                  Enviar Consulta
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
