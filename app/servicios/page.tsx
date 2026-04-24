import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { Lightbulb, Sparkles, Compass } from 'lucide-react';

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
    </PublicLayout>
  );
}
