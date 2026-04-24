import Link from 'next/link';
import { MapPin, Phone, Mail, Camera, Share2 } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-zinc-950 text-gray-400 py-16 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-white">
              RPM<span className="text-[#FF4B00]">ACCESORIOS</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Especialistas en equipamiento y accesorios para vehículos. 
              Más de 15 años brindando soluciones de alta calidad en San Miguel de Tucumán.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors"><Camera className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Share2 className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Navegación</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/productos" className="hover:text-white transition-colors">Catálogo de Productos</Link></li>
              <li><Link href="/servicios" className="hover:text-white transition-colors">Nuestros Servicios</Link></li>
              <li><Link href="/taller" className="hover:text-white transition-colors">Gestión de Taller</Link></li>
              <li><Link href="/nosotros" className="hover:text-white transition-colors">Sobre Nosotros</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Contacto</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-[#FF4B00] shrink-0" />
                <span>San Lorenzo 1462, San Miguel de Tucumán</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-[#FF4B00] shrink-0" />
                <span>+54 381 319-9647</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-[#FF4B00] shrink-0" />
                <span>contacto@rpmaccesorios.com.ar</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Horarios</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Lunes a Viernes</span>
                <span className="text-white">09:00 - 19:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sábados</span>
                <span className="text-white">09:00 - 13:00</span>
              </li>
              <li className="pt-4 text-xs italic text-gray-500">
                Atención personalizada con turno previo.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-xs">
            © {new Date().getFullYear()} RPM Accesorios. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 text-xs uppercase tracking-widest">
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
