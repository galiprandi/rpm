# Service: `searchService`

> **Estado**: ✅ Implementado  
> **Fase**: Fase 2 - Bot Ger Core Services  
> **Tipo**: Servicio interno (no es tool visible para el modelo)

---

## Propósito

Servicio de búsqueda de productos con lógica fuzzy avanzada, utilizado internamente por `get_product` cuando la búsqueda exacta no devuelve suficientes resultados. El servicio tiene su propio parser para formatear resultados según el rol del usuario.

---

## Responsabilidad Única

- Búsqueda fuzzy avanzada de productos
- Filtrado de resultados según rol
- Formateo a Markdown con parser propio
- No es visible para el modelo LLM (solo usado por `get_product`)

---

## Interfaz

```typescript
interface SearchServiceInput {
  query: string;           // Query de búsqueda
  role: UserRole;          // Rol del usuario (para filtrado)
  context?: BotContext;    // Contexto opcional
}

interface SearchResult {
  products: Partial<Product>[];
  total: number;
  searchType: 'exact' | 'category' | 'none';
}

async function searchProducts(
  input: SearchServiceInput
): Promise<string>; // Devuelve Markdown formateado
```

---

## Estrategia de Búsqueda

### 1. Búsqueda Exacta (name/barcode/SKC)

Búsqueda fuzzy básica en múltiples campos:

| Campo | Lógica |
|-------|--------|
| `name` | `contains` + `mode: insensitive` |
| `barcode` | `contains` + `mode: insensitive` |
| `sku` | `contains` + `mode: insensitive` |

**Límite**: 10 productos

### 2. Búsqueda por Categoría

Si exact search devuelve 0 resultados:
- Buscar productos en categorías que coincidan con la query
- Devolver hasta 10 productos de la categoría

### 3. Sin Resultados

Si exact + categoría no dan resultados:
- Devolver resultado vacío con `searchType: 'none'`
- El parser muestra mensaje de sugerencias

---

## Límites de Resultados

| Tipo de Búsqueda | Máximo Resultados |
|------------------|-------------------|
| Exact search | 10 |
| Por categoría | 10 |

---

## Parser: `searchResultsToMarkdown()`

### Responsabilidades

1. Recibe `SearchResult` + `UserRole`
2. Filtra campos según rol (igual que `productToMarkdown`)
3. Formatea a Markdown con template específico para listas
4. Indica tipo de búsqueda realizada

### Template

```markdown
## 🔍 Resultados de búsqueda: "{query}"

Encontré {total} productos:

1. {product.name} - {product.stock}un - ${product.replacementCost}
2. {product.name} - {product.stock}un - ${product.replacementCost}
...

---
💡 **Tip**: Si no encontrás lo que buscás, probá con:
- El nombre exacto del producto
- Código de barras o SKU
- Términos más generales
```

---

## Tests Obligatorios

```typescript
// searchService.test.ts
describe('searchService', () => {
  it('performs exact search and returns relevant results', () => {
    // Buscar "aceite" → devuelve productos con "aceite" en nombre/barcode/SKC
  });

  it('filters results by role', () => {
    // ADMIN ve costPrice, SELLER no
  });

  it('falls back to category search when exact returns 0 results', () => {
    // Exact devuelve 0 resultado → busca por categoría
  });

  it('returns empty result with none type when no products found', () => {
    // Exact + categoría = 0 → devuelve searchType: 'none'
  });

  it('formats results correctly in compact Markdown', () => {
    // Verificar formato: "1. Name - Xun - $XX.XX"
  });
});
```

---

## Integración con get_product

```typescript
// lib/bot/tools/get-product/index.ts
import { searchService } from '@/lib/services/searchService';

export const getProductTool = tool({
  description: loadToolDescription('get-product'),
  inputSchema: z.object({
    query: z.string().describe('EAN, SKU or product name to search for'),
  }),
  execute: async ({ query, context }: GetProductInput) => {
    const role = context?.role || 'STAFF';

    // Singularizar y normalizar query
    const singularQuery = query
      .replace(/es$/, '')
      .replace(/s$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Búsqueda exacta
    const exactResult = await getProducts({ search: singularQuery, isActive: true });

    // Detectar si es SKU
    const isSku = exactResult.products.some(p => p.sku === singularQuery);

    if (isSku) {
      // SKU con resultados → devolver tal cual
      return productToMarkdown(exactResult.products, role, context);
    }

    // Query genérica
    if (exactResult.products.length > 0) {
      // Resultados encontrados → devolver tal cual
      return productToMarkdown(exactResult.products, role, context);
    }

    // 0 resultados → invocar searchService (fuzzy más amplio)
    return await searchService({
      query: singularQuery,
      role,
      context,
    });
  },
});
```

---

## Diferencias con productService.getProducts

| Aspecto | productService.getProducts | searchService |
|---------|----------------------------|---------------|
| Búsqueda | Fuzzy básica (name/SKC/barcode) | Exact + categoría (sin "all products") |
| Límite | Sin límite (usado por UI) | 10 (para chat) |
| Parser | Ninguno (devuelve objetos) | Markdown compacto |
| Rol | No filtra | Filtra por rol |
| Uso | UI admin/dashboard | Bot get_product (interno) |

---

## Notas de Implementación

**Decisión arquitectónica**: 
- Se removió el fallback "all products" para evitar resultados irrelevantes
- Se cambió de "fuzzy search" a "exact search" (contains en name/barcode/SKC) según feedback del usuario
- El formato de salida se simplificó a compacto: "1. Name - Xun - $XX.XX"
- La singularización y normalización de queries se implementó en get_product, no en searchService

**Razón**: El usuario solicitó que la búsqueda sea más precisa (debe contener la palabra buscada) y que no se muestren demasiados resultados irrelevantes.

---

## Historial de Cambios

| Fecha | Versión | Cambio | Autor |
|-------|---------|--------|-------|
| 2026-04-17 | 1.0 | Definición inicial | User |
| 2026-04-17 | 1.1 | Implementación completa con exact search + category fallback | User |
| 2026-04-17 | 1.2 | Removido "all products" fallback según feedback | User |
| 2026-04-17 | 1.3 | Cambiado formato a compacto según feedback | User |
