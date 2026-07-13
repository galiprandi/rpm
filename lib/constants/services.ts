import { Lightbulb, Sparkles, Compass, Scissors, Droplets, LucideIcon } from 'lucide-react';

export interface PublicService {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription?: string;
  icon: LucideIcon;
  href: string;
  benefits?: string[];
  gridClassName?: string;
  bg?: string;
}

export const publicServices: PublicService[] = [
  {
    id: 'iluminacion',
    title: 'Ingeniería de Iluminación',
    shortDescription: 'Tecnología LED de alta intensidad para una visibilidad sin compromisos.',
    fullDescription: 'Actualización completa de sistemas ópticos con tecnología Cree LED. Optimizamos el patrón de luz para máxima seguridad.',
    icon: Lightbulb,
    href: '/servicios',
    benefits: ['Aumento de visión 300%', 'Bajo consumo eléctrico', 'Garantía de un año'],
    gridClassName: 'md:col-span-2 md:row-span-2',
    bg: 'bg-zinc-900',
  },
  {
    id: 'estetica',
    title: 'Estética y Polarizados',
    shortDescription: 'Protección solar y polarizados de grado profesional.',
    fullDescription: 'Instalación de láminas de control solar de alto rendimiento. Mejoramos la privacidad, seguridad y el confort térmico de tu habitáculo con materiales premium.',
    icon: Scissors,
    href: '/servicios',
    benefits: ['Rechazo de calor hasta 60%', 'Protección contra fragmentos de vidrio', 'Privacidad y estética superior'],
    gridClassName: 'md:col-span-1 md:row-span-1',
    bg: 'bg-zinc-950',
  },
  {
    id: 'detailing',
    title: 'Detailing Avanzado',
    shortDescription: 'Tratamientos integrales de limpieza y restauración.',
    fullDescription: 'Proceso meticuloso de limpieza, corrección y protección de todas las superficies del vehículo. Devolvemos el brillo original y eliminamos imperfecciones.',
    icon: Droplets,
    href: '/servicios',
    benefits: ['Descontaminado profundo', 'Corrección de micro-rayones', 'Protección duradera de interiores'],
    gridClassName: 'md:col-span-1 md:row-span-1',
    bg: 'bg-zinc-950',
  },
  {
    id: 'proteccion',
    title: 'Protección de Superficies',
    shortDescription: 'PPF y selladores cerámicos de grado nanotecnológico.',
    fullDescription: 'Aplicación de Paint Protection Film (PPF) y selladores cerámicos de grado nanotecnológico.',
    icon: Sparkles,
    href: '/servicios',
    benefits: ['Resistencia a rayones', 'Repelencia al agua', 'Brillo espejo permanente'],
    gridClassName: 'md:col-span-1 md:row-span-2',
    bg: 'bg-zinc-900',
  },
  {
    id: 'off-road',
    title: 'Customización Off-Road',
    shortDescription: 'Equipamiento extremo para los terrenos más exigentes.',
    fullDescription: 'Equipamiento estructural y funcional para travesías. Snorkels, malacates y suspensiones reforzadas.',
    icon: Compass,
    href: '/servicios',
    benefits: ['Instalación certificada', 'Componentes de alta resistencia', 'Asesoramiento técnico'],
    gridClassName: 'md:col-span-2 md:row-span-1',
    bg: 'bg-zinc-950',
  }
];
