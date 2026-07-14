"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface HeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "secondary"
    | "destructive"
    | "link";
  icon?: LucideIcon;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  ariaLabel?: string;
  iconOnly?: boolean;
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
  /**
   * Elementos React personalizados para mostrar junto al botón volver
   * Se renderizan después del botón volver y antes de las secondaryActions
   */
  leftActions?: ReactNode;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
  /** Clases CSS adicionales para el título */
  titleClassName?: string;
  /** Título reducido para mobile (se muestra en pantallas < md) */
  shortTitle?: string;
  /** Mostrar CTAs solo con iconos en mobile (pantallas < md) */
  iconOnlyOnMobile?: boolean;
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
 *   title={customer.name}
 *   description={`Cliente desde ${date}`}
 *   showBackButton
 *   secondaryActions={[
 *     { label: 'Eliminar', onClick: handleDelete, variant: 'outline', icon: Trash2 }
 *   ]}
 *   primaryAction={{
 *     label: 'Crear Vehículo',
 *     onClick: () => setIsVehicleModalOpen(true),
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
  leftActions,
  className = "",
  titleClassName = "",
  shortTitle,
  iconOnlyOnMobile = false,
}: HeaderProps) {
  return (
    <header className={`space-y-1 ${className}`}>
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <h1
            className={`text-3xl font-bold text-foreground ${titleClassName}`}
          >
            {shortTitle ? (
              <>
                <span className="md:hidden">{shortTitle}</span>
                <span className="hidden md:inline">{title}</span>
              </>
            ) : (
              title
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Botón Volver */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              aria-label="Volver a la página anterior"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}

          {/* Acciones izquierdas personalizadas (ej: Select de estado) */}
          {leftActions}

          {/* Acciones Secundarias */}
          {secondaryActions.map((action, index) => {
            const Icon = action.icon;
            const button = (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                className={`${action.className || ""} h-8`}
                disabled={action.disabled}
                title={action.title}
                aria-label={action.ariaLabel}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      !action.iconOnly && "mr-2",
                      iconOnlyOnMobile && !action.iconOnly && "md:mr-2",
                      iconOnlyOnMobile && !action.iconOnly && "mr-0",
                    )}
                  />
                )}
                {!action.iconOnly && !iconOnlyOnMobile && action.label}
                {!action.iconOnly && iconOnlyOnMobile && (
                  <span className="hidden md:inline">{action.label}</span>
                )}
              </Button>
            );

            if (action.href && !action.disabled) {
              return (
                <a key={index} href={action.href}>
                  {button}
                </a>
              );
            }
            return button;
          })}

          {/* Acción Principal (CTA) */}
          {primaryAction &&
            (() => {
              const button = (
                <Button
                  variant={primaryAction.variant || "default"}
                  size="sm"
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                  loading={primaryAction.loading}
                  title={primaryAction.title}
                  aria-label={primaryAction.ariaLabel}
                  className={
                    primaryAction.className ||
                    (primaryAction.variant &&
                    primaryAction.variant !== "default"
                      ? `font-semibold px-4 py-2 h-8 ${primaryAction.disabled ? "opacity-50 cursor-not-allowed" : ""}`
                      : `bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2 h-8 ${primaryAction.disabled ? "opacity-50 cursor-not-allowed shadow-none hover:shadow-none" : ""}`)
                  }
                >
                  {primaryAction.icon && (
                    <primaryAction.icon
                      className={cn(
                        "h-5 w-5",
                        iconOnlyOnMobile ? "md:mr-2" : "mr-2",
                      )}
                    />
                  )}
                  {iconOnlyOnMobile ? (
                    <span className="hidden md:inline">
                      {primaryAction.label}
                    </span>
                  ) : (
                    primaryAction.label
                  )}
                </Button>
              );

              if (primaryAction.href && !primaryAction.disabled) {
                return (
                  <Link href={primaryAction.href} key="primary-action-link">
                    {button}
                  </Link>
                );
              }
              return button;
            })()}
        </div>
      </div>

      {description && <p className="text-muted-foreground">{description}</p>}
      {children}
    </header>
  );
}
