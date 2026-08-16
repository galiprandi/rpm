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

- **Standardized List Row Entity Pattern**: Para listados de entidades (Proveedores, Listas de Precios, Métodos de Pago, Categorías, Comprobantes de Compra, Productos en Auditoría) y tarjetas del Dashboard (Movimientos Recientes, Caja, Listos para Entrega), los elementos de lista deben usar un contenedor de `8x8` (`w-8 h-8`) con `rounded-lg`, `bg-primary/10`, `shadow-sm` y `border border-primary/20` para el icono/emoji, acompañado de un texto con `font-semibold tracking-tight`.
- **Dynamic Entity Colors**: En entidades con color propio (Categorías), el fondo del contenedor debe usar ese color y el icono una `drop-shadow-sm` blanca para garantizar legibilidad.
- **Product Row Pattern**: La celda de producto en la tabla utiliza el `Standardized List Row Entity Pattern` integrando la imagen del producto (o icono `Package`) y el SKU en fuente mono debajo del nombre.
- **Inventory Operative Pattern**: Los listados de operativos de inventario utilizan el `Standardized List Row Entity Pattern` con el icono `ClipboardCheck`, mostrando el folio (#ID) como título y el timestamp detallado como sub-texto.
- **Customer List Pattern**: La tabla de clientes utiliza el `Standardized List Row Entity Pattern` con el icono `User`. Los vehículos asociados se muestran como mini-pills con `font-mono` para una rápida identificación de patentes.
- **Category List Pattern**: La tabla de categorías utiliza el `Standardized List Row Entity Pattern` con el icono `Folder` y el color dinámico de la categoría.
- **Operational Log Pattern**: En listados de movimientos (Operaciones Diarias), las celdas de "Hora" y "Método" deben usar `font-mono` y un tamaño de fuente ligeramente reducido (`text-xs` o `text-sm`) para maximizar la densidad de información sin perder legibilidad.
- **Financial Report Pattern**: Los reportes de deudores deben resaltar el saldo pendiente usando `font-mono font-bold text-red-600` y mostrar patentes de vehículos como mini-pills de alta densidad.
- **Price List Detail Pattern**: La tabla de excepciones en el detalle de listas de precios utiliza el `Standardized List Row Entity Pattern` (icono `Package`) y aplica `font-mono` a todos los valores técnicos y financieros (SKU, Costos, Márgenes, Precios Finales).
- **Detail Financial Summary Pattern**: Las vistas de detalle (OTs, Ventas Directas) deben mostrar un resumen financiero en el `Header` usando metadata pills: `Total` (muted), `Pagado` (emerald) y `Pendiente` (amber), todos con `font-mono` y formateo de moneda estricto.
- **Checklist Visual Pattern**: Los ítems de checklist deben usar un contenedor de `w-5 h-5` para el estado de verificación, con colores semánticos (`blue-600` para ingreso, `emerald-600` para salida/calidad) y transiciones de escala para el icono `Check`.

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

## 17. Typography Consistency

- **Technical Data**: Siempre usar `font-mono` para IDs, SKUs, CUIs, Teléfonos, Fechas (en contextos técnicos), emails y montos monetarios. Esto mejora la legibilidad de datos tabulares y alineación numérica.

## 18. Vehicles & Equipment Refinement

- **Detail Headers**: Utilizar `Header` con `titleClassName="font-mono"` para patentes/IDs. Integrar metadatos técnicos (Categoría, Año, Color) y contactos de clientes en el slot `children` usando mini-pills con `bg-muted/50` o colores semánticos (azul para teléfonos).
- **History Visualization**: El historial de OTs debe seguir el *Standardized List Row Entity Pattern* con el icono `ClipboardList` en contenedor 8x8 y `font-mono` para IDs y montos.
- **Form Patterns**: `VehicleDialog` debe implementar el *Form UX Enhancement Pattern* con iconos absolutos y `font-mono` en todos los campos de identificación y contacto.

## 19. Filter Popover Pattern

Los filtros de listados (invoices, work-orders) deben destilarse en un `Popover` con `PopoverTrigger` como botón secundario, agrupando todos los filtros en una sola superficie en lugar de dispersarlos inline.

- **Trigger**: Botón `outline` con icono `Filter` + count badge (`bg-primary text-primary-foreground`) mostrando filtros activos.
- **Content**: `PopoverContent` con `w-72`, secciones agrupadas por categoría (Estado, Pago, Fechas) usando `<Label>` + `Select` de shadcn/ui o `Switch` con `id` + `<Label htmlFor>`.
- **Accesibilidad**: Cada `Switch` debe tener `id` único y su `<Label htmlFor>` correspondiente. No usar `<span>` adyacente como label.
- **Acciones**: Footer con "Limpiar" (ghost) y "Aplicar" (primary) dentro del popover.
- **Regla**: Máximo 3 filtros inline visibles fuera del popover. El resto va dentro.

## 20. AlertDialog Confirmation Pattern

Las acciones destructivas (cancelar comprobante, cancelar OT, cerrar caja) deben usar `AlertDialog` de shadcn/ui con contexto summary, no `confirm()` nativo.

- **Estructura**: `AlertDialog` con `AlertDialogTitle`, `AlertDialogDescription` específica (no genérica), y footer con "No, cancelar" (ghost) + acción destructiva (destructive variant).
- **Summary Context**: La descripción debe incluir el recurso afectado (número de comprobante, patente + cliente, monto).
- **Warning Condicional**: Si la acción tiene implicaciones financieras (ej: OT con pagos asociados), mostrar un bloque amber (`bg-amber-50 border border-amber-200 text-amber-800`) con `AlertTriangle` entre la descripción y los botones.
- **Regla**: Nunca usar `window.confirm()`. Siempre `AlertDialog`.

## 21. Undo Toast Pattern (Post-Confirmation)

Toda acción destructiva confirmada debe mostrar un toast de `sonner` con botón "Deshacer" que revierte la acción dentro de una ventana de 8 segundos.

```tsx
toast.success("Comprobante cancelado correctamente", {
  description: "El comprobante fue cancelado correctamente.",
  action: {
    label: "Deshacer",
    onClick: () => handleUndoCancel(previousStatus),
  },
  duration: 8000,
});
```

- **Captura previa**: Antes de mutar, capturar `previousStatus` para poder revertir.
- **Undo API**: Reutilizar el mismo endpoint de mutación con el estado anterior (ej: `PATCH /api/invoices/:id` con `{ status: previousStatus }`).
- **Batch Undo**: Para cancelación múltiple, trackear `cancelledInvoices: Array<{ id, previousStatus }>` y revertir cada uno.
- **Regla**: El toast es un safety net ADICIONAL al AlertDialog, no lo reemplaza.

## 22. Cash Close Ceremony Pattern

El cierre de caja debe ser una ceremonia con comparación visual de montos, no un simple confirm.

- **Esperado vs Contado vs Diferencia**: Mostrar los tres valores lado a lado, con la diferencia en color semántico (`emerald-600` si cuadra, `red-600` si hay faltante, `amber-600` si hay sobrante).
- **Motivo obligatorio**: Si hay diferencia, un campo de razón es obligatorio antes de confirmar.
- **Ceremony Modal**: Tras el cierre exitoso, mostrar un modal celebratorio con: total de ventas, transacciones, top producto, hora pico, y diferencia final.
- **Reopen discoverable**: El modal de ceremonia debe incluir un botón "Reabrir Caja" (amber/outline, `RotateCcw` icon) visible mientras el modal está abierto, además del toast con action "Reabrir" (10s window).
- **Regla**: El reopen debe ser discoverable en el momento exacto del cierre, no oculto en una tab de historial.

## 23. Role-Aware Dashboard Pattern

El dashboard `/adm` debe renderizar cards diferentes según el rol del usuario (`ADMIN`, `STAFF`, `USER`).

- **ADMIN**: 4 KPIs compactos (Sales, Cash, Debtors, Stock) + Taller col-span-2 + ReadyForDelivery + TopProducts + PaymentMethods + CashMovements.
- **STAFF**: Sales + Stock + ReadyForDelivery + PaymentMethods + CashMovements (sin Debtors ni Taller detallado).
- **USER**: WorkshopKanban col-span-2 + ReadyForDelivery + WorkOrders full width (sin KPIs financieros).
- **AskNitroCard**: Común a todos los roles, al tope del dashboard, con queries role-tailored.
- **Regla**: Nunca mostrar información financiera (deudores, ventas totales) a roles no autorizados.

## 24. AskNitroCard & nitro:ask Event Pattern

El copiloto NITRO debe celebrarse en el dashboard, no enterrarse.

- **AskNitroCard**: Card con gradient sutil (`bg-[linear-gradient(135deg,hsl(var(--primary)/0.10)...)]`), icono `Sparkles` en contenedor `bg-primary/15`, badge "Copiloto", y queries como pills clickeables.
- **Event Contract**: El card emite `window.dispatchEvent(new CustomEvent("nitro:ask", { detail: { query } }))`. El `ChatFloating` component escucha este evento, abre el chat, y envía la query.
- **Desacoplamiento**: El dashboard no conoce la implementación del chat — solo emite el intent. El chat consumer reacciona.
- **Queries**: Role-tailored, máximo 4-5, ordenadas de más útil a menos útil.

## 25. Semantic Icon Containers (No border-l-2)

Las cards del dashboard deben usar contenedores de icono semánticos en lugar de barras `border-l-2` para comunicar categoría.

- **Pattern**: `<span className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-{color}-500/10 border-{color}-500/20">` + icono `h-3.5 w-3.5` con `text-{color}-700` y `aria-hidden="true"`.
- **Colores por dominio**: Sales=emerald, Cash=cyan, Debtors=red, Stock=orange/emerald, Taller=amber, ReadyForDelivery=violet, PaymentMethods=indigo, TopProducts=blue.
- **Regla**: Nunca usar `border-l-2` o `border-l-4` para indicar categoría. Usar el contenedor semántico.

## 26. Accessibility: Text Size Floor

Todo texto funcional debe tener un mínimo de 11px. El browser detector flaggea `text-[9px]` y `text-[10px]` como `undersized-ui-text`.

- **Floor**: `text-[11px]` es el mínimo absoluto para texto funcional (labels, badges, metadata, links).
- **Prohibido**: `text-[9px]`, `text-[10px]` en cualquier elemento con texto funcional.
- **Permitido**: `text-xs` (12px) o superior para body text. `text-[11px]` para labels compactos.
- **Excepción**: Elementos puramente decorativos (dots, dividers sin texto) no están sujetos al floor.
- **Regla**: Si necesitás texto más chico que 11px para que entre, el layout está mal — rediseñar el contenedor.

## 27. Truncate + min-w-0 Pattern

Para que `truncate` funcione en flex/grid children, el contenedor padre debe tener `min-w-0`.

- **Problema**: Flex/grid items tienen `min-width: auto` por defecto, que se resuelve al min-content width del texto. Un `<p>` con `truncate` tiene min-content muy ancho, expandiendo el contenedor y rompiendo el truncate.
- **Fix**: Agregar `min-w-0` al contenedor padre (Card, CardContent, o el flex item más cercano).
- **Cadena**: Si el truncate está anidado profundo (Card → CardContent → Tooltip → p), agregar `min-w-0` en cada nivel de la cadena hasta que funcione.
- **Regla**: Todo `<p className="truncate">` dentro de un grid/flex necesita `min-w-0` en su ancestro más cercano.

## 28. AFIP Status Banner Pattern

Los comprobantes con estados AFIP intermedios o de error deben mostrar banners contextuales en el detalle (`/adm/invoices/[id]`):

- **PENDING** (azul): `bg-blue-50 border-blue-200 text-blue-800` + icono `Clock` + botón "Reconciliar con AFIP" (`RotateCcw`). Indica que el envío a AFIP está en curso o fue interrumpido.
- **REJECTED** (rojo): `bg-red-50 border-red-200 text-red-800` + icono `XCircle` + detalle del error y observaciones de AFIP.
- **Pre-invoice** (naranja): `bg-orange-50 border-orange-200 text-orange-800` + texto "No válido como comprobante fiscal". Visible también en print (`print:bg-white print:border-black`).

**Reglas:**
- Los banners PENDING y REJECTED son `print:hidden` (no aparecen en el PDF impreso).
- El banner de pre-invoice SÍ aparece en print con estilos adaptados.
- El botón "Reconciliar" solo aparece si el estado es `PENDING`.
- En el listado (`/adm/invoices`), el badge `PENDING` usa `text-blue-600 border-blue-200 bg-blue-50` con texto "Enviando...".

## 29. Certificate Upload UI Pattern

La subida de certificados en `/adm/settings` muestra 5 estados granulares de salud (`CertHealthState`):

- **ready** (emerald): Contenedor `bg-emerald-100 border-emerald-200` + icono `CheckCircle2` + "Certificado configurado" + fecha subida + vencimiento. Botones "Reemplazar" / "Eliminar".
- **ready, vence pronto** (amber): Si faltan ≤30 días para vencer, cambia a `bg-amber-100 border-amber-200` + icono `AlertTriangle` + "Certificado vence en N días".
- **expired** (red): Contenedor `bg-red-100 border-red-200` + icono `XCircle` + "Certificado vencido" + detalle. Botón "Renovar certificado".
- **invalid** (red): Contenedor `bg-red-100 border-red-200` + icono `XCircle` + "Certificado inválido o corrupto" + detalle. Botones "Reemplazar" / "Eliminar".
- **no-master-key** (amber): Contenedor amber + icono `AlertCircle` + "Modo simulación (sin master key)" + mención de `AFIP_CERT_MASTER_KEY` en `font-mono`. Botón upload deshabilitado.
- **missing** (amber): Contenedor amber + icono `AlertCircle` + "Sin certificado" + "Modo simulación (mock)". Botón "Subir certificado".
- **Form de subida**: Panel colapsable con `border bg-muted/30`, input file (`.p12`/`.pfx`), input password, botones "Cancelar" y "Confirmar".
- **Seguridad**: Nunca mostrar el contenido del certificado ni el password en la UI. Solo exponer `state`, `uploadedAt`, `expiresAt`, y `detail`.
- **Loading states**: `Loader2` con `animate-spin` durante subida, `loading` prop en botones durante eliminación.
- **Countdown**: Usar `differenceInDays` de `date-fns` para calcular días restantes. Warning si ≤30 días.
