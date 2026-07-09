const WHATSAPP_NUMBER = '543813199647';

export const PUBLIC_SITE_CONFIG = {
  name: 'RPM Accesorios',
  tagline: 'Precision & Performance',
  description: 'Especialistas en equipamiento y accesorios para vehículos. Más de 15 años brindando soluciones de alta calidad en San Miguel de Tucumán.',
  address: 'San Lorenzo 1462, San Miguel de Tucumán',
  phone: '+54 381 319-9647',
  email: 'contacto@rpmaccesorios.com.ar',
  whatsappNumber: WHATSAPP_NUMBER,
  instagramHandle: 'rpm.accesorios',
  instagramUrl: 'https://instagram.com/rpm.accesorios',
  hours: {
    weekdays: '09:00 - 19:00',
    saturdays: '09:00 - 13:00',
  },
  links: {
    whatsapp: (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
  }
};

export const DEFAULT_WHATSAPP_MESSAGE = 'Hola RPM Accesorios! Me gustaría agendar un turno para mi vehículo.';
