# Design Standards & Patterns

## 1. Action Hierarchy

- **Primary CTA** (`primaryAction`): El botón principal de creación/acción va en el `Header` de la página.
- **Secondary CTAs** (`secondaryActions`): Botones secundarios (filtrar, exportar, navegar a vistas relacionadas) van en `Header.secondaryActions`.
- **De-duplication**: Si el `Header` ya tiene el botón de creación, configurar `CrudAdmin` con `hideCreateAction={true}`.
- **Row Actions**: Acciones de fila (editar, eliminar, ver) deben tener `Tooltip` y `aria-label`.

## 2. Color Semantics

| Contexto | Clase Tailwind | Uso |
|----------|---------------|-----|
| Positivo / Saldo a favor / Pagado | `text-emerald-600` | Saldos favorables, pagos completos, estados "listo" |
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
  <CrudAdmin columns={columns} data={items} hideCreateAction />
</div>
```

## 4. Stats Placement

- **Vistas de listado**: `CrudStats` debajo del `Header`, antes de la tabla.
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

Reemplazar siempre los `<select>` nativos por el componente `Select` de shadcn/ui para consistencia visual.

## 8. Links entre Vistas Relacionadas

Desde vistas de detalle, usar `secondaryActions` con `href` para navegar a módulos relacionados:

```tsx
secondaryActions={[
  { label: "Notas de Crédito", href: "/adm/credit-notes", icon: FileText, variant: "outline" },
  { label: "Comprobantes", href: "/adm/purchase-vouchers", icon: FileText, variant: "outline" },
]}
```
