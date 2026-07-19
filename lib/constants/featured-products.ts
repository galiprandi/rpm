export interface FeaturedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  imageUrl?: string | null;
  description: string;
  features: string[];
}

export const featuredProducts: FeaturedProduct[] = [
  {
    id: '1',
    name: 'Barra LED Ultra-Beam 42"',
    category: 'Iluminación',
    price: 125000,
    image: 'B',
    description: 'Iluminación de alta performance diseñada para condiciones extremas. Su patrón de luz combinado ofrece profundidad y amplitud sin precedentes.',
    features: ['Potencia: 240W', 'Resistencia al agua IP68', 'Chasis de aluminio extruido', 'Lentes de policarbonato irrompibles']
  },
  {
    id: '2',
    name: 'Protección PPF Pro-Shield',
    category: 'Estética',
    price: 85000,
    image: 'P',
    description: 'Película de poliuretano termoplástico de alta resistencia que protege la pintura contra impactos de piedras y rayones.',
    features: ['Auto-curación con calor', 'Acabado ultra-brillante', 'Protección UV superior', 'Garantía de 10 años']
  },
  {
    id: '3',
    name: 'Kit Suspensión Off-Road',
    category: 'Equipamiento',
    price: 450000,
    image: 'S',
    description: 'Sistema de suspensión reforzado para mejorar el despeje y la capacidad de carga en terrenos difíciles.',
    features: ['Amortiguadores de nitrógeno', 'Espirales progresivos', 'Bujes de poliuretano', 'Ajuste de altura regulable']
  },
  {
    id: '4',
    name: 'Lámina Seguridad 3M CS20',
    category: 'Seguridad',
    price: 45000,
    image: 'L',
    description: 'Película de seguridad de alto espesor que mantiene los cristales unidos en caso de rotura por impacto.',
    features: ['Protección anti-vandalismo', 'Rechazo de calor 45%', 'Filtro UV 99%', 'Color estable en el tiempo']
  },
  {
    id: '5',
    name: 'Ópticas Full LED Black',
    category: 'Iluminación',
    price: 195000,
    image: 'O',
    description: 'Reemplazo directo de ópticas originales con tecnología Bi-LED y luces de giro secuenciales integradas.',
    features: ['Plug & Play', 'Look Dark Premium', 'Mayor alcance lumínico', 'Regulación de altura']
  },
  {
    id: '6',
    name: 'Tratamiento Cerámico 9H',
    category: 'Estética',
    price: 65000,
    image: 'T',
    description: 'Recubrimiento nanotecnológico de máxima dureza que protege contra contaminantes ambientales y otorga un brillo extremo.',
    features: ['Dureza certificada 9H', 'Efecto hidrofóbico radical', 'Fácil limpieza', 'Resistencia química']
  },
  {
    id: '7',
    name: 'Malacate Winch 12000lb',
    category: 'Equipamiento',
    price: 320000,
    image: 'M',
    description: 'Herramienta indispensable de rescate con motor sellado de alta potencia y cable sintético de última generación.',
    features: ['Fuerza: 12000 lb', 'Cuerda sintética Dyneema', 'Control inalámbrico', 'Freno automático']
  },
  {
    id: '8',
    name: 'Alfombras Thermo-Fit',
    category: 'Interior',
    price: 55000,
    image: 'A',
    description: 'Protección total del piso diseñada por computadora para un calce perfecto. Material ecológico e inodoro.',
    features: ['Calce láser específico', 'Borde elevado contenedor', 'Superficie antideslizante', 'Lavables en segundos']
  },
];
