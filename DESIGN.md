# Design Standards & Patterns

## 1. Action Hierarchy

- **Primary CTA** (`primaryAction`): El botón principal de creación/acción va en el `Header` de la página.
- **Secondary CTAs** (`secondaryActions`): Botones secundarios (filtrar, exportar, navegar a vistas relacionadas) van en `Header.secondaryActions`.
- **De-duplication**: Si el `Header` ya tiene el botón de creación, configurar `CrudAdmin` con `hideCreateAction={true}`.
- **Row Actions**: Acciones de fila (editar, eliminar, ver) deben tener `Tooltip` y `aria-label`. Usar preferentemente el icono `Pencil` para editar en lugar de `Edit2` para mantener consistencia.

## 2. Color Semantics

| Contexto | Clase Tailwind | Uso |
|----------|---------------|-----|
| Positivo / Saldo a favor / Pagado / Activo / Activa | `text-emerald-600` | Saldos favorables, pagos completos, estados "listo" o "activo" |
| Deuda / Negativo / Egreso | `text-red-600` | Deudas pendientes, gastos, saldos negativos |
| Advertencia / Parcial | `text-amber-600` | Pagos parciales, márgenes bajos, estados de espera |
| Destructivo | `text-destructive` | Botones de eliminar/desactivar (usa `destructive` token, no `red-600` hardcodeado) |

> **Regla**: Nunca usar `text-green-600` ni `bg-green-500`. Usar siempre `emerald` para estados positivos.

## 3. Header + CrudAdmin Pattern

Toda vista de listado CRUD debe seguir esta estructura:

```tsx
<div className="space-y-6">
  <Header
    title="Entidades"
    description="Gestiona el catálogo"
    primaryAction={{ label: "Nueva Entidad", onClick: handleCreate, icon: Plus }}
    secondaryActions={[
      { label: "Exportar", onClick: handleExport, icon: Download },
    ]}
  />
  <CrudStats stats={[...]} />
  <CrudAdmin columns={columns} items={items} hideCreateAction />
</div>
```

## 4. Stats Placement

- **Vistas de listado**: `CrudStats` debajo del `Header`, antes de la tabla. No pasar `stats` como prop a `CrudAdmin` para evitar acoplamiento; usar el componente `CrudStats` directamente entre el Header y la Tabla.
- **Vistas de detalle**: Stats clave (saldo, totales) integrados en el `Header` como `children` o pills.

## 5. Badges Semánticos

Usar `Badge` de shadcn/ui con clases explícitas para estados:

```tsx
// Activo / Positivo
<Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
  Activo
</Badge>

// Inactivo / Neutral
<Badge variant="secondary">Inactivo</Badge>

// Cancelado / Negativo
<Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
  Cancelado
</Badge>
```

## 6. Tooltips

Toda acción de fila con icono único debe estar envuelta en `Tooltip`:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="sm" aria-label="Editar">
      <Pencil className="h-4 w-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Editar entidad</TooltipContent>
</Tooltip>
```

## 7. Select vs Native

Reemplazar siempre los `<select>` nativos por el componente `Select` de shadcn/ui para consistencia visual en diálogos y vistas de detalle.

## 8. Metadata Pills & Detail Headers

En vistas de detalle, usar un patrón de "Metadata Pills" para información secundaria en el `Header`:

```tsx
<div className="flex flex-wrap items-center gap-2 mt-4">
  <Badge variant="outline" className="...">Estado</Badge>
  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-medium text-muted-foreground">
    <Icon className="h-3.5 w-3.5" />
    Valor
  </div>
</div>
```

## 9. Loading Skeletons

Toda vista administrativa debe implementar un `loading.tsx` con `Skeleton` que imite la estructura real de la página (Header, Stats, Tabla/Grilla) para mejorar la percepción de velocidad y evitar saltos de layout.

## 10. Links entre Vistas Relacionadas

Desde vistas de detalle, usar `secondaryActions` con `href` para navegar a módulos relacionados:

```tsx
secondaryActions={[
  { label: "Notas de Crédito", href: "/adm/credit-notes", icon: FileText, variant: "outline" },
  { label: "Comprobantes", href: "/adm/purchase-vouchers", icon: FileText, variant: "outline" },
]}
```

## 11. Admin Sidebar Pattern

- El aside de `/adm` debe funcionar como navegación protagonista: marca visible, búsqueda global destacada, grupos con icono, estados activos claros y footer de sesión.
- Mantener el componente separado en `components/adm/layout/AppSidebar.tsx`; no duplicar navegación inline en páginas.
- Los ítems activos, marca y footer usan tokens `primary/sidebar-ring` y sombra/indicador lateral para respetar la paleta del sistema.
- El comportamiento colapsado y mobile debe conservar tooltips, cierre automático al navegar, permisos por rol, pines y Command Palette (`⌘K`).
- Los cambios visuales del sidebar requieren validación con type-check y captura Playwright en desktop, colapsado y mobile.

## 12. Settings & Configuration Patterns

- **SettingItem**: Usar para controles individuales dentro de una tarjeta. Soporta `icon` (LucideIcon), `title`, `description` y `children` para el control.
- **Card Organization**: Agrupar configuraciones relacionadas en `Card` con `overflow-hidden` y un `CardHeader` con fondo sutil (`bg-muted/20`) para separar visualmente las secciones.
- **Navigation Links**: Para enlaces a sub-configuraciones, envolver el `SettingItem` en un `Link` con clase `group` y `hover:bg-muted/30`. Usar un `ChevronRight` como indicador visual de navegación.
- **Layout**: En páginas de configuración, usar un ancho máximo controlado (ej: `max-w-3xl mx-auto`) para mejorar la legibilidad en pantallas grandes.

## 13. Entity Row Consistency

- **Standardized List Row Entity Pattern**: Para listados de entidades (Proveedores, Listas de Precios, Métodos de Pago, Categorías, Productos en Auditoría), la primera columna debe usar un contenedor de `8x8` (`w-8 h-8`) con `rounded-lg`, `bg-primary/10`, `shadow-sm` y `border border-primary/20` para el icono, acompañado de un texto con `font-semibold tracking-tight`.
- **Dynamic Entity Colors**: En entidades con color propio (Categorías), el fondo del contenedor debe usar ese color y el icono una `drop-shadow-sm` blanca para garantizar legibilidad.

## 14. Form UX Enhancement Pattern

Los formularios de alta calidad deben usar iconos contextuales de Lucide posicionados de forma absoluta dentro de contenedores relativos para cada input textual:
- **Iconos**: Usar `absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none` y `aria-hidden="true"`.
- **Padding**: Aplicar `pl-9` al input para evitar colisiones visuales con el icono.
- **Tipografía**: Campos técnicos (Teléfonos, CUIT, SKUs, Códigos) deben usar `font-mono`.

## 15. Empty State Protocol

Para estados vacíos en tablas y dashboards:
- **Iconografía**: El icono decorativo debe ser grande (ej: `h-12 w-12`) y usar la clase `text-muted-foreground/20` para mantener una jerarquía visual sutil.
- **Mensajería**: El mensaje debe ser claro y estar acompañado de un botón de acción primario si el usuario tiene permisos para crear la entidad.

## 16. Layout Shift Mitigation (Skeletons)

Los `loading.tsx` deben implementar esqueletos que imiten no solo la estructura general, sino también las proporciones de la tabla:
- **Header**: Usar `bg-muted/50` para el fondo del encabezado del esqueleto.
- **Columnas**: Definir anchos proporcionales (usando `flex-[valor]` o anchos fijos) que coincidan con la vista final para eliminar saltos de layout al cargar los datos.
