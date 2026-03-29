# 🖥️ Arquitectura de UI: Admin (Desktop)

## 📍 Ubicación

**Toda la UI de administración está en: `/app/adm/**`**

Consultar esta especificación ANTES de crear o modificar cualquier página en el área de administración.

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

## Validación de Formularios Admin

### Campos Obligatorios - Producto

| Campo | UI (required) | Descripción |
|-------|---------------|-------------|
| **Nombre** | ✅ Sí | Nombre descriptivo del producto |
| **SKU** | ❌ No | Código interno opcional |
| **EAN/Barcode** | ❌ No | Código de barras opcional |
| **Categoría** | ✅ Sí | Debe seleccionar categoría |
| **Proveedor** | ✅ Sí | Nombre del proveedor |
| **Costo** | ✅ Sí | Precio de costo |
| **Venta** | ✅ Sí | Precio de venta |
| **Stock** | ✅ Sí | Stock actual |
| **Mínimo** | ✅ Sí | Stock mínimo para alertas |

### UX para Campos Requeridos

1. **Marcado visual**: Asterisco (*) en labels de campos obligatorios
2. **CTA deshabilitado**: Botón guardar deshabilitado hasta completar todos los campos obligatorios
3. **Validación inline**: Errores al salir del campo (onBlur) o al intentar submit
4. **Helper text**: Placeholder indica formato o "(opcional)"

```typescript
const isFormValid = () => {
  return (
    formData.name.trim() !== '' &&
    formData.categoryId !== '' &&
    formData.supplier.trim() !== '' &&
    formData.costPrice.trim() !== '' &&
    formData.salePrice.trim() !== '' &&
    formData.stock.trim() !== '' &&
    formData.minStock.trim() !== ''
  );
};
```

---

## Layout Admin

### Estructura Base

```typescript
// app/adm/layout.tsx
<AdminLayout>
  <AdminSidebar collapsed={sidebarCollapsed} />
  <main className="flex-1 p-6">
    {children}
  </main>
</AdminLayout>
```

### Sidebar

- **Estado**: Colapsable (iconos + tooltips cuando está colapsado)
- **Items**: Dashboard, Productos, Categorías, Inventario, Ventas, Reportes
- **Active State**: Item activo resaltado

### Header de Página

```typescript
<div className="flex justify-between items-start">
  <div>
    <h1 className="text-3xl font-bold">Título de Página</h1>
    <p className="text-muted-foreground">Descripción breve</p>
  </div>
  <Button variant="default" className="bg-slate-900 text-white">
    <Plus className="h-5 w-5 mr-2" />
    Acción Principal
  </Button>
</div>
```

---

## Cards y Secciones

### Card Base

```typescript
<Card>
  <CardHeader>
    <CardTitle>Título de Sección</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Contenido */}
  </CardContent>
</Card>
```

### Stats Cards (Dashboard)

```typescript
<div className="grid gap-4 md:grid-cols-4">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        Total Productos
      </CardTitle>
      <Package className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{count}</div>
    </CardContent>
  </Card>
</div>
```

---

## Tablas Admin

### Estructura Base

```typescript
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead className="border-b bg-muted/50">
      <tr>
        <th className="text-left py-3 px-4 font-medium">Columna</th>
      </tr>
    </thead>
    <tbody>
      {data.map(item => (
        <tr key={item.id} className="border-b hover:bg-muted/50">
          <td className="py-3 px-4">{item.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Acciones en Tabla

```typescript
<div className="flex justify-center space-x-2">
  <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
    <Edit2 className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(item)}>
    <Trash2 className="h-4 w-4" />
  </Button>
</div>
```

---

## Modales Admin

### Modal con Formulario

```typescript
<Modal
  isOpen={isDialogOpen}
  onClose={() => setIsDialogOpen(false)}
  title={editingItem ? 'Editar' : 'Nuevo'}
  description="Descripción del modal"
  size="lg"
  footer={
    <ModalFooter
      onCancel={() => setIsDialogOpen(false)}
      onSave={handleSubmit}
      saveText={editingItem ? 'Guardar Cambios' : 'Crear'}
      disabled={!isFormValid()}
    />
  }
>
  <ProductForm 
    formData={formData}
    setFormData={setFormData}
    categories={categories}
  />
</Modal>
```

---

## Alertas y Confirmaciones (Alert/Confirm)

### ✅ OBLIGATORIO: Componentes reusables vía UIProvider

**Las alertas y confirmaciones deben ser gestionadas centralmente mediante `UIProvider` y lanzadas mediante el hook `useUI()`.**

#### ❌ PROHIBIDO: Alert/Confirm inline o nativos

```typescript
// ❌ MAL: Alert nativo del browser
alert('Producto guardado');

// ❌ MAL: Confirm nativo del browser  
if (confirm('¿Estás seguro?')) { ... }

// ❌ MAL: Componente inline en cada página
{showAlert && <AlertDialog ... />}
```

#### ✅ OBLIGATORIO: Usar UIProvider + useUI()

```typescript
// 1. UIProvider envuelve la aplicación (layout.tsx)
// 2. Usar useUI() en cualquier componente para lanzar alertas/confirm

import { useUI } from '@/components/ui/UIProvider';

export function ProductsPage() {
  const { alert, confirm } = useUI();

  const handleSave = async () => {
    await saveProduct();
    
    // ✅ Alert simple
    await alert({
      title: 'Éxito',
      description: 'Producto guardado correctamente',
      variant: 'success', // 'success' | 'error' | 'warning' | 'info'
    });
  };

  const handleDelete = async (product: Product) => {
    // ✅ Confirm con retorno booleano
    const confirmed = await confirm({
      title: 'Eliminar Producto',
      description: `¿Estás seguro de eliminar "${product.name}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (confirmed) {
      await deleteProduct(product.id);
    }
  };
}
```

### API de useUI()

| Método | Retorno | Props |
|--------|---------|-------|
| `alert(options)` | `Promise<void>` | title, description, variant?, action? |
| `confirm(options)` | `Promise<boolean>` | title, description, confirmText, cancelText, variant? |

### Variantes Visuales

```typescript
variant: 'success'  // Verde, check icon
variant: 'error'    // Rojo, X icon
variant: 'warning'  // Naranja, triangle icon
variant: 'info'     // Azul, info icon
default: 'info'
```

### Ejemplos de Uso

#### Alert de éxito
```typescript
await alert({
  title: 'Categoría creada',
  description: 'La categoría "Iluminación LED" fue creada exitosamente.',
  variant: 'success',
});
```

#### Confirm destructivo
```typescript
const shouldDelete = await confirm({
  title: 'Eliminar Proveedor',
  description: 'Este proveedor tiene 5 productos asociados. ¿Eliminar de todos modos?',
  confirmText: 'Sí, eliminar',
  cancelText: 'Cancelar',
  variant: 'destructive',
});
```

#### Alert con acción
```typescript
await alert({
  title: 'Stock bajo',
  description: 'El producto "Barra LED" está por debajo del mínimo.',
  variant: 'warning',
  action: {
    label: 'Ver producto',
    onClick: () => router.push('/adm/products/123'),
  },
});
```

### Implementación del Provider

```typescript
// components/ui/UIProvider.tsx
interface UIContextType {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({ ...options, onClose: resolve });
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        ...options,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }, []);

  return (
    <UIContext.Provider value={{ alert, confirm }}>
      {children}
      {alertState && <AlertDialog {...alertState} />}
      {confirmState && <ConfirmDialog {...confirmState} />}
    </UIContext.Provider>
  );
}

export const useUI = () => useContext(UIContext);
```

### Reglas Importantes

1. **Siempre usar `await`**: Las alertas/confirms son asíncronas
2. **Nunca mezclar con alert()/confirm() nativos**: Mantener consistencia UI
3. **Variante correcta**: Usar 'destructive' para acciones irreversibles
4. **Texto descriptivo**: Título y descripción claros
5. **Acciones opcionales**: Pueden incluir botón de acción secundaria

---

## Layout CRUD Admin

### ✅ Estructura Vertical Estándar

**Todas las páginas CRUD de Admin deben seguir este orden de arriba a abajo:**

```
1. HEADER (flex justify-between items-start)
   ├── Izquierda: Título (text-3xl font-bold)
   └── Derecha: Botón [+ Nuevo] (primary, dark)

2. SUBTÍTULO (text-muted-foreground)
   └── Descripción breve de la página

3. STATS CARDS (solo Productos y CRUDs importantes)
   └── Grid de 4 cards máximo (Total, Alertas, etc.)

4. FILTROS (flex gap-4)
   ├── Buscador (flex-1, con icono Search)
   └── Filtros opcionales (select, badges, etc.)

5. TABLA DE DATOS
   └── Table con headers, rows, acciones
```

### Ejemplo Completo: Productos

```typescript
<div className="space-y-6">
  {/* 1. HEADER + CTA */}
  <div className="flex justify-between items-start">
    <div>
      <h1 className="text-3xl font-bold">Productos</h1>
      <p className="text-muted-foreground">
        Gestiona el inventario
      </p>
    </div>
    <Button className="bg-slate-900 text-white...">
      <Plus className="h-5 w-5 mr-2" />
      Nuevo Producto
    </Button>
  </div>

  {/* 2. STATS CARDS (solo para productos/importantes) */}
  <div className="grid gap-4 md:grid-cols-4">
    <Card><CardContent>Total: {count}</CardContent></Card>
    <Card><CardContent>Stock Bajo: {lowStock}</CardContent></Card>
    ...
  </div>

  {/* 3. FILTROS */}
  <Card>
    <CardContent className="p-4">
      <div className="flex gap-4">
        <Input placeholder="Buscar..." className="flex-1" />
        <Select><option>Filtro 1</option></Select>
        <Button variant="outline">Stock Bajo</Button>
      </div>
    </CardContent>
  </Card>

  {/* 4. TABLA */}
  <Card>
    <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
    <CardContent>
      <table>...</table>
    </CardContent>
  </Card>
</div>
```

### Reglas por Tipo de CRUD

| Tipo | Stats Cards | Ejemplos |
|------|-------------|----------|
| **Importante** | ✅ Sí (4 máx) | Productos, Ventas, Clientes |
| **Catalogo** | ❌ No | Categorías, Proveedores |
| **Config** | ❌ No | Usuarios, Settings |

---

## Botones Admin

### ✅ NORMA: Ubicación Consistente del Botón "+" (Crear/Nuevo)

**En todos los CRUDs de Admin, el botón de crear/nuevo debe estar ubicado SIEMPRE en el mismo lugar:**

```
Header de página (flex justify-between items-start)
├── Izquierda: Título + descripción
└── Derecha: Botón [+ Nuevo/Crear] (primary, dark)
```

**❌ PROHIBIDO: Botón de crear en cards separadas, tablas, o ubicaciones inconsistentes**

```typescript
// ❌ MAL: Botón en card debajo del header
<Card>
  <CardHeader><CardTitle>Nueva Categoría</CardTitle></CardHeader>
  <CardContent>
    <Button>Crear</Button>  // ← NO: Está en el lugar equivocado
  </CardContent>
</Card>

// ✅ BIEN: Botón en header alineado con título
<div className="flex justify-between items-start">
  <div>
    <h1 className="text-3xl font-bold">Categorías</h1>
    <p className="text-muted-foreground">Gestiona las categorías</p>
  </div>
  <Button 
    variant="default"
    className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2"
  >
    <Plus className="h-5 w-5 mr-2" />
    Nueva Categoría
  </Button>
</div>
```

**Páginas que deben seguir esta norma:**
- `/adm/products` → Botón "Nuevo Producto" ✅
- `/adm/categories` → Botón "Nueva Categoría" ✅
- `/adm/suppliers` → Botón "Nuevo Proveedor" ✅
- Futuros CRUDs → Mismo patrón

---

### Botón CTA Principal (Nuevo/Crear)

```typescript
<Button 
  variant="default"
  className="bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 shadow-lg hover:shadow-xl transition-all font-semibold px-4 py-2"
>
  <Plus className="h-5 w-5 mr-2" />
  Nuevo Producto
</Button>
```

### Botón Acción Secundaria

```typescript
<Button variant="outline">Cancelar</Button>
<Button variant="ghost" size="sm"><Edit2 className="h-4 w-4" /></Button>
```

---

## Vinculación con Otras Specs

- `/specs/ui-architecture.md` - Índice de arquitectura UI
- `/specs/ui-architecture-public.md` - Diseño de sitio público
- `/specs/inventory-sales.md` - Reglas de negocio stock/ventas
- `/specs/workshop.md` - Reglas de negocio taller (Fase 2)

---

**Estado**: ✅ Definido  
**Última actualización**: 2026-03-28
