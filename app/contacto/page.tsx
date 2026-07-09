import { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contacto | RPM Accesorios',
  description: '¿Tenés un proyecto para tu vehículo? Ponete en contacto con nuestro equipo técnico en San Miguel de Tucumán.',
};

export default function ContactPage() {
  return <ContactClient />;
}
