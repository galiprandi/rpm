'use client';

import Link from 'next/link';
import { Header } from '@/components/adm/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  TrendingDown,
  Package,
  Wrench,
  Wallet,
  ShoppingCart,
  Users,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  isAvailable?: boolean;
}

function ReportCard({ title, description, href, icon: Icon, isAvailable = true }: ReportCardProps) {
  const content = (
    <Card className={cn(
      "group transition-all duration-200",
      isAvailable
        ? "hover:border-primary/50 hover:shadow-md cursor-pointer"
        : "opacity-60 grayscale-[0.5]"
    )}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {isAvailable && (
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          )}
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!isAvailable && (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            Próximamente
          </span>
        )}
      </CardContent>
    </Card>
  );

  if (!isAvailable) return content;

  return (
    <Link href={href}>
      {content}
    </Link>
  );
}

export default function ReportsClient() {
  const reports = [
    {
      title: "Ventas",
      description: "Métricas de facturación, ticket promedio y evolución diaria de ingresos.",
      href: "/adm/reports/sales",
      icon: BarChart3,
      isAvailable: true
    },
    {
      title: "Deudores",
      description: "Listado de clientes con saldos pendientes y antigüedad de deuda.",
      href: "/adm/reports/debtors",
      icon: TrendingDown,
      isAvailable: true
    },
    {
      title: "Stock & Inventario",
      description: "Valorización de stock, rotación de productos y alertas de reposición.",
      href: "/adm/reports/stock",
      icon: Package,
      isAvailable: true
    },
    {
      title: "Taller & Operación",
      description: "Eficiencia de técnicos, tiempos de resolución y carga de trabajo.",
      href: "/adm/reports/workshop",
      icon: Wrench,
      isAvailable: true
    },
    {
      title: "Finanzas & Flujo",
      description: "Ingresos vs egresos, rentabilidad neta y análisis de medios de pago.",
      href: "/adm/reports/finance",
      icon: Wallet,
      isAvailable: true
    },
    {
      title: "Compras",
      description: "Análisis de abastecimiento, evolución de costos y compras por proveedor.",
      href: "/adm/reports/purchases",
      icon: ShoppingCart,
      isAvailable: true
    },
    {
      title: "Clientes",
      description: "Análisis de adquisición, recurrencia y ranking de clientes por facturación.",
      href: "/adm/reports/customers",
      icon: Users,
      isAvailable: true
    }
  ];

  return (
    <div className="space-y-6">
      <Header
        title="Centro de Reportes"
        description="Analiza el desempeño de tu negocio con métricas detalladas y visualizaciones."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report, idx) => (
          <ReportCard key={idx} {...report} />
        ))}
      </div>
    </div>
  );
}
