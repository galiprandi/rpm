'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PUBLIC_SITE_CONFIG, DEFAULT_WHATSAPP_MESSAGE } from '@/lib/config/public-site';
import { GlobalSearch } from '../GlobalSearch';

const navItems = [
  { name: 'Productos', href: '/productos' },
  { name: 'Servicios', href: '/servicios' },
  { name: 'Nosotros', href: '/nosotros' },
  { name: 'Contacto', href: '/contacto' },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-[13px] font-medium transition-all duration-300 uppercase tracking-widest relative group/link",
                    isActive ? "text-white" : "text-gray-400 hover:text-white"
                  )}
                >
                  {item.name}
                  <span className={cn(
                    "absolute -bottom-2 left-0 h-px bg-brand transition-all duration-300",
                    isActive ? "w-full" : "w-0 group-hover/link:w-full"
                  )} />
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-gray-400 hover:text-brand transition-colors duration-300"
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 border-white/10 text-white text-xs font-bold uppercase tracking-widest">
                Buscar
              </TooltipContent>
            </Tooltip>
            <Link href="/login" className="text-[13px] font-medium text-gray-400 hover:text-white transition-all duration-300 uppercase tracking-widest">
              Ingresar
            </Link>
            <Button asChild variant="ghost" className="text-[13px] font-bold text-white hover:text-brand transition-colors uppercase tracking-widest">
              <a href={PUBLIC_SITE_CONFIG.links.whatsapp(DEFAULT_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </Button>
            <Link href="/contacto">
              <Button className="bg-white text-black hover:bg-white/90 text-xs font-black rounded-full px-6 py-2 uppercase tracking-tighter transition-transform active:scale-95">
                Reservar
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-white hover:text-brand transition-colors"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>
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
        <button
          onClick={() => { setIsOpen(false); setIsSearchOpen(true); }}
          className="flex items-center space-x-3 text-white/60 hover:text-brand transition-colors mb-4"
        >
          <Search className="h-6 w-6" />
          <span className="text-xl font-bold uppercase tracking-widest">Buscar</span>
        </button>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-4xl font-bold transition-colors",
                isActive ? "text-brand" : "text-white hover:text-brand"
              )}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          );
        })}
        <Link
          href="/login"
          className="text-2xl font-bold text-gray-400 hover:text-white transition-colors"
          onClick={() => setIsOpen(false)}
        >
          Ingresar
        </Link>
        <a href={PUBLIC_SITE_CONFIG.links.whatsapp(DEFAULT_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)}>
          <Button className="bg-brand text-white text-lg font-bold rounded-full px-12 py-6">
            Contactar ahora
          </Button>
        </a>
      </div>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
