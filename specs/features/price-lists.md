🚦 Estado: 🟢 Implementado (listas basadas en otras listas + cálculo centralizado)

# Listas de Precios

## 1. Propósito / Alcance

Gestión de listas de precios dinámicas que calculan precios de venta desde un **origen de cálculo** (costo de reposición o el precio final de otra lista) + márgenes, con reglas de redondeo y excepciones por producto. Todos los precios del sistema (catálogo público, búsqueda de productos, detalle de lista, agent tools) se calculan con un único servicio centralizado para garantizar consistencia.

## 2. Modelo de Datos

### `price_list`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | text PK | UUID |
| `name` | text | Nombre único |
| `isPublic` | bool | Visible en sitio público |
| `isActive` | bool | Habilitada para cálculo |
| `baseMarginPercentage` | numeric(5,2) | Margen aplicado sobre el origen |
| `roundingRule` | text | EXACT / NEAREST_INTEGER / PSYCHOLOGICAL / SMART_HUNDREDS |
| `basePriceListId` | text nullable | **Origen de cálculo**. Null = costo de reposición. Si apunta a otra lista = precio final de esa lista. FK self-reference `ON DELETE SET NULL`. |
| `startDate` / `endDate` | timestamp | Vigencia |

### `price_list_item` (excepciones)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `priceListId` + `productId` | unique | Una excepción por producto por lista |
| `overrideMarginPercentage` | numeric(5,2) nullable | Margen específico (prioridad 2) |
| `fixedPrice` | numeric(10,2) nullable | Precio fijo (prioridad 1, sin redondeo) |

## 3. Algoritmo de Cálculo

### Origen de cálculo (resolución recursiva)

```
resolveBasePrice(product, list):
  if list.basePriceListId is null:
    return getProductBaseCost(product)  // replacementCost > 0 ? replacementCost : costPrice
  if list.basePriceListId in visited:
    throw CircularReferenceError
  visited.add(list.id)
  baseList = load(list.basePriceListId)
  return calculateListItemPrice(product, baseList, visited).finalPrice
```

### Precio final de un item

```
calculateListItemPrice(product, list):
  base = resolveBasePrice(product, list)
  exception = findException(list, product)
  if exception.fixedPrice != null:
    finalPrice = exception.fixedPrice  // sin redondeo
  else:
    margin = exception.overrideMarginPercentage ?? list.baseMarginPercentage
    finalPrice = applyRounding(base * (1 + margin/100), list.roundingRule)
  actualMargin = calculateMarginPercentage(getProductBaseCost(product), finalPrice)
  isBelowMinimum = actualMargin < minimumMargin
```

### Reglas clave

1. **Base = precio final de la lista padre** (post-redondeo + excepciones), no el precio sin redondear.
2. **`actualMargin` e `isBelowMinimum` siempre contra el costo real** del producto (`replacementCost`/`costPrice`), sin importar la cadena de listas. Así el alerta refleja "estás vendiendo bajo tu costo real".
3. **Profundidad sin límite** con detección de ciclos (A→B→A bloqueado).
4. **Prioridad de excepciones**: `fixedPrice` > `overrideMarginPercentage` > `baseMarginPercentage`.

## 4. Servicio Centralizado: `priceCalculationService`

**Única fuente de cálculo** del sistema. Todos los consumidores lo usan:

- `resolveBasePrice(productId, listId, ctx, visited)` — resuelve la cadena.
- `calculateListItemPrice(productId, listId)` — precio individual.
- `calculateBatchPrices(productIds, listIds)` — batch para search/catálogo.

### Cache (3 niveles)

1. **`PriceCalcContext` por request**: precarga batch de listas + excepciones + costos. Evita N queries por nivel de cadena.
2. **`unstable_cache` con tag `price-lists`**: catálogo público cacheado, invalidación inmediata.
3. **Revalidación en mutaciones**: `invalidatePriceLists()` en create/update/delete de listas e items. Tag global → mutar Contado invalida también Tarjetas.

## 5. Casos Límite

- **Ciclo (A→B→A)**: bloqueado en validación (create/update) y en runtime (`resolveBasePrice`).
- **Lista base borrada**: `ON DELETE SET NULL` → `basePriceListId` queda null → vuelve a calcular sobre costo.
- **Lista base inactiva**: se sigue usando como base (no se filtra por `isActive` en la resolución). `isActive` solo afecta qué listas se ofrecen al usuario, no la cadena de cálculo.
- **Producto sin costo**: `getProductBaseCost` devuelve 0 → precio final = 0 con margen aplicado.

## 6. Backward Compatibility

- `basePriceListId = null` por defecto → todas las listas existentes calculan igual que antes.
- Migración solo agrega columna nullable, no toca datos existentes.
- La unificación del cálculo en `priceCalculationService` preserva las reglas existentes (excepciones, redondeo, margen mínimo).

## 7. Dependencias Técnicas

- **Tablas**: `price_list`, `price_list_item`, `product`
- **Servicios**: `priceCalculationService.ts` (cálculo), `priceListService.ts` (CRUD), `publicCatalogService.ts` (catálogo público)
- **Utils**: `lib/utils/rounding.ts` (`calculateFinalPrice`, `applyRounding`, `calculateMarginPercentage`)
- **Cache**: `lib/cache.ts` (`CACHE_TAGS.PRICE_LISTS`, `invalidatePriceLists`)
- **Rutas API**: `/api/price-lists`, `/api/price-lists/[id]`, `/api/price-lists/[id]/calculate-prices-batch`, `/api/products-services/search`
