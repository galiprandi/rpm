'use client';

import { useState } from 'react';
import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { MapPin, MessageCircle, Send, CheckCircle2, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PUBLIC_SITE_CONFIG, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/config/public-site';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContactClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const whatsappMessage = `Hola RPM Accesorios! Mi nombre es ${formData.name} (${formData.email}).\n\nMensaje: ${formData.message}`;
    const generatedUrl = PUBLIC_SITE_CONFIG.links.whatsapp(whatsappMessage);
    setWhatsappUrl(generatedUrl);

    // Simulate premium visual load feedback before showing success/launch state
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Attempt window.open but keep backup in UI in case of blocker
      window.open(generatedUrl, '_blank');
    }, 1200);
  };

  const handleReset = () => {
    setFormData({ name: '', email: '', message: '' });
    setIsSubmitted(false);
    setWhatsappUrl('');
  };

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
                  href={PUBLIC_SITE_CONFIG.links.whatsapp(DEFAULT_WHATSAPP_MESSAGE)}
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
                    <p className="text-zinc-500 text-sm">{PUBLIC_SITE_CONFIG.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-12 relative min-h-[500px] flex flex-col justify-center animate-fade-up overflow-hidden opacity-0" style={{ animationDelay: '0.6s' }}>
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-8"
                  >
                    <h3 className="text-2xl font-bold text-white tracking-tight">Enviar Mensaje</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nombre Completo</label>
                        <input
                          id="name"
                          type="text"
                          required
                          disabled={isSubmitting}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-2xl h-14 px-6 text-white focus:outline-none focus:border-brand/50 transition-all disabled:opacity-50"
                          placeholder="Juan Pérez"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email</label>
                        <input
                          id="email"
                          type="email"
                          required
                          disabled={isSubmitting}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-2xl h-14 px-6 text-white focus:outline-none focus:border-brand/50 transition-all disabled:opacity-50"
                          placeholder="juan@ejemplo.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="message" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mensaje / Consulta</label>
                        <textarea
                          id="message"
                          required
                          disabled={isSubmitting}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-brand/50 transition-all min-h-[150px] disabled:opacity-50"
                          placeholder="¿En qué podemos ayudarte?"
                        ></textarea>
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 bg-brand text-white font-bold text-lg rounded-2xl hover:bg-brand/90 transition-all active:scale-95 gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            Enviar a WhatsApp
                          </>
                        )}
                      </Button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="text-center space-y-8 flex flex-col items-center justify-center py-8"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                      <CheckCircle2 className="h-10 w-10 animate-bounce" />
                    </div>

                    <div className="space-y-4 max-w-md">
                      <h3 className="text-3xl font-bold text-white tracking-tight">¡Mensaje Preparado!</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        Si tu navegador bloqueó la redirección automática, podés usar el botón de abajo para abrir WhatsApp de forma directa y enviar tu consulta.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
                      <Button
                        onClick={() => window.open(whatsappUrl, '_blank')}
                        className="flex-1 h-14 bg-[#25D366] hover:bg-[#20ba56] text-white font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(37,211,102,0.3)] border-none"
                      >
                        <ExternalLink className="h-5 w-5" />
                        Abrir WhatsApp
                      </Button>
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        className="h-14 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl px-6 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Nuevo Mensaje
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Interactive Map Section */}
        <div className="container mx-auto px-6 mt-32">
          <div className="relative w-full h-[500px] rounded-[40px] overflow-hidden border border-white/5 animate-fade-up opacity-0" style={{ animationDelay: '0.8s' }}>
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(PUBLIC_SITE_CONFIG.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="100%"
              style={{
                border: 0,
                filter: 'grayscale(1) invert(0.9) contrast(1.2) opacity(0.8)'
              }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación RPM Accesorios"
            ></iframe>

            {/* Overlay for interaction hint */}
            <div className="absolute top-8 left-8 bg-zinc-900/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl max-w-xs pointer-events-none">
              <h4 className="text-white font-bold mb-2">Visitanos</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {PUBLIC_SITE_CONFIG.address} <br />
                San Miguel de Tucumán
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
