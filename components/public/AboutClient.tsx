'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Award, Users, CheckCircle2, History, Eye, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProjectQuickView } from './ProjectQuickView';

export interface GalleryItem {
  id: string;
  year: string;
  title: string;
  category: string;
  description: string;
  details: string[];
  visualKey: string;
}

export const galleryItems: GalleryItem[] = [
  {
    id: 'iluminacion-2012',
    year: '2012',
    title: 'Taller de Iluminación',
    category: 'Iluminación',
    description: 'El origen de nuestra especialización. Comenzamos instalando los sistemas lumínicos más potentes y seguros, estableciendo las bases de la precisión eléctrica en Tucumán.',
    details: ['Tecnología Bi-LED de alto flujo', 'Sistemas secuenciales progresivos', 'Alineación láser de precisión', 'Instalación 100% Plug & Play'],
    visualKey: '💡'
  },
  {
    id: 'detailing-2015',
    year: '2015',
    title: 'Estudio de Estética',
    category: 'Estética',
    description: 'Inauguramos nuestra división de Detailing Avanzado. Cuidado minucioso de la pintura utilizando recubrimientos cerámicos alemanes y láminas de protección PPF (Paint Protection Film) de alta resistencia.',
    details: ['Tratamientos Cerámicos 9H', 'Láminas PPF Pro-Shield', 'Corrección de laca en múltiples pasos', 'Protección extrema contra rayos UV'],
    visualKey: '✨'
  },
  {
    id: 'electronica-2018',
    year: '2018',
    title: 'Laboratorio Electrónico',
    category: 'Integración',
    description: 'Ampliamos nuestra infraestructura para incorporar un laboratorio de electrónica. Integración de audio premium y sistemas multimedia de última generación sin alterar la garantía de fábrica.',
    details: ['Sistemas multimedia integrados', 'Insonorización acústica premium', 'Módulos de confort vehicular', 'Calibración de audio DSP'],
    visualKey: '🔌'
  },
  {
    id: 'offroad-2021',
    year: '2021',
    title: 'División Off-Road',
    category: 'Equipamiento',
    description: 'Creamos la división especializada en equipamiento extremo para vehículos todo terreno y expedición, diseñando suspensiones y montajes para desafíos extremos.',
    details: ['Suspensiones de nitrógeno regulables', 'Malacates Winch de alta performance', 'Soportes estructurales reforzados', 'Barras LED de grado militar'],
    visualKey: '🏔️'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.21, 0.47, 0.32, 0.98] as const,
    }
  },
};

export function AboutClient() {
  const searchParams = useSearchParams();
  const [selectedProject, setSelectedProject] = useState<GalleryItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    const projectId = searchParams.get('project');
    if (projectId) {
      const project = galleryItems.find(p => p.id === projectId);
      if (project) {
        Promise.resolve().then(() => {
          if (!cancelled) {
            setSelectedProject(project);
          }
        });
      }
    }
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <section className="pt-40 pb-32 bg-black">
      <div className="container mx-auto px-6">
        {/* Intro Hero */}
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

        {/* Milestone & History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-32 mb-40 items-center">
          <div className="space-y-12 animate-fade-up opacity-0" style={{ animationDelay: '0.4s' }}>
            <div className="w-px h-24 bg-brand" />
            <h3 className="text-4xl font-bold text-white tracking-tight">El Estándar RPM</h3>
            <p className="text-lg text-zinc-500 leading-relaxed">
              Lo que comenzó como un pequeño taller de iluminación se transformó en un centro integral
              de estética y rendimiento. Nuestra filosofía es simple: si no es perfecto, no está terminado.
            </p>
          </div>
          <div className="aspect-square bg-zinc-900 rounded-[40px] flex items-center justify-center text-white/5 font-black text-9xl italic select-none animate-reveal opacity-0 relative overflow-hidden group" style={{ animationDelay: '0.5s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <span className="relative z-10 group-hover:text-white/10 transition-colors duration-700">2011</span>
          </div>
        </div>

        {/* Galería de Excelencia Section */}
        <div className="mb-40 space-y-16">
          <div className="max-w-3xl space-y-4">
            <h3 className="text-brand font-bold tracking-widest uppercase text-xs">Hitos RPM</h3>
            <h4 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">GALERÍA DE EXCELENCIA.</h4>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Explorá los momentos y divisiones clave que consolidaron nuestro liderazgo en personalización y equipamiento premium.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {galleryItems.map((project) => (
              <motion.div
                key={project.id}
                variants={cardVariants}
                whileHover={{
                  scale: 0.98,
                  transition: { duration: 0.4 }
                }}
                className="group relative aspect-[4/3] bg-zinc-900/40 overflow-hidden rounded-[32px] border border-white/5 hover:border-brand/20 transition-all duration-700"
              >
                {/* Visual Symbol Background */}
                <div className="absolute inset-0 flex items-center justify-center text-[130px] md:text-[160px] font-black text-white/5 select-none transition-transform duration-700 group-hover:scale-110">
                  {project.visualKey}
                </div>

                {/* Quick View Icon Overlay */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 z-20">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white cursor-pointer hover:bg-brand hover:border-brand transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                        }}
                        aria-label={`Ver detalles del hito ${project.title}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-zinc-900 border-white/10 text-white text-xs font-bold uppercase tracking-widest">
                      Ver Detalles
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Bottom Card Content */}
                <div className="absolute bottom-8 left-8 right-8 space-y-4 z-10">
                  <div>
                    <span className="px-3 py-1 bg-brand/10 border border-brand/20 text-brand text-[10px] font-bold uppercase tracking-widest rounded-full">
                      Hito {project.year}
                    </span>
                    <h5 className="text-2xl font-bold text-white tracking-tight mt-3">{project.title}</h5>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">{project.category}</p>
                  </div>
                  <div className="flex items-center justify-between opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                    <p className="text-zinc-400 text-sm line-clamp-1 max-w-[70%]">{project.description}</p>
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="flex items-center text-xs font-bold text-brand hover:text-white transition-colors gap-1"
                    >
                      DETALLES <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Benefits Grid */}
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

      <ProjectQuickView
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}
