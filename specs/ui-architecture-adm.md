# 🖥️ Arquitectura de UI: Admin (Desktop)

## 📍 Ubicación

**Toda la UI de administración está en: `/app/adm/**`**

Consultar `/specs/ui-architecture-adm.md` ANTES de crear o modificar cualquier página en el área de administración.

Para instrucciones prácticas de implementación, ver: **`/components/adm/AGENTS.md`**

---

## Principio Fundamental

**Desktop = Administración compleja | Formularios completos | Datos densos**

El área de administración está optimizada para:
- **Ubicación**: Mostrador, oficina, área administrativa
- **Dispositivo**: PC/Laptop con pantalla grande
- **Sesión**: Prolongada (turno completo)
- **Interacción**: Teclado + mouse, multitarea

---

## Estructura de Rutas Admin

```
/app/adm                    → Dashboard resumen día
├── /products               → CRUD completo productos
├── /categories             → CRUD categorías
├── /inventory              → Stock, alertas, ajustes
├── /sales/quick           → Venta rápida (mostrador)
├── /invoices              → Historial facturas, libro IVA
├── /cash-register         → Apertura/cierre caja
├── /reports               → Ventas, stock, simples
└── /workshop              → Fase 2: Taller
    ├── /customers         → Fichas clientes completas
    ├── /quotes            → Presupuestos con preview
    ├── /work-orders       → Kanban + lista detallada
    ├── /schedule          → Calendario semanal grande
    └── /technicians       → Asignación, carga trabajo
```

---

## Características de Diseño Admin

| Aspecto | Implementación |
|---------|----------------|
| **Layout** | Sidebar + Main Content, múltiples columnas |
| **Navegación** | Menú persistente, breadcrumbs |
| **Formularios** | Completos, todos los campos visibles |
| **Tablas** | Datos densos, filtros avanzados, exportación |
| **Acciones** | Botones visibles, tooltips, atajos de teclado |
| **Feedback** | Notificaciones, modales, confirmaciones |
| **Colores** | Esquema claro profesional (bg: white, cards: slate-50) |
| **Cards** | Borde `ring-slate-300` (gris 50%) |

---

## Reglas de Arquitectura de Componentes

### ❌ PROHIBIDO: Componentes inline en páginas

```typescript
// ❌ MAL: Formulario inline en page.tsx
export default function ProductsPage() {
  const [formData, setFormData] = useState({...});
  return (
    <form>{/* 100+ líneas inline */}</form>
  );
}
```

### ✅ OBLIGATORIO: Componentes separados

```typescript
// ✅ BIEN: Componente en components/products/ProductForm.tsx
export function ProductForm({ formData, setFormData, categories }: ProductFormProps) {
  return <form>{/* JSX puro */}</form>;
}

// ✅ BIEN: Página simple que importa
import { ProductForm } from '@/components/products/ProductForm';
export default function ProductsPage() {
  return <ProductForm ... />;
}
```

### Organización de Componentes

| Tipo | Ubicación | Test Strategy |
|------|-----------|---------------|
| **UI Components** | `components/ui/*.tsx` | Unit tests + Storybook |
| **Feature Components** | `components/[feature]/*.tsx` | Unit tests + Integration |
| **Page Components** | `app/adm/**/page.tsx` | Integration/E2E tests |
| **Layout Components** | `components/layout/*.tsx` | Visual regression |

### Límites de Complejidad Admin

| Métrica | Page Component | Feature Component |
|---------|---------------|-------------------|
| Líneas de código | ≤150 | ≤300 |
| Props | ≤5 | ≤15 |
| Hooks | ≤3 | ≤8 |
| JSX anidado | ≤2 niveles | ≤4 niveles |

---

## Header Component

**Todas las vistas admin DEBEN usar el componente `Header` de `@/components/adm/Header`** para mantener consistencia visual.

### Uso Básico

```typescript
import { Header } from '@/components/adm/Header';

<Header
  title="Productos"
  description="Gestiona tu catálogo"
  primaryAction={{ label: 'Nuevo', onClick: handleCreate, icon: Plus }}
/>
```

### Uso en Vistas de Detalle

```typescript
<Header
  title={customer.fullName}
  description={`Cliente desde ${date}`}
  showBackButton
  secondaryActions={[{ label: 'Eliminar', onClick: handleDelete, variant: 'outline' }]}
  primaryAction={{ label: 'Crear Vehículo', href: '/adm/vehicles/new', icon: Plus }}
>
  {/* Contactos accionables aquí */}
  <div className="flex gap-4 mt-2">
    <a href={`tel:${phone}`}><Phone className="h-4 w-4" /> {phone}</a>
  </div>
</Header>
```

**Ver ejemplos completos en: `/components/adm/AGENTS.md`**

---

## ⚠️ REGLAS CRÍTICAS

### Select en Modales

**Siempre usar `NativeSelect` en formularios dentro de modales.** El componente `Select` de Radix tiene problemas de z-index.

```typescript
// ✅ BIEN
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

<Modal>
  <NativeSelect value={value} onChange={...}>
    <NativeSelectOption value="">Selecciona...</NativeSelectOption>
    {items.map(item => <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>)}
  </NativeSelect>
</Modal>
```

### Modales sin overflow

**Los modales NO deben tener `overflow-y-auto` en el contenedor de contenido.**

```typescript
// ❌ MAL
<div className="p-6 max-h-[60vh] overflow-y-auto">{children}</div>

// ✅ BIEN
<div className="p-6">{children}</div>
```

### Alertas y Confirmaciones

**Las alertas y confirmaciones deben usar `UIProvider` y el hook `useUI()`.**

```typescript
import { useUI } from '@/components/ui/UIProvider';

const { alert, confirm } = useUI();

await alert({ title: 'Éxito', description: 'Producto guardado', variant: 'success' });
const confirmed = await confirm({ title: 'Eliminar', description: '¿Estás seguro?', variant: 'destructive' });
```

---

## 🪟 Construcción de Modales

### Componentes Base

**Siempre usar `ModalBase` y `ModalBaseFooter` para consistencia.**

```typescript
import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';

<ModalBase
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Nuevo Cliente"
  maxWidth="2xl"
  footer={
    <ModalBaseFooter
      onCancel={() => setIsOpen(false)}
      onSave={handleSave}
      saveText="Crear Cliente"
      isLoading={isLoading}
    />
  }
>
  <CustomerForm formData={formData} setFormData={setFormData} />
</ModalBase>
```

### Reglas de Botones en Modales

| Regla | Implementación |
|-------|----------------|
| **Orden** | Cancelar (izquierda) → Guardar (derecha) |
| **Alineación** | `justify-end` (derecha) |
| **Gap** | `gap-3` entre botones |
| **Tamaño** | Según contenido, NO usar `flex-1` o ancho completo |
| **Estilo primario** | `bg-primary text-primary-foreground hover:bg-primary/90 border border-primary shadow-lg hover:shadow-xl transition-all font-semibold` |
| **Estilo secundario** | `variant="outline"` |

### ❌ PROHIBIDO: Botones mal posicionados

```typescript
// ❌ MAL: Botones con flex-1 (ancho completo)
<div className="flex gap-4 pt-4">
  <Button className="flex-1">Guardar</Button>
  <Button variant="outline" className="flex-1">Cancelar</Button>
</div>

// ❌ MAL: Guardar a la izquierda
<div className="flex items-center justify-end gap-3">
  <Button onClick={onSave}>Guardar</Button>
  <Button variant="outline" onClick={onCancel}>Cancelar</Button>
</div>

// ❌ MAL: Botón primario sin estilo definido
<Button type="submit">Guardar</Button>
```

### ✅ OBLIGATORIO: Botones según ModalBaseFooter

```typescript
// ✅ BIEN: Cancelar izquierda, Guardar derecha, alineados a la derecha
<div className="flex items-center justify-end gap-3">
  <Button variant="outline" onClick={onCancel} disabled={isLoading}>
    Cancelar
  </Button>
  <Button
    onClick={onSave}
    disabled={isLoading}
    className="bg-primary text-primary-foreground hover:bg-primary/90 border border-primary shadow-lg hover:shadow-xl transition-all font-semibold"
  >
    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
  </Button>
</div>
```

### Separación de Formularios

**Los formularios de modales DEBEN estar en componentes separados.**

```typescript
// ✅ BIEN: Formulario separado en components/customers/CustomerForm.tsx
export function CustomerForm({ formData, setFormData }: CustomerFormProps) {
  return <form className="space-y-4">{/* campos */}</form>;
}

// ✅ BIEN: Modal simple en la página
<ModalBase ...>
  <CustomerForm formData={formData} setFormData={setFormData} />
</ModalBase>
```

---

## Anatomía de Vistas

### Vista de Listado (CRUD)

```
1. HEADER (flex justify-between items-start)
   ├── Izquierda: Título (text-3xl font-bold) + descripción
   └── Derecha: Botón [+ Nuevo] (bg-slate-900)

2. STATS CARDS (solo Productos y CRUDs importantes)
   └── Grid de 4 cards máximo

3. FILTROS (flex gap-4)
   └── Buscador + select + badges

4. TABLA DE DATOS
   └── DataTable con headers, rows, acciones
```

**Ejemplo:** `/app/adm/products/page.tsx`

### Vista de Detalle

```
1. HEADER ESTÁNDAR
   ├── Izquierda: 
   │   ├── Título (text-3xl font-bold) - Nombre del recurso
   │   ├── Subtítulo (text-muted-foreground)
   │   └── Contactos accionables (tel, email, dirección)
   └── Derecha:
       ├── [Volver] (ghost)
       ├── Acciones secundarias
       └── [CTA Principal] (bg-slate-900)

2. CARD DE INFORMACIÓN PRINCIPAL
   └── Datos relevantes del recurso (sin stats)

3. TABLAS RELACIONADAS (usando data-table)
   └── Listados de recursos hijos
```

**Reglas para Vistas de Detalle:**

| Elemento | Regla |
|----------|-------|
| **Título** | Nombre del recurso (no ID) |
| **Stats Cards** | ❌ No usar en vistas de detalle |
| **Contactos** | ✅ Deben ser clickeables (tel, mail, maps) |
| **CTA Principal** | Acción relacionada al contexto |
| **Tablas** | ✅ Usar `data-table` component |
| **IDs UUID** | ❌ No mostrar |

---

## Componentes de Admin

| Componente | Ubicación | Uso |
|------------|-----------|-----|
| **Header** | `components/adm/Header.tsx` | Header estándar para todas las vistas |
| **CrudAdmin** | `components/adm/CrudAdmin.tsx` | Vista CRUD completa con tabla, filtros, stats |
| **CrudStats** | `components/adm/CrudStats.tsx` | Cards de estadísticas para listados |
| **ModalBase** | `components/ui/ModalBase.tsx` | Modal estándar para todos los modales |
| **DataTable** | `components/ui/data-table.tsx` | Tabla con filtros, ordenamiento, paginación |

---

## Vinculación con Otras Specs

- `/specs/ui-architecture.md` - Índice de arquitectura UI
- `/specs/ui-architecture-public.md` - Diseño de sitio público
- `/specs/inventory-sales.md` - Reglas de negocio stock/ventas
- `/specs/workshop.md` - Reglas de negocio taller
- **`/components/adm/AGENTS.md`** - Guía práctica para desarrolladores

---

**Estado**: ✅ Definido | **Última actualización**: 2026-03-30
