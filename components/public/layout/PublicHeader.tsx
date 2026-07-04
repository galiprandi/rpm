'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const WHATSAPP_URL = "https://wa.me/543813199647?text=Hola%20RPM%20Accesorios!%20Me%20gustaría%20agendar%20un%20turno%20para%20mi%20vehículo.";

const navItems = [
  { name: 'Productos', href: '/productos' },
  { name: 'Servicios', href: '/servicios' },
  { name: 'Nosotros', href: '/nosotros' },
  { name: 'Contacto', href: '/contacto' },
];

export function PublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4",
        scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent"
      )}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-xl font-bold tracking-[-0.05em] text-white">
              RPM<span className="text-brand group-hover:text-white transition-colors duration-500">ACCESORIOS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-12">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[13px] font-medium text-gray-400 hover:text-white transition-all duration-300 uppercase tracking-widest"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/login" className="text-[13px] font-medium text-gray-400 hover:text-white transition-all duration-300 uppercase tracking-widest">
              Ingresar
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="text-[13px] font-bold text-white hover:text-brand transition-colors uppercase tracking-widest">
                WhatsApp
              </Button>
            </a>
            <Link href="/contacto">
              <Button className="bg-white text-black hover:bg-white/90 text-xs font-black rounded-full px-6 py-2 uppercase tracking-tighter transition-transform active:scale-95">
                Reservar
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" className="text-white" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 top-0 bg-black z-[-1] md:hidden transition-all duration-700 ease-in-out flex flex-col items-center justify-center space-y-8",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        )}
      >
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="text-4xl font-bold text-white hover:text-brand transition-colors"
            onClick={() => setIsOpen(false)}
          >
            {item.name}
          </Link>
        ))}
        <Link
          href="/login"
          className="text-2xl font-bold text-gray-400 hover:text-white transition-colors"
          onClick={() => setIsOpen(false)}
        >
          Ingresar
        </Link>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)}>
          <Button className="bg-brand text-white text-lg font-bold rounded-full px-12 py-6">
            Contactar ahora
          </Button>
        </a>
      </div>
    </header>
  );
}
