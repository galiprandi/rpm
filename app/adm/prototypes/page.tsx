import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  LayoutGrid,
  Users,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const prototypes = [
  {
    id: 'v1',
    title: 'Operativo Clásico',
    description: 'Enfoque en el día a día: ventas, OTs activas y entregas pendientes. Ideal para el dueño que está en el taller.',
    icon: <LayoutDashboard className="h-6 w-6 text-blue-500" />,
    features: ['Métricas diarias', 'Lista de entregas', 'Estado de OTs'],
    tag: 'Eficiencia'
  },
  {
    id: 'v2',
    title: 'Análisis Financiero',
    description: 'Prioriza el flujo de caja, métodos de pago y rendimiento económico. Ideal para administración contable.',
    icon: <TrendingUp className="h-6 w-6 text-green-500" />,
    features: ['Gráficos de ingresos', 'Detalle de pagos', 'Flujo de caja'],
    tag: 'Finanzas'
  },
  {
    id: 'v3',
    title: 'Gestión de Inventario',
    description: 'Control total de stock, movimientos recientes y alertas de reposición. Ideal para encargados de repuestos.',
    icon: <Package className="h-6 w-6 text-orange-500" />,
    features: ['Alertas de stock bajo', 'Movimientos recientes', 'Valorización'],
    tag: 'Logística'
  },
  {
    id: 'v4',
    title: 'Bento Executive',
    description: 'Diseño moderno y modular tipo "Bento Box". Visualización limpia y jerarquizada de toda la operación.',
    icon: <LayoutGrid className="h-6 w-6 text-purple-500" />,
    features: ['Layout moderno', 'Jerarquía visual', 'Diseño responsive'],
    tag: 'Diseño'
  },
  {
    id: 'v5',
    title: 'Atención al Cliente',
    description: 'Foco en la experiencia del cliente: citas, satisfacción y seguimiento de entregas pendientes.',
    icon: <Users className="h-6 w-6 text-pink-500" />,
    features: ['Citas del día', 'Satisfacción (CSAT)', 'Llamadas pendientes'],
    tag: 'Clientes'
  }
];

export default function PrototypesGalleryPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Galería de Prototipos de Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Explora las 5 propuestas de diseño para el nuevo panel de administración de RPM.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prototypes.map((p) => (
          <Card key={p.id} className="flex flex-col hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-muted rounded-lg">
                  {p.icon}
                </div>
                <Badge variant="secondary">{p.tag}</Badge>
              </div>
              <CardTitle className="text-xl">{p.title}</CardTitle>
              <CardDescription className="min-h-[60px] line-clamp-3">
                {p.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center text-sm text-muted-foreground">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary/60" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full group">
                <Link href={`/adm/prototypes/${p.id}`}>
                  Ver Prototipo
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="bg-muted/50 p-6 rounded-xl border border-dashed border-muted-foreground/20 text-center">
        <p className="text-sm text-muted-foreground">
          Nota: Todos estos prototipos utilizan <strong>datos mockeados</strong> para garantizar una visualización consistente
          durante el proceso de revisión de UX.
        </p>
      </div>
    </div>
  );
}
