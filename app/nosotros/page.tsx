import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { Award, Users, CheckCircle2, History } from 'lucide-react';

export default function AboutPage() {
  return (
    <PublicLayout>
      <section className="pt-40 pb-32 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mb-32 space-y-8">
            <h1 className="text-brand font-bold tracking-widest uppercase text-xs animate-fade-up opacity-0" style={{ animationDelay: '0.1s' }}>Nuestra Historia</h1>
            <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter leading-[0.9] animate-fade-up opacity-0" style={{ animationDelay: '0.2s' }}>
              PASIÓN POR <br />
              LA PRECISIÓN.
            </h2>
            <p className="text-2xl text-zinc-400 leading-relaxed text-balance animate-fade-up opacity-0" style={{ animationDelay: '0.3s' }}>
              Desde 2011, RPM Accesorios ha sido el epicentro del equipamiento vehicular en Tucumán, 
              fusionando artesanía tradicional con tecnología de punta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-32 mb-40 items-center">
            <div className="space-y-12 animate-fade-up opacity-0" style={{ animationDelay: '0.4s' }}>
              <div className="w-px h-24 bg-brand" />
              <h3 className="text-4xl font-bold text-white tracking-tight">El Estándar RPM</h3>
              <p className="text-lg text-zinc-500 leading-relaxed">
                Lo que comenzó como un pequeño taller de iluminación se transformó en un centro integral 
                de estética y rendimiento. Nuestra filosofía es simple: si no es perfecto, no está terminado.
              </p>
            </div>
            <div className="aspect-square bg-zinc-900 rounded-[40px] flex items-center justify-center text-white/5 font-black text-9xl italic select-none animate-reveal opacity-0" style={{ animationDelay: '0.5s' }}>
              2011
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Award, title: 'Calidad Premium', desc: 'Solo trabajamos con marcas líderes a nivel mundial.' },
              { icon: Users, title: 'Staff Experto', desc: 'Técnicos certificados con años de experiencia real.' },
              { icon: CheckCircle2, title: 'Garantía Total', desc: 'Respaldo absoluto en cada pieza e instalación.' },
              { icon: History, title: 'Trayectoria', desc: 'Más de una década equipando los mejores vehículos.' },
            ].map((item, i) => (
              <div 
                key={i} 
                className="p-8 bg-zinc-900/30 border border-white/5 rounded-3xl space-y-6 hover:border-brand/30 transition-all duration-500 group animate-fade-up opacity-0"
                style={{ animationDelay: `${0.6 + (i * 0.1)}s` }}
              >
                <item.icon className="h-8 w-8 text-brand group-hover:scale-110 transition-transform duration-500" />
                <h4 className="text-xl font-bold text-white">{item.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
