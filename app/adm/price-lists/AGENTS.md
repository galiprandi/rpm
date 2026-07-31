# AGENTS.md - Price Lists Domain

## Domain Overview

Gestión de listas de precios dinámicas que calculan precios de venta desde costo de reposición + márgenes, con reglas de redondeo y excepciones por producto.

## Related Specifications

- **@[specs/spec-price-lists.md]** - Especificación principal del módulo (implementado ✅)
- **@[specs/spec-mass-cost-update.md]** - Actualizaciones masivas de costos integradas
- **@[specs/checklist-crud-implementation.md]** - Estándares CRUD implementados

## Key Components

- `page.tsx` - CRUD principal con `CrudAdmin`
- `[id]/page.tsx` - Vista de detalle para gestionar excepciones
- `PriceListDialog` - Modal creación/edición
- `CostUpdateDialog` - Actualización masiva de costos

## Architecture

- **Costo base**: `getProductBaseCost()` usa `replacementCost` → `costPrice`
- **Cálculo precio**: Centralizado en `lib/services/priceCalculationService.ts`
  - `calculateBatchPrices(productIds, listIds)` — batch con `PriceCalcContext` (cache en memoria)
  - Resuelve cadena `basePriceListId` recursivamente (sin límite de profundidad, con detección de ciclos)
  - Cuando una lista tiene `basePriceListId`, el precio final de la lista base se usa como costo base
  - `isBelowMinimum` / `actualMargin` siempre contra el costo real del producto (no contra el precio base)
- **Excepciones**: Ítems con margen override o precio fijo (prioridad: fixedPrice > overrideMargin > baseMargin)
- **Alertas**: 🔴 para márgenes por debajo del mínimo global
- **Cache**: `unstable_cache` con tag `price-lists` en `publicCatalogService`; `invalidatePriceLists()` en todas las mutaciones

## Development Notes

- Usa `CrudAdmin` para listado estándar
- Integración con `CostUpdateDialog` para actualizar costos masivamente
- Precios se calculan dinámicamente, no se guardan en BD
- Soporte para 4 reglas de redondeo: EXACT, NEAREST_INTEGER, PSYCHOLOGICAL, SMART_HUNDREDS
