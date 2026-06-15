# Tool: `get_product`

> **Estado**: ✅ Implementado  
> **Fase**: Fase 2 - Bot Nitro Core Tools  
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
├── parser.test.ts          # Tests del formato MD
└── execute.ts              # Lógica de ejecución
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

### 1. Búsqueda con Fuzzy Fallback Inteligente

La tool `get_product` decide cuándo invocar `searchService` internamente:

| Tipo de Query | Resultados | Acción |
|--------------|------------|--------|
| **SKU exacto** (match en `sku` field) | Cualquier cantidad | Devuelve tal cual (no fuzzy) |
| **Query genérica** (nombre/descripción) | >= 1 resultados | Devuelve tal cual (suficiente variedad) |
| **Query genérica** (nombre/descripción) | 0 resultados | **Invoca** `searchService` (fuzzy más amplio) |

**Lógica de detección:**
1. Primero intenta match exacto en `sku` field
2. Si match, es SKU → no fuzzy (identificador único)
3. Si no match, es query genérica → aplica lógica de 0 resultados

### 2. Límite de Resultados

- **Máximo**: 5 productos
- **Mensaje al alcanzar límite**: *"Encontré 5 productos. Si no ves el que buscás, refiná la búsqueda o usá la tool `search_products` para más opciones."*

### 3. Singularización y Normalización de Queries

**IMPORTANTE**: La tool implementa automáticamente singularización y normalización de acentos antes de buscar:

```typescript
const singularQuery = query
  .replace(/es$/, '')      // "baterías" → "batería"
  .replace(/s$/, '')       // "aceites" → "aceite"
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');  // "batería" → "bateria"
```

Esto aumenta la tasa de match porque:
- Los nombres de productos en la DB están en singular
- La búsqueda es accent-insensitive
- El usuario puede usar plural y la tool lo singulariza automáticamente

**Nota**: La descripción de la tool indica que el modelo debería singularizar, pero la implementación final lo hace en código para mayor confiabilidad.

### 4. Filtro de Datos por Rol

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

Si `currentUrl.path` incluye `/products`, Nitro puede responder:
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
- **Spec formatting**: [`/specs/nitro-formatting.md`](../nitro-formatting.md) - Estilo de respuestas
- **Checklist implementación**: [`/specs/checklist-crud-implementation.md`](../checklist-crud-implementation.md) - Proceso de desarrollo

---

## Historial de Cambios

| Fecha | Versión | Cambio | Autor |
|-------|---------|--------|-------|
| 2026-04-17 | 1.0 | Definición inicial | User |
| 2026-04-17 | 1.1 | Implementación completa con singularización y normalización en código | User |
| 2026-04-17 | 1.2 | Corrección de lógica de fallback (0 resultados en lugar de < 2) | User |
| 2026-04-18 | 1.3 | Implementación de historial de conversación (SDK pattern) | User |

---

## Mejoras Pendientes

### 🔴 Prioridad Alta: Migrar almacenamiento a DB

**Estado:** Actualmente en memoria (`Map<string, string[]>` en `app/api/bot/chat/route.ts`)

**Problema:** El historial se pierde al reiniciar el servidor.

**Solución requerida:**
1. Crear tabla `ChatConversations` en Prisma:
   ```prisma
   model ChatConversation {
     id        String   @id @default(cuid())
     chatId    String   @unique
     userId    String?
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     messages  ChatMessage[]
   }

   model ChatMessage {
     id        String   @id @default(cuid())
     role      String   // "user" | "assistant"
     content   String
     conversationId String
     conversation ChatConversation @relation(fields: [conversationId], references: [id])
     createdAt DateTime @default(now())
   }
   ```

2. Implementar `loadChat(id)` y `saveChat({ chatId, messages })` usando Prisma
3. Agregar cleanup de conversaciones antiguas (ej: > 30 días)

