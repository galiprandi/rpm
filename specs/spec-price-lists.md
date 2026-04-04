---
title: Gestión de Listas de Precios y Costos
version: 1.0
date_created: 2026-04-04
date_implemented: 2026-04-04
owner: Equipo de Desarrollo
tags: [app, design, backend, ui]
status: ✅ Implementado
---

# Introducción

Esta especificación detalla el diseño, arquitectura y plan de implementación para el nuevo módulo de "Listas de Precios", reemplazando el esquema estático actual de precios fijos por un sistema dinámico basado en costos de reposición, márgenes de rentabilidad y reglas de redondeo inteligente.

**Rama de Feature:** `main`  
**Estado:** ✅ Implementado y Mergeado  
**Fecha Implementación:** 2026-04-04

## 1. Purpose & Scope (Propósito y Alcance)

**Propósito:**
Permitir a los administradores gestionar múltiples listas de precios dinámicas que calculen el precio final de venta en base al costo de reposición (`replacementCost`) y un margen esperado (`marginPercentage`), con soporte para reglas de redondeo automático y excepciones de precios por producto.

**Alcance:**
- Creación de interfaz CRUD para gestionar Listas de Precios usando `CrudAdmin`.
- Vista de detalle de la lista para gestionar excepciones (ítems específicos con porcentaje o monto fijo).
- Implementación de un Helper Agnóstico de Redondeo (RoundingHelper).
- Modificación del modelo de datos de `Product` para migrar de `salePrice` a `replacementCost`.
- Alertas visuales 🔴 de rentabilidad mínima.
- Adaptación de la API y UI existente que dependía de `salePrice`.

## 2. Definitions (Definiciones)

- **Costo de Reposición (`replacementCost`):** El costo actual de adquirir un producto del proveedor. Sobre este valor se calculan los márgenes de venta.
- **Lista de Precios:** Agrupación lógica de reglas de precios (margen base, regla de redondeo, vigencia) que se aplica a un conjunto de ítems.
- **Regla de Redondeo:** Estrategia aplicada al precio calculado para ajustarlo a valores comerciales aceptables (ej. terminar en .90, .99, o redondear a centenas).
- **Excepción de Precio (Ítem de Lista):** Sobrescritura del comportamiento por defecto de una lista para un producto o servicio específico, permitiendo fijar un porcentaje distinto o un precio exacto.

## 3. Requirements, Constraints & Guidelines (Requerimientos)

### Requerimientos Funcionales (REQ)
- **REQ-001 (CRUD Listas):** El sistema debe permitir listar, crear, editar y eliminar Listas de Precios (Soft delete lógico o hard delete en cascada de sus ítems).
- **REQ-002 (Campos de Lista):** Cada lista debe tener: nombre, activa (toggle), mostrar al público (toggle), fechas de vigencia (opcionales), porcentaje de margen base, y regla de redondeo.
- **REQ-003 (Excepciones):** Dentro de una lista, se debe poder agregar ítems específicos (productos/servicios) y definirles O BIEN un margen de porcentaje especial O BIEN un precio fijo exacto.
- **REQ-004 (Redondeo):** El cálculo de precio final debe pasar por una regla de redondeo, con "Decenas/Centenas Inteligentes" como regla por defecto. Las excepciones con precio fijo ignoran el redondeo.
- **REQ-005 (Alertas de Margen):** El sistema global debe tener un "margen mínimo" configurable. Si una excepción o precio calculado cae por debajo de este margen, la UI (en el detalle de la lista) debe mostrar una alerta roja 🔴.
- **REQ-006 (Migración de Modelo):** Se debe eliminar el campo `salePrice` de `Product` y reemplazarlo por `replacementCost`.

### Constraints (Restricciones - CON)
- **CON-001 (Delete de Lista):** Si se elimina una lista, se deben eliminar físicamente todos sus ítems asociados (excepciones) en cascada.
- **CON-002 (Cálculo Dinámico):** El precio de venta ya no se guarda en la base de datos del producto, sino que se calcula en tiempo de ejecución o en el momento de consulta, basado en la Lista de Precios activa aplicable.

## 4. Interfaces & Data Contracts (Interfaces y Modelo de Datos)

### Prisma Schema Updates

```prisma
// 1. Settings (o usar una tabla GlobalConfig)
model Setting {
  id        String   @id @default(uuid())
  key       String   @unique // ej: "MINIMUM_MARGIN_PERCENTAGE"
  value     String   // ej: "15.0"
  updatedAt DateTime @updatedAt
}

// 2. Product (Actualización)
model Product {
  // ... campos existentes
  costPrice       Decimal  @db.Decimal(10, 2)
  replacementCost Decimal  @db.Decimal(10, 2) // REEMPLAZA a salePrice
  // ... resto de campos
  priceListItems  PriceListItem[]
}

// 3. Nuevos Modelos
model PriceList {
  id                   String    @id @default(uuid())
  name                 String
  isPublic             Boolean   @default(false)
  isActive             Boolean   @default(true)
  startDate            DateTime?
  endDate              DateTime?
  baseMarginPercentage Decimal   @db.Decimal(5, 2)
  roundingRule         String    @default("SMART_HUNDREDS") // EXACT, NEAREST_INTEGER, PSYCHOLOGICAL, SMART_HUNDREDS
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  items                PriceListItem[]
}

model PriceListItem {
  id                       String    @id @default(uuid())
  priceListId              String
  priceList                PriceList @relation(fields: [priceListId], references: [id], onDelete: Cascade)
  
  // Relación Polimórfica o específica según el sistema actual (asumiendo products y services separados)
  productId                String?
  product                  Product?  @relation(fields: [productId], references: [id], onDelete: Cascade)
  // serviceId String? ...
  
  overrideMarginPercentage Decimal?  @db.Decimal(5, 2)
  fixedPrice               Decimal?  @db.Decimal(10, 2)
  
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt

  @@unique([priceListId, productId]) // Un producto no puede estar dos veces en la misma lista
}
```

### Cálculo de Precio Final

```typescript
function calculateFinalPrice(
  replacementCost: number, 
  baseMargin: number, 
  roundingRule: RoundingRule, 
  itemException?: PriceListItem
): number {
  if (itemException?.fixedPrice) {
    return itemException.fixedPrice;
  }
  
  const marginToApply = itemException?.overrideMarginPercentage ?? baseMargin;
  const rawPrice = replacementCost * (1 + (marginToApply / 100));
  
  return applyRounding(rawPrice, roundingRule);
}
```

## 5. Slices Accionables y DoD (Plan de Implementación)

### Slice 1: Core de Dominio y Base de Datos
- **Acción:** Actualizar esquema Prisma (crear `PriceList`, `PriceListItem`, `Setting`, modificar `Product`).
- **DoD:** Migración Prisma generada, cliente actualizado. Types generados correctamente.

### Slice 2: Helper de Redondeo (RoundingHelper)
- **Acción:** Crear archivo en `lib/utils/rounding.ts` con funciones puras para calcular redondeo.
- **DoD:** Todas las estrategias (`EXACT`, `NEAREST_INTEGER`, `PSYCHOLOGICAL`, `SMART_HUNDREDS`) implementadas. 100% de cobertura de Unit Tests en Jest/Vitest.

### Slice 3: Capa de Servicios y API (Listas)
- **Acción:** Implementar `priceListService.ts` (CRUD) y endpoints en `app/api/price-lists/route.ts` y `[id]/route.ts`.
- **DoD:** Endpoints funcionales para listar, crear, editar y eliminar listas. Delete en cascada funcionando.

### Slice 4: UI CRUD Admin de Listas
- **Acción:** Crear `/app/adm/price-lists/page.tsx` usando `CrudAdmin` y modales de creación/edición.
- **DoD:** Interfaz navegable desde el sidebar, permite crear/editar listas con validación.

### Slice 5: Vista de Detalle y Gestión de Ítems (Excepciones)
- **Acción:** Crear `/app/adm/price-lists/[id]/page.tsx`. Interfaz para buscar productos y agregarlos a la lista con porcentaje u opción de precio fijo.
- **DoD:** Tabla de ítems con validación de margen mínimo (alerta 🔴). Uso de `Header` component.

### Slice 6: Refactor de Referencias Existentes a `salePrice`
- **Acción:** Buscar y reemplazar en toda la API y UI el uso de `product.salePrice`.
- **DoD:** Las funciones de catálogo y órdenes de trabajo ahora calculan/piden el precio según la lista activa. El código compila sin errores TypeScript sobre `salePrice`.

## 6. Test Automation Strategy

- **Unit Tests:** Cobertura estricta para `RoundingHelper` verificando casos base y edge cases (decimales periódicos, números grandes, saltos de decena).
- **Integration Tests:** Pruebas del Service para asegurar el borrado en cascada (Cascade Delete) de los ítems al borrar la lista.
- **Refactor Tests:** Ajustar tests existentes de `Product` y `WorkOrder` que asumían un `salePrice` estático.

## 7. Rationale & Context

El enfoque de precios dinámicos evita la descapitalización en entornos inflacionarios o de costos volátiles. Mantener el costo de reposición separado del costo de compra realiza una división contable sana. La inclusión de un helper de redondeo garantiza que los precios sean atractivos comercialmente y evita cifras ilógicas como $1,234.33.

## 8. Dependencies & External Integrations

- `@/components/adm/CrudAdmin`: Para la vista de listado.
- `@/components/ui/UIProvider`: Para alertas y confirmaciones.
- `prisma`: Para la gestión de transacciones y schema.

## 9. Examples & Edge Cases

### Redondeo "Decenas/Centenas Inteligentes"
```typescript
// Costo Reposición: $12,345
// Margen: 40%
// Precio Bruto: $17,283

applyRounding(17283, 'SMART_HUNDREDS'); 
// Resultado Esperado: $17,290 o $17,300 dependiendo de la granularidad de la moneda local.
```

### Alerta de Margen
```typescript
// Costo Reposición: $1,000
// Precio Fijo seteado en Excepción: $1,050
// Margen Mínimo Global: 15%
// Margen Real: 5%
// Resultado en UI: Ítem renderizado con borde/badge 🔴 "Margen bajo: 5% (Mín: 15%)"
```

## 10. Validation Criteria

- El CRUD debe respetar los estándares definidos en `specs/checklist-crud-implementation.md`.
- El borrado de una lista debe fallar limpiamente o ejecutar un cascada perfecto sin dejar registros huérfanos.
- Ninguna vista existente debe romperse por la eliminación de `salePrice` (todas deben haber sido adaptadas o crear un fallback temporal de cálculo por defecto).

## 11. Documentar cambios necesarios (Refactorización)
- **APIs de Frontend:** Cualquier listado de productos que antes devolvía `product.salePrice` ahora deberá recibir un parámetro `priceListId` (o usar una lista por defecto/activa) y devolver el precio calculado.
- **Órdenes de Trabajo (WorkOrders):** Al agregar un producto a la orden de trabajo, se debe resolver el precio al momento de la adición utilizando la lógica de listas de precios, y guardar ese precio como `unitPrice` estático en el `WorkOrderItem`.
- **UI de Productos:** Eliminar la columna "Precio Venta" del CRUD de productos, o reemplazarla por una vista "Ver precios..." que abra un modal mostrando el valor del producto en las distintas listas activas.

## 12. Resumen de Implementación

### Fases Completadas ✅

| Fase | Descripción | Archivos Principales |
|------|-------------|---------------------|
| 1 | Schema Prisma + Seed | `schema.prisma`, `seed.ts` |
| 2 | RoundingHelper + Tests | `lib/utils/rounding.ts`, `rounding.test.ts` (29 tests) |
| 3 | Services + Tests | `settingsService.ts`, `priceListService.ts` (31 tests integración) |
| 4 | API Routes | `app/api/price-lists/**/*.ts` (5 rutas) |
| 5 | UI CRUD Admin | `app/adm/price-lists/page.tsx`, `PriceListDialog.tsx`, `PriceListForm.tsx` |
| 6 | UI Detalle + Excepciones | `app/adm/price-lists/[id]/page.tsx` |
| 7 | Refactor Productos | `ProductPricesModal.tsx`, modificado `products/page.tsx` |
| 8 | Refactor WorkOrders | Modificado `work-orders/new/page.tsx` con selector de lista |
| 9 | Testing | 60 tests pasaron, build exitoso |
| 10 | Documentación | Este spec actualizado |

### API Endpoints Creados

```
GET    /api/price-lists?includeInactive=true
POST   /api/price-lists
GET    /api/price-lists/:id
PUT    /api/price-lists/:id
DELETE /api/price-lists/:id
GET    /api/price-lists/:id/items
POST   /api/price-lists/:id/items
DELETE /api/price-lists/:id/items/:itemId
GET    /api/price-lists/:id/calculate-price?productId=xxx
GET    /api/settings                    # Obtener margen mínimo global
PUT    /api/settings                    # Actualizar margen mínimo global
```

### Componentes UI Creados

- `PriceListDialog.tsx` - Modal para crear/editar listas
- `PriceListForm.tsx` - Formulario de lista con campos: nombre, margen base, regla de redondeo, visibilidad, estado
- `ProductPricesModal.tsx` - Modal para ver precios calculados de un producto en todas las listas
- **Settings UI** - Sección "Listas de Precios" en `/adm/settings` para configurar el margen mínimo global

### Reglas de Redondeo Implementadas

- `EXACT` - Sin redondeo (2 decimales)
- `NEAREST_INTEGER` - Entero más cercano
- `PSYCHOLOGICAL` - Termina en .90 o .99
- `SMART_HUNDREDS` - Redondeo a decenas

### Características Implementadas

✅ CRUD completo de listas de precios  
✅ Gestión de excepciones (ítems con margen override o precio fijo)  
✅ Cálculo de precios desde costo de reposición + margen  
✅ Alertas visuales de margen bajo  
✅ Selector de lista de precios en órdenes de trabajo  
✅ Modal de precios en productos  
✅ Validaciones de unicidad de nombre  
✅ Soft delete (isActive) para listas  
✅ Tests unitarios 100% cobertura en rounding  
✅ Tests de integración para services  
✅ Build de Next.js exitoso
