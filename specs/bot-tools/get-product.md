# Tool: `get_product`

> **Estado**: 🟡 Definición completa - Pendiente implementación  
> **Fase**: Fase 2 - Bot Ger Core Tools  
> **Dependencias**: `productService`, `searchProducts` (fallback)

---

## Propósito

Buscar y devolver información de productos del catálogo según EAN, SKU o nombre. La tool adapta el nivel de detalle según el rol del usuario y responde en formato Markdown estructurado.

---

## Estructura de Archivos

```
lib/bot/tools/get-product/
├── description.md          # Prompt/description editable de la tool
├── index.ts                # Implementación principal
├── parser.ts               # Convierte Product → Markdown
└── parser.test.ts          # Tests del formato MD
```

---

## Parámetros de Entrada

```typescript
interface GetProductInput {
  query: string;           // EAN, SKU o nombre a buscar
  context?: BotContext;    // Inyectado automáticamente por el backend
}

interface BotContext {
  role: UserRole;          // ADMIN | SELLER | TECHNICIAN | STAFF
  currentUrl: {            // URL desde donde se invoca el bot
    path: string;
    search: string;
    hash: string;
  };
  userId?: string;         // ID del usuario
}
```

---

## Comportamiento

### 1. Búsqueda Exacta → Fuzzy Fallback

| Escenario | Acción |
|-----------|--------|
| EAN exacto encontrado | Devuelve 1 producto |
| SKU exacto encontrado | Devuelve 1 producto |
| 0 resultados exactos | **Auto-ejecuta** `searchProducts` con mismo query (fuzzy) |
| Fuzzy encuentra resultados | Devuelve hasta 5 + mensaje de refinamiento |
| Fuzzy = 0 resultados | Mensaje: *"No encontré productos. ¿Probás con otro código?"* |

### 2. Límite de Resultados

- **Máximo**: 5 productos
- **Mensaje al alcanzar límite**: *"Encontré 5 productos. Si no ves el que buscás, refiná la búsqueda o usá la tool `search_products` para más opciones."*

### 3. Filtro de Datos por Rol

| Campo | ADMIN | SELLER | TECHNICIAN | STAFF |
|-------|-------|--------|------------|-------|
| `sku` | ✅ | ✅ | ✅ | ✅ |
| `name` | ✅ | ✅ | ✅ | ✅ |
| `description` | ✅ | ✅ | ✅ | ✅ |
| `stock` | ✅ | ✅ | ✅ | ✅ |
| `category` | ✅ | ✅ | ✅ | ✅ |
| `replacementCost` | ✅ | ❌ | ❌ | ❌ |
| `costPrice` | ✅ | ❌ | ❌ | ❌ |
| `price` | ✅ | ✅ | ✅ | ❌ |
| `supplier` | ✅ | ✅ | ❌ | ❌ |
| `lastPurchaseDate` | ✅ | ❌ | ❌ | ❌ |

**Notas**:
- Campos omitidos no aparecen en el Markdown (no se muestran como "null")
- El parser `productToMarkdown()` recibe el rol y filtra antes de formatear

---

## Formato de Salida (Markdown)

### Producto Único Encontrado

```markdown
## Polarizado 3M CS35
**SKU**: POL-3M-35  
**Categoría**: Polarizados

**Stock disponible**: 12 unidades  
**Precio venta**: $45.000

> Película polarizada 3M serie CS35, 35% transmisión de luz.

---
¿Querés ver más detalles o realizar alguna acción?
```

### Múltiples Productos (hasta 5)

```markdown
Encontré 3 productos similares:

**1. Polarizado 3M CS35** (SKU: POL-3M-35)  
Stock: 12 unidades | Precio: $45.000

**2. Polarizado 3M CS20** (SKU: POL-3M-20)  
Stock: 8 unidades | Precio: $52.000

**3. Polarizado 3M CS05** (SKU: POL-3M-05)  
Stock: 2 unidades | Precio: $58.000

---
Encontré 3 productos. Si no ves el que buscás, refiná la búsqueda o usá la tool `search_products` para más opciones.
```

### Contexto de URL (si aplica)

Si `currentUrl.path` incluye `/products`, Ger puede responder:
> *"Viendo que estás en la lista de productos, ¿querés que te abra el detalle de alguno?"*

---

## Parser: `productToMarkdown()`

### Responsabilidades

1. Recibe `Product[]` + `UserRole`
2. Filtra campos según rol (SELECT dinámico en Prisma o transformación post-query)
3. Formatea a Markdown con template definido
4. Agrega mensaje contextual según cantidad de resultados

### Interface

```typescript
function productToMarkdown(
  products: Product[],
  role: UserRole,
  context?: BotContext
): string;
```

### Tests Obligatorios

```typescript
// parser.test.ts
describe('productToMarkdown', () => {
  it('filters sensitive fields for TECHNICIAN', () => {
    // replacementCost no debe aparecer en el output
  });
  
  it('shows all fields for ADMIN', () => {
    // Todos los campos incluidos
  });
  
  it('returns max 5 products with message', () => {
    // Si hay 6 productos, devuelve 5 + mensaje de refinamiento
  });
  
  it('formats single product with proper markdown', () => {
    // Validar estructura MD: ## título, **negritas**, etc.
  });
  
  it('includes contextual message for /products URL', () => {
    // Si context.currentUrl incluye /products, agregar mensaje contextual
  });
});
```

---

## Regresiones a Evitar

| Cambio Peligroso | Impacto | Prevención |
|------------------|---------|------------|
| Agregar campo nuevo sin filtrar por rol | Exposición de datos sensibles | Checklist: "¿Este campo tiene filtro de rol?" |
| Cambiar formato MD sin actualizar tests | Parser roto, respuestas malformadas | Tests de snapshot del formato MD |
| Quitar `context` del input | Todas las tools dejan de funcionar | Tipado estricto en `BotToolInput` |
| Modificar lógica de fallback | Búsqueda fuzzy no ejecuta | Test de integración: query inexistente |

---

## Dependencias

- `lib/services/productService.ts` - Reutilizar función existente
- `lib/bot/tools/search-products/index.ts` - Para fallback fuzzy
- `lib/bot/types.ts` - `BotContext`, `UserRole`

---

## Vinculación

- **Spec principal**: [`/specs/bot.md`](../bot.md) - Arquitectura general del bot
- **Spec formatting**: [`/specs/ger-formatting.md`](../ger-formatting.md) - Estilo de respuestas
- **Checklist implementación**: [`/specs/checklist-crud-implementation.md`](../checklist-crud-implementation.md) - Proceso de desarrollo

---

## Historial de Cambios

| Fecha | Versión | Cambio | Autor |
|-------|---------|--------|-------|
| 2026-04-17 | 1.0 | Definición inicial | User |

