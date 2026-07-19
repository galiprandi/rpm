import { Quote, Star } from 'lucide-react';
import { motion } from 'framer-motion';

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

const testimonials = [
  {
    name: 'Martin R.',
    vehicle: 'Toyota Hilux',
    content: 'La atención al detalle es increíble. Mi camioneta quedó mejor que de fábrica con la nueva iluminación LED. 100% recomendado.',
    rating: 5,
  },
  {
    name: 'Facundo G.',
    vehicle: 'Ford Ranger',
    content: 'Excelente asesoramiento para el kit de suspensión Off-Road. Se nota que saben de ingeniería y no solo de estética.',
    rating: 5,
  },
  {
    name: 'Sofia M.',
    vehicle: 'Audi Q3',
    content: 'El tratamiento cerámico y el PPF son imperceptibles y protegen perfectamente la pintura. Un nivel de profesionalismo único en Tucumán.',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-32 bg-zinc-950 relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-brand/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-brand font-bold tracking-widest uppercase text-xs mb-4">Experiencias RPM</h2>
          <h3 className="text-5xl md:text-7xl font-bold text-white tracking-tighter">
            CLIENTES <br /> SATISFECHOS.
          </h3>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              whileHover={{
                scale: 0.98,
                transition: { duration: 0.4 }
              }}
              whileTap={{ scale: 0.96 }}
              className="bg-zinc-900/50 border border-white/5 p-10 rounded-[32px] flex flex-col justify-between group hover:border-brand/20 transition-all duration-500 cursor-pointer"
            >
              <div>
                <Quote className="h-10 w-10 text-brand/20 group-hover:text-brand/40 transition-colors mb-6" />
                <div className="flex gap-1 mb-6">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-brand text-brand" />
                  ))}
                </div>
                <p className="text-lg text-zinc-300 leading-relaxed mb-8 italic">
                  &ldquo;{t.content}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-brand font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="text-white font-bold tracking-tight">{t.name}</h4>
                  <p className="text-zinc-500 text-sm uppercase tracking-widest font-medium">{t.vehicle}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
