# Componentes Admin - Guía para Agentes

## 📍 Ubicación
`@/components/adm/`

## 🎯 Responsabilidad
Componentes específicos para el panel de administración (vistas `/adm/*`).

---

## Header Component

**Ubicación:** `components/adm/Header.tsx`

**Uso:** Todas las vistas del panel admin deben usar este componente para mantener consistencia visual.

### Ejemplo Básico - Vista de Listado

```tsx
import { Header } from '@/components/adm/Header';
import { Plus } from 'lucide-react';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <Header
        title="Productos"
        description="Gestiona tu catálogo de productos"
        primaryAction={{
          label: 'Nuevo Producto',
          onClick: handleCreate,
          icon: Plus
        }}
      />
      {/* resto del contenido */}
    </div>
  );
}
```

### Ejemplo - Vista de Detalle con Contactos

```tsx
<Header
  title={customer.fullName}
  description={`Cliente desde ${formatDate(customer.createdAt)}`}
  showBackButton
  secondaryActions={[
    {
      label: 'Eliminar',
      onClick: handleDelete,
      variant: 'outline',
      icon: Trash2
    }
  ]}
  primaryAction={{
    label: 'Crear Vehículo',
    href: `/adm/vehicles/new?customerId=${customer.id}`,
    icon: Plus
  }}
>
  {/* Slot children para contenido adicional (contactos, stats, etc.) */}
  <div className="flex flex-wrap gap-4 mt-2">
    <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-sm hover:underline text-primary">
      <Phone className="h-4 w-4" /> {customer.phone}
    </a>
    {customer.email && (
      <a href={`mailto:${customer.email}`} className="flex items-center gap-1 text-sm hover:underline text-primary">
        <Mail className="h-4 w-4" /> {customer.email}
      </a>
    )}
  </div>
</Header>
```

### Props del Header

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `title` | `string` | ✅ | Título principal (h1) |
| `description` | `string` | ❌ | Subtítulo descriptivo |
| `children` | `ReactNode` | ❌ | Contenido adicional debajo del título |
| `primaryAction` | `HeaderAction` | ❌ | CTA principal (botón destacado) |
| `secondaryActions` | `HeaderAction[]` | ❌ | Acciones secundarias (antes del CTA) |
| `showBackButton` | `boolean` | ❌ | Mostrar botón "Volver" |
| `onBack` | `() => void` | ❌ | Callback personalizado para volver |

### HeaderAction Interface

```typescript
interface HeaderAction {
  label: string;           // Texto del botón
  onClick?: () => void;    // Handler click
  href?: string;           // URL para navegación
  variant?: ButtonVariant; // 'default' | 'outline' | 'ghost' | etc.
  icon?: LucideIcon;       // Icono de lucide-react
  className?: string;      // Clases adicionales
}
```

---

## CrudAdmin Component

**Ubicación:** `components/adm/CrudAdmin.tsx`

**Uso:** Para vistas de listado CRUD completas (tabla + filtros + exportación).

**Cuándo usar:**
- ✅ Vista de listado con DataTable
- ✅ Necesitas exportación a CSV
- ✅ Necesitas búsqueda global
- ✅ Necesitas stats/resumen

**Cuándo NO usar:**
- ❌ Vista de detalle (usar Header directamente)
- ❌ Kanban u otras layouts especiales
- ❌ Páginas sin tabla de datos

---

## 📋 Patrones de Vista

### Vista de Listado (CRUD)

```
components/adm/
├── Header.tsx (o CrudAdmin para listados completos)
├── DataTable.tsx
└── index.ts
```

```tsx
export default function ListPage() {
  return (
    <div className="space-y-6">
      <Header
        title="Entidades"
        description="Descripción de la vista"
        primaryAction={{ label: 'Nueva Entidad', onClick: handleCreate, icon: Plus }}
      />
      
      {/* Opcional: Stats */}
      <CrudStats stats={[...]} />
      
      {/* Tabla */}
      <DataTable columns={columns} data={items} />
    </div>
  );
}
```

### Vista de Detalle

```tsx
export default function DetailPage() {
  return (
    <div className="space-y-6">
      <Header
        title={entity.name}
        description={`Creado el ${formatDate(entity.createdAt)}`}
        showBackButton
        primaryAction={{ label: 'Editar', onClick: handleEdit, icon: Edit }}
      >
        {/* Contactos accionables, tags, etc. */}
      </Header>
      
      {/* Cards con información */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>...</Card>
        <Card>...</Card>
      </div>
      
      {/* Tablas relacionadas */}
      <Card>
        <DataTable ... />
      </Card>
    </div>
  );
}
```

---

## 🎨 Convenciones de Estilo

### Botones CTA Principal
```tsx
// Siempre usar este estilo para el botón principal
className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2 h-10"
```

### Títulos
```tsx
<h1 className="text-3xl font-bold text-foreground">Título</h1>
<p className="text-muted-foreground mt-1">Descripción</p>
```

### Contactos Accionables
```tsx
<a href={`tel:${phone}`} className="flex items-center gap-1 text-sm hover:underline text-primary">
  <Phone className="h-4 w-4" /> {phone}
</a>
<a href={`mailto:${email}`} className="flex items-center gap-1 text-sm hover:underline text-primary">
  <Mail className="h-4 w-4" /> {email}
</a>
```

---

## 🚫 Anti-patrones

| ❌ No hacer | ✅ Hacer |
|-------------|----------|
| `<h1 className="text-2xl">` | `<h1 className="text-3xl font-bold">` |
| `variant="default"` sin className para CTA | Usar `className` con `bg-slate-900` para CTA |
| Botón "Volver" como acción secundaria | Usar `showBackButton` prop |
| Stats cards en vista de detalle | Stats solo en listados con CrudAdmin |
| Mostrar UUIDs en headers | Mostrar nombres legibles |
| `onClick={() => router.back()}` manual | Usar `showBackButton` del Header |

---

## 📁 Exportaciones

El archivo `components/adm/index.ts` debe exportar:

```typescript
export { Header } from './Header';
export { CrudAdmin } from './CrudAdmin';
export { CrudStats } from './CrudStats';
// otros componentes...
```

---

## 🔗 Referencias

- **Especificación completa:** `/specs/ui-architecture-adm.md`
- **DataTable:** `/components/ui/data-table.tsx`
- **Shadcn/ui:** https://ui.shadcn.com
