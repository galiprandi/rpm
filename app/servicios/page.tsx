import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { Lightbulb, Sparkles, Compass, MessageSquare, Wrench, ShieldCheck, ClipboardCheck, MessageCircle } from 'lucide-react';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { PUBLIC_SITE_CONFIG, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/config/public-site';

export const metadata: Metadata = {
  title: 'Servicios | RPM Accesorios',
  description: 'Instalación certificada de iluminación LED, protección PPF y equipamiento off-road en Tucumán.',
};

const serviceDetails = [
  {
    title: 'Ingeniería de Iluminación',
    description: 'Actualización completa de sistemas ópticos con tecnología Cree LED. Optimizamos el patrón de luz para máxima seguridad.',
    icon: Lightbulb,
    benefits: ['Aumento de visión 300%', 'Bajo consumo eléctrico', 'Garantía de un año'],
  },
  {
    title: 'Protección de Superficies',
    description: 'Aplicación de Paint Protection Film (PPF) y selladores cerámicos de grado nanotecnológico.',
    icon: Sparkles,
    benefits: ['Resistencia a rayones', 'Repelencia al agua', 'Brillo espejo permanente'],
  },
  {
    title: 'Customización Off-Road',
    description: 'Equipamiento estructural y funcional para travesías. Snorkels, malacates y suspensiones reforzadas.',
    icon: Compass,
    benefits: ['Instalación certificada', 'Componentes de alta resistencia', 'Asesoramiento técnico'],
  },
];

export default function ServicesPage() {
  const steps = [
    {
      title: 'Asesoramiento',
      description: 'Análisis personalizado de tus necesidades y compatibilidad técnica.',
      icon: MessageSquare,
    },
    {
      title: 'Diagnóstico',
      description: 'Evaluación integral del sistema antes de cualquier intervención.',
      icon: ClipboardCheck,
    },
    {
      title: 'Instalación',
      description: 'Ejecución bajo estándares de fábrica por técnicos certificados.',
      icon: Wrench,
    },
    {
      title: 'Garantía',
      description: 'Control de calidad final y respaldo total en mano de obra.',
      icon: ShieldCheck,
    },
  ];

  return (
    <PublicLayout>
      <section className="pt-40 pb-32 bg-black overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mb-24 space-y-6">
            <h1 className="text-brand font-bold tracking-widest uppercase text-xs animate-fade-up opacity-0" style={{ animationDelay: '0.1s' }}>Servicios Técnicos</h1>
            <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter leading-none animate-fade-up opacity-0" style={{ animationDelay: '0.2s' }}>
              MAESTRÍA EN <br /> INSTALACIÓN.
            </h2>
            <p className="text-xl text-zinc-500 leading-relaxed max-w-2xl animate-fade-up opacity-0" style={{ animationDelay: '0.3s' }}>
              Combinamos tecnología de vanguardia con precisión artesanal para elevar los estándares de tu vehículo.
            </p>
          </div>

          <div className="space-y-48">
            {serviceDetails.map((service, index) => (
              <div 
                key={service.title} 
                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-20 items-center animate-fade-up opacity-0`}
                style={{ animationDelay: `${0.4 + (index * 0.1)}s` }}
              >
                <div className="flex-1 space-y-8">
                  <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <service.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-4xl font-bold text-white tracking-tight">{service.title}</h3>
                  <p className="text-lg text-zinc-400 leading-relaxed">{service.description}</p>
                  <ul className="space-y-4">
                    {service.benefits.map(benefit => (
                      <li key={benefit} className="flex items-center text-zinc-300 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand mr-4 group-hover:scale-150 transition-transform" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full aspect-video bg-zinc-900 rounded-3xl overflow-hidden relative group">
                   <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                   <div className="absolute inset-0 flex items-center justify-center text-white/5 font-black text-6xl italic select-none transition-transform duration-1000 group-hover:scale-110">
                     RPM TECH
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso Section */}
      <section className="py-32 bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-brand font-bold tracking-widest uppercase text-xs">Metodología</h2>
            <h3 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">PROCESO DE EXCELENCIA.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative p-8 bg-zinc-900/30 border border-white/5 rounded-3xl hover:border-brand/30 transition-all duration-500 group animate-fade-up opacity-0"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="mb-6 w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand group-hover:scale-110 transition-transform duration-500">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="absolute top-8 right-8 text-white/5 font-black text-4xl italic group-hover:text-brand/10 transition-colors">
                  0{index + 1}
                </div>
                <h4 className="text-xl font-bold text-white mb-3">{step.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* High-Impact CTA */}
      <section className="py-60 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,75,0,0.1)_0,transparent_70%)]" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">
              ¿Listo para transformar <br /> tu experiencia de manejo?
            </h2>
            <p className="text-xl text-zinc-500 leading-relaxed">
              Agendá una consulta técnica hoy mismo y descubrí el verdadero potencial de tu vehículo.
            </p>
            <div className="flex justify-center">
               <a href={PUBLIC_SITE_CONFIG.links.whatsapp(DEFAULT_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
                 <Button className="bg-brand text-white hover:bg-brand/90 font-bold px-16 h-20 text-xl rounded-full transition-all hover:scale-105 active:scale-95 border-none shadow-[0_0_40px_rgba(255,75,0,0.3)] gap-3">
                    <MessageCircle className="h-6 w-6 fill-current" />
                    Solicitar Turno
                 </Button>
               </a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
