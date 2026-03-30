'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface HeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  icon?: LucideIcon;
  className?: string;
}

export interface HeaderProps {
  /** Título principal de la página (h1) */
  title: string;
  /** Subtítulo descriptivo (opcional) */
  description?: string;
  /** 
   * Contenido adicional debajo del título (stats, breadcrumbs, contactos, etc.)
   * Si no se provee, se usa el slot por defecto
   */
  children?: ReactNode;
  /** 
   * Acción principal (CTA) - aparece como botón destacado a la derecha
   * Ej: "Nuevo Producto", "Crear Vehículo"
   */
  primaryAction?: HeaderAction;
  /**
   * Acciones secundarias - aparecen antes del CTA principal
   * Ej: "Exportar", "Volver", "Eliminar"
   */
  secondaryActions?: HeaderAction[];
  /** 
   * Mostrar botón "Volver" automáticamente
   * Usa router.back() por defecto
   */
  showBackButton?: boolean;
  /** Callback personalizado para el botón volver */
  onBack?: () => void;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
}

/**
 * Header estándar para vistas del panel de administración.
 * 
 * @example
 * // Vista de listado simple
 * <Header 
 *   title="Productos" 
 *   description="Gestiona tu catálogo de productos"
 *   primaryAction={{
 *     label: 'Nuevo Producto',
 *     onClick: handleCreate,
 *     icon: Plus
 *   }}
 * />
 * 
 * @example
 * // Vista de detalle con acciones múltiples
 * <Header
 *   title={customer.fullName}
 *   description={`Cliente desde ${date}`}
 *   showBackButton
 *   secondaryActions={[
 *     { label: 'Eliminar', onClick: handleDelete, variant: 'outline', icon: Trash2 }
 *   ]}
 *   primaryAction={{
 *     label: 'Crear Vehículo',
 *     href: `/adm/vehicles/new?customerId=${id}`,
 *     icon: Plus
 *   }}
 * >
 *   <div className="flex gap-4 mt-2">
 *     <a href={`tel:${phone}`}><Phone className="h-4 w-4" /> {phone}</a>
 *   </div>
 * </Header>
 */
export function Header({
  title,
  description,
  children,
  primaryAction,
  secondaryActions = [],
  showBackButton = false,
  onBack,
  className = '',
}: HeaderProps) {
  return (
    <div className={`flex justify-between items-start ${className}`}>
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
        {children}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Botón Volver */}
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        )}

        {/* Acciones Secundarias */}
        {secondaryActions.map((action, index) => {
          const Icon = action.icon;
          const button = (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              className={action.className}
            >
              {Icon && <Icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          );

          if (action.href) {
            return (
              <a key={index} href={action.href}>
                {button}
              </a>
            );
          }
          return button;
        })}

        {/* Acción Principal (CTA) */}
        {primaryAction && (
          <Button
            variant={primaryAction.variant || 'default'}
            size="sm"
            onClick={primaryAction.onClick}
            className={
              primaryAction.className ||
              'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2 h-10'
            }
          >
            {primaryAction.icon && (
              <primaryAction.icon className="h-5 w-5 mr-2" />
            )}
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
