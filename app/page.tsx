import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { Hero } from '@/components/public/sections/Hero';
import { Services } from '@/components/public/sections/Services';
import { FeaturedProducts } from '@/components/public/sections/FeaturedProducts';
import { Testimonials } from '@/components/public/sections/Testimonials';
import { Button } from '@/components/ui/button';
import { ArrowRight, Camera } from 'lucide-react';
import { PUBLIC_SITE_CONFIG, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/config/public-site';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Equipá tu Pasión',
  description: PUBLIC_SITE_CONFIG.description,
};

export default function HomePage() {
  return (
    <PublicLayout>
      {/* Main Sections */}
      <Hero />
      
      <Services />

      <FeaturedProducts />

      <Testimonials />

      {/* Narrative Section */}
      <section className="py-40 bg-zinc-950 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="max-w-4xl">
              <h2 className="text-brand font-bold tracking-widest uppercase text-xs mb-8 opacity-60">Filosofía RPM</h2>
              <h3 className="text-5xl md:text-8xl font-bold text-white tracking-tighter leading-[0.95] mb-12">
                LA PERFECCIÓN <br />
                ESTÁ EN EL <br />
                <span className="text-zinc-600">DETALLE.</span>
              </h3>
              <p className="text-2xl text-gray-400 leading-relaxed mb-16 text-balance">
                No solo instalamos accesorios. Diseñamos experiencias de conducción superiores. 
                Cada cable, cada conexión y cada acabado se ejecutan con estándares de fábrica.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-16">
                <div className="space-y-6">
                  <div className="w-px h-20 bg-brand" />
                  <h4 className="text-2xl font-bold">Instalación Certificada</h4>
                  <p className="text-gray-400">Nuestro equipo está capacitado para intervenir los sistemas eléctricos más complejos sin comprometer la garantía original.</p>
                </div>
                <div className="space-y-6">
                  <div className="w-px h-20 bg-zinc-800" />
                  <h4 className="text-2xl font-bold">Garantía de Por Vida</h4>
                  <p className="text-gray-400">Confiamos tanto en nuestra mano de obra que garantizamos todas nuestras instalaciones de estética de por vida.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <a href={PUBLIC_SITE_CONFIG.links.whatsapp(DEFAULT_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-white text-black hover:bg-zinc-200 font-bold px-10 h-14 rounded-full transition-all">
                    Agendar Instalación
                  </Button>
                </a>
                <a href={PUBLIC_SITE_CONFIG.instagramUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 font-bold px-10 h-14 rounded-full gap-2">
                    <Camera className="h-5 w-5" />
                    Ver Trabajos
                  </Button>
                </a>
              </div>
            </div>

            <div className="relative aspect-square bg-zinc-900 rounded-[40px] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
              <div className="absolute inset-0 flex items-center justify-center text-white/10 group-hover:scale-110 transition-transform duration-700">
                 <span className="text-[120px] font-black tracking-tighter italic">RPM</span>
              </div>
              <div className="absolute bottom-12 left-12 right-12 z-20 space-y-4">
                <p className="text-brand font-bold uppercase tracking-widest text-xs">Visto en redes</p>
                <h4 className="text-3xl font-bold text-white tracking-tight italic">ÚLTIMOS TRABAJOS</h4>
                <a 
                  href={PUBLIC_SITE_CONFIG.instagramUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm font-bold text-white/60 hover:text-white transition-colors group/btn"
                >
                  VER GALERÍA COMPLETA <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* High-Impact CTA */}
      <section className="py-60 bg-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,75,0,0.1)_0,transparent_70%)]" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-7xl md:text-[160px] font-black tracking-[0.1em] text-white/5 uppercase mb-[-40px] md:mb-[-80px] select-none">
            EXTRAORDINARIO
          </h2>
          <div className="space-y-12">
            <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">
              ¿Llevamos tu vehículo <br /> al siguiente nivel?
            </h3>
            <div className="flex justify-center">
               <a href={PUBLIC_SITE_CONFIG.links.whatsapp(DEFAULT_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
                 <Button className="bg-brand text-white hover:bg-brand/90 font-bold px-16 h-20 text-xl rounded-full transition-all hover:scale-105 active:scale-95 border-none shadow-[0_0_40px_rgba(255,75,0,0.3)]">
                    Solicitar Cotización
                 </Button>
               </a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
