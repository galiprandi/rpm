import { Lightbulb, Scissors, Sparkles, Droplets, Car, Compass, ArrowUpRight } from 'lucide-react';

const services = [
  {
    title: 'Iluminación',
    description: 'Tecnología LED de alta intensidad para una visibilidad sin compromisos.',
    icon: Lightbulb,
    className: 'md:col-span-2 md:row-span-2',
    bg: 'bg-zinc-900',
  },
  {
    title: 'Estética',
    description: 'Protección PPF y polarizados de grado profesional.',
    icon: Scissors,
    className: 'md:col-span-1 md:row-span-1',
    bg: 'bg-zinc-950',
  },
  {
    title: 'Detailing',
    description: 'Tratamientos que devuelven el alma a tu vehículo.',
    icon: Droplets,
    className: 'md:col-span-1 md:row-span-1',
    bg: 'bg-zinc-950',
  },
  {
    title: 'Cerámicos',
    description: 'Protección molecular con acabado espejo.',
    icon: Sparkles,
    className: 'md:col-span-1 md:row-span-2',
    bg: 'bg-zinc-900',
  },
  {
    title: 'Off-Road',
    description: 'Equipamiento extremo para los terrenos más exigentes.',
    icon: Compass,
    className: 'md:col-span-2 md:row-span-1',
    bg: 'bg-zinc-950',
  },
];

export function Services() {
  return (
    <section className="py-32 bg-black">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-brand font-bold tracking-widest uppercase text-xs mb-4">Especialidades</h2>
            <h3 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none">
              SOLUCIONES <br /> DE INGENIERÍA.
            </h3>
          </div>
          <p className="text-gray-400 text-lg max-w-sm">
            Cada intervención es una obra de precisión, utilizando componentes de vanguardia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((service, index) => (
            <div
              key={service.title}
              className={`group relative overflow-hidden rounded-3xl p-8 transition-all duration-700 hover:scale-[0.98] ${service.bg} border border-white/5 hover:border-brand/20 ${service.className}`}
            >
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:text-brand transition-colors duration-500">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <ArrowUpRight className="h-6 w-6 text-white/20 group-hover:text-brand transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
                
                <div>
                  <h4 className="text-2xl font-bold text-white mb-3 tracking-tight">{service.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
