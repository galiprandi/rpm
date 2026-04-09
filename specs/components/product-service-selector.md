# Especificación: ProductServiceSelector

## Visión General

Componente agnóstico y reusable para buscar, seleccionar y gestionar productos y servicios en un flujo tipo "carrito de compras". Diseñado para reemplazar la búsqueda existente en:

- **QuickSaleModal** (`/components/dashboard/QuickSaleModal.tsx`)
- **Nueva Orden de Trabajo - Paso 2** (`/app/adm/work-orders/new/page.tsx`)

---

## Requisitos Funcionales

### Búsqueda
- Buscar simultáneamente en productos y servicios
- Campos de búsqueda: `name`, `sku`, `ean` (productos); `name`, `code` (servicios)
- Búsqueda en tiempo real con debounce (300ms)
- Resultados unificados con flag diferenciador `type: 'product' | 'service'`

### Filtros
- **Categoría**: Selector opcional que filtra solo productos
- **Lista de Precios**: Selector opcional que afecta el precio mostrado y calculado

### Selección (Carrito)
- Permitir selección múltiple
- Agrupar items seleccionados en vista tipo "ticket"
- Ajustar cantidades con controles `[-]` `[+]` o input directo
- Eliminar items del carrito
- Precios manuales: si el usuario edita un precio, se marca como `isManualPrice: true` y no se actualiza al cambiar de lista de precios

### Integración
- Estado interno del carrito
- Notificar cambios al parent vía callback `onSelectionChange`
- Soporte para items iniciales (`initialItems`)
- Soporte para crear servicios rápidos (delega al parent)

---

## API del Componente

```typescript
interface ProductServiceSelectorProps {
  // Configuración visual
  showPriceListSelector?: boolean;      // default: false
  showCategoryFilter?: boolean;         // default: false
  showQuickCreate?: boolean;           // Muestra "+ Crear servicio rápido"
  showSelectedTable?: boolean;          // default: true - Muestra tabla de items seleccionados
  
  // Valores iniciales
  defaultPriceListId?: string;
  initialItems?: SelectedItem[];        // Solo se usa en mount inicial
  
  // Callbacks
  onSelectionChange: (items: SelectedItem[]) => void;
  onQuickCreate?: () => void;           // Abre modal de creación
  
  // Datos para filtros (opcional - si no se pasan, los selectores no funcionan)
  categories?: Category[];              // Lista de categorías para el filtro
  priceLists?: PriceList[];             // Lista de listas de precios para el selector
  
  // Endpoint personalizado (opcional)
  searchEndpoint?: string;              // default: '/api/products-services/search'
}

interface SelectedItem {
  id: string;
  type: 'product' | 'service';
  name: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;                // Precio calculado antes de edición manual
  isManualPrice: boolean;
  priceListId?: string;                 // Lista usada para el cálculo
  
  // Productos específicos
  sku?: string;
  stock?: number;                       // Info de stock (no bloquea cantidades)
  categoryId?: string;
  categoryName?: string;
  
  // Servicios específicos
  description?: string;
}
```

---

## Estructura Visual

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Buscar por nombre, SKU o código de barras...      [🔍] │
├─────────────────────────────────────────────────────────────┤
│  [Todas las categorías ▼]  [Lista de Precios: Mayorista ▼] │
├─────────────────────────────────────────────────────────────┤
│  RESULTADOS DE BÚSQUEDA                                       │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 📦 Producto A                    $1,250   [+ Agregar]│   │
│  │    SKU: ABC123 | EAN: 779123456 | Stock: 15           │   │
│  ├───────────────────────────────────────────────────────┤   │
│  │ 🔧 Servicio de Instalación       $3,500   [+ Agregar]│   │
│  │    Código: SRV-001 | Precio: Mayorista +15%          │   │
│  └───────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  SELECCIONADOS (3)                                          │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 📦 Producto A        [-] 2 [+]  $1,250/u  $2,500  [🗑]│   │
│  │ 🔧 Servicio Inst.    [-] 1 [+]  $3,500/u  $3,500  [🗑]│   │
│  │ 📦 Producto B        [-] 3 [+]    $800/u  $2,400  [🗑]│   │
│  ├───────────────────────────────────────────────────────┤   │
│  │                              TOTAL:      $8,400      │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## API del Endpoint

### `GET /api/products-services/search`

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `q` | string | Término de búsqueda (name, sku, barcode) |
| `categoryId` | string? | Filtrar productos por categoría |
| `priceListId` | string? | Lista de precios seleccionada para precio base |
| `limit` | number | Límite de resultados (default: 20) |

**Nota:** El backend siempre devuelve `allPrices` con los precios calculados para todas las listas activas, permitiendo cambio instantáneo de lista sin nueva petición.

**Response:**
```typescript
{
  results: [
    {
      // Común
      id: string;
      type: 'product' | 'service';
      name: string;
      basePrice: number;           // Precio calculado según lista seleccionada
      allPrices: {                 // Precios para TODAS las listas (para caché)
        [priceListId: string]: {
          finalPrice: number;
          isBelowMinimum: boolean;
        }
      };
      minimumPrice?: number;      // Precio mínimo permitido (margen mínimo)
      isBelowMinimum?: boolean;   // Si el precio está bajo el mínimo
      
      // Productos
      sku?: string;
      stock?: number;
      categoryId?: string;
      categoryName?: string;
      
      // Servicios
      description?: string;
    }
  ]
}
```

---

## Comportamientos Clave

### Cambio de Lista de Precios
1. Recalcula precios de todos los items NO manuales
2. Items con `isManualPrice: true` mantienen su precio
3. Actualiza `priceListId` en todos los items

### Agregar Item al Carrito
1. Si el item ya existe → incrementa cantidad en 1
2. Si es nuevo → agrega con `quantity: 1`, `isManualPrice: false`
3. Stock: solo informativo, no bloquea cantidades (permite stock negativo)

### Edición de Precio
1. Input editable en cada línea del carrito
2. Al editar: marca `isManualPrice: true`
3. Visual: badge "Manual" o borde distintivo

### Servicios Rápidos
1. Si `showQuickCreate: true`, muestra "+ Crear servicio rápido" en dropdown
2. Click → `onQuickCreate()` → parent abre modal
3. Al crear exitosamente, parent puede agregar vía `initialItems` o recargar búsqueda

---

## Casos de Uso

### QuickSaleModal
```tsx
<ProductServiceSelector
  showPriceListSelector={true}
  showCategoryFilter={true}
  defaultPriceListId={activePriceListId}
  onSelectionChange={(items) => setCartItems(items)}
  onQuickCreate={() => setShowQuickServiceDialog(true)}
/>
```

### Nueva Orden de Trabajo - Paso 2
```tsx
<ProductServiceSelector
  showPriceListSelector={true}
  showCategoryFilter={true}
  showQuickCreate={true}
  defaultPriceListId={selectedPriceListId}
  onSelectionChange={(items) => setWorkOrderItems(items)}
  onQuickCreate={() => setShowQuickServiceDialog(true)}
/>
```

---

## Archivos a Crear

```
components/
├── ui/
│   └── ProductServiceSelector.tsx          # Componente principal
├── products/
│   └── ProductServiceSelector.stories.tsx  # Stories de Storybook
└── services/
    └── (no aplica - componente es agnóstico)

app/api/products-services/search/
└── route.ts                                # Endpoint unificado
```

---

## Notas de Implementación

1. **Estado interno**: Usar `useState` para el carrito, notificar al parent con `useEffect` o en cada acción
2. **Debounce**: Reutilizar patrón de `SearchableSelect` (300ms)
3. **Cierre del dropdown**: Click outside para cerrar resultados
4. **Accesibilidad**: Navegación con teclado en resultados (ArrowDown/ArrowUp/Enter)
5. **Optimización**: Cancelar requests pendientes si el usuario sigue escribiendo

---

## Migración de Componentes Existentes

### QuickSaleModal
- Reemplazar bloque de búsqueda (líneas 440-502) con `<ProductServiceSelector>`
- Reemplazar carrito (líneas 504-555) con el carrito interno del componente
- Eliminar estado `searchQuery`, `searchResults`, manejo de `cart`

### Nueva OT - Paso 2
- Reemplazar dos `SearchableSelect` (líneas 817-851) con componente único
- Reemplazar tabla de items (líneas 853-931) con carrito del componente
- Eliminar lógica de `addItem`, `removeItem`, `updateQuantity`, etc.

---

## Testing

### Unit Tests (Jest)

Ubicación: `components/ui/ProductServiceSelector.test.tsx`

**Casos a cubrir:**

| Test | Descripción |
|------|-------------|
| `renders with default props` | Renderiza sin props opcionales |
| `renders price list selector when enabled` | Muestra selector de lista cuando `showPriceListSelector=true` |
| `renders category filter when enabled` | Muestra filtro de categoría cuando `showCategoryFilter=true` |
| `searches on input change` | Llama al endpoint con debounce al escribir |
| `displays mixed results` | Muestra productos y servicios con iconos diferenciadores |
| `adds item to cart on click` | Agrega item al carrito al hacer click en resultado |
| `increments quantity for existing item` | Incrementa cantidad si item ya existe en carrito |
| `updates quantity with controls` | [+]/[-] actualizan cantidad correctamente |
| `removes item from cart` | Botón de eliminar remueve el item |
| `updates price on list change` | Recalcula precios al cambiar lista de precios |
| `preserves manual prices on list change` | No modifica precios marcados como manuales |
| `calls onSelectionChange` | Notifica al parent cuando cambia el carrito |
| `calls onQuickCreate` | Llama callback al hacer click en "Crear servicio rápido" |

### Integration Tests (Playwright)

Ubicación: `tests/playwright/product-service-selector.spec.ts`

**Flujos a cubrir:**

```typescript
test.describe('ProductServiceSelector', () => {
  test('quick sale flow - add products and complete sale', async () => {
    // Buscar producto, agregar al carrito, verificar precios
  });
  
  test('work order flow - add items with manual price edit', async () => {
    // Agregar items, editar precio manualmente, verificar badge "Manual"
  });
  
  test('price list change updates prices', async () => {
    // Seleccionar lista, agregar items, cambiar lista, verificar recálculo
  });
  
  test('category filter shows only products', async () => {
    // Seleccionar categoría, verificar que solo aparecen productos
  });
  
  test('quantity controls work correctly', async () => {
    // Probar incremento, decremento, input directo
  });
});
```

### Storybook Tests

Ubicación: `components/ui/ProductServiceSelector.stories.tsx`

**Stories requeridas:**

- `Default` - Estado inicial vacío
- `WithInitialItems` - Precargado con items
- `WithPriceListSelector` - Mostrando selector de lista
- `WithCategoryFilter` - Mostrando filtro de categoría
- `WithQuickCreate` - Mostrando botón de crear servicio
- `WithManualPrices` - Items con precios editados manualmente
- `MaxSelectionReached` - Estado cuando se alcanza el límite
- `LoadingState` - Mientras carga resultados
- `EmptyResults` - Sin resultados de búsqueda

## Checklist de Implementación

- [ ] Crear especificación (este documento)
- [ ] Crear endpoint `/api/products-services/search`
- [ ] Crear componente `ProductServiceSelector` base
- [ ] Implementar búsqueda con debounce
- [ ] Implementar filtros (categoría, lista de precios)
- [ ] Implementar carrito con cantidades
- [ ] Implementar edición de precios manuales
- [ ] Implementar servicios rápidos
- [ ] **Crear tests unitarios (Jest)**
- [ ] **Crear tests de integración (Playwright)**
- [ ] Crear stories en Storybook
- [ ] Migrar QuickSaleModal
- [ ] Migrar Nueva OT - Paso 2
- [ ] Testing manual en ambos casos de uso
