---
title: Sistema de Actualización Masiva de Costos
version: 1.0
date_created: 2026-04-04
owner: Equipo de Desarrollo
tags: [app, design, backend, ui, mass-update]
---

# Introduction

Esta especificación detalla el diseño, arquitectura y plan de implementación para el nuevo módulo de "Actualización Masiva de Costos". Este módulo permite a los administradores aplicar reglas matemáticas (porcentajes o montos fijos) de forma masiva al costo de reposición (`replacementCost`) de un grupo filtrado de productos, con una vista previa detallada antes de confirmar la operación.

**Rama de Feature:** `feature/mass-cost-update`
**Estado:** 🔴 Pendiente

## 1. Purpose & Scope

**Propósito:**
Proveer una herramienta eficiente y segura para actualizar los costos de reposición de múltiples productos a la vez, mitigando el riesgo de errores de carga y asegurando que las listas de precios dinámicas reflejen los aumentos de costos de los proveedores inmediatamente.

**Alcance:**
- Interfaz de filtrado avanzado de productos (por categoría, proveedor, búsqueda de texto).
- Interfaz para definir reglas de ajuste matemático (Aumentar/Disminuir por % o monto fijo).
- Vista previa de los cambios propuestos utilizando el componente `DataTable`, mostrando el costo actual, el nuevo costo calculado y el porcentaje de variación.
- Proceso de confirmación en dos pasos para aplicar los cambios a la base de datos.
- Registro de auditoría (Batch Update Log) para trazar quién, cuándo y cómo se actualizaron los costos.
- **Fuera de alcance:** Importación o exportación mediante archivos Excel/CSV.

## 2. Definitions

- **Costo de Reposición (`replacementCost`):** El valor actual de compra de un producto, sobre el cual se calculan los precios de venta en las Listas de Precios.
- **Regla de Ajuste:** La operación matemática a aplicar (ej. `+15%`, `-$10`).
- **Vista Previa (Preview):** Pantalla intermedia que calcula los resultados de la regla de ajuste en memoria, permitiendo al usuario validar los montos antes de persistirlos.
- **Lote de Actualización (Update Batch):** Registro de auditoría que agrupa todos los productos modificados en una sola operación masiva.

## 3. Requirements, Constraints & Guidelines

### Requerimientos Funcionales (REQ)
- **REQ-001 (Filtrado de Productos):** El sistema debe permitir al usuario seleccionar un conjunto de productos mediante filtros combinables: Proveedor (`supplierId`), Categoría (`categoryId`) y búsqueda por nombre/SKU.
- **REQ-002 (Configuración de Regla):** El usuario debe poder definir el tipo de ajuste: Aumento Porcentual, Disminución Porcentual, Aumento Fijo o Disminución Fija, y proveer el valor numérico correspondiente.
- **REQ-003 (Previsualización):** Antes de aplicar los cambios, se debe mostrar un `DataTable` con los productos afectados. Las columnas deben incluir: SKU, Nombre, Costo Actual, Nuevo Costo Calculado, y Variación (+/- %).
- **REQ-004 (Alertas Visuales en Preview):** El sistema debe resaltar en la tabla (ej. texto rojo o ícono de advertencia) aquellos productos cuyo salto de costo sea superior a un umbral de seguridad (ej. > 100% de aumento).
- **REQ-005 (Confirmación y Ejecución):** Al confirmar, el sistema debe actualizar el `replacementCost` de todos los productos del lote en una sola transacción de base de datos.
- **REQ-006 (Auditoría):** Se debe crear un registro en una nueva tabla `CostUpdateBatch` con el detalle de la operación (usuario, filtros usados, regla aplicada, cantidad de productos afectados).

### Constraints (Restricciones - CON)
- **CON-001 (Transaccionalidad):** La actualización masiva debe ser atómica (todas las filas se actualizan con éxito, o ninguna).
- **CON-002 (Rendimiento):** El cálculo de la vista previa debe ocurrir sin bloquear la UI principal, soportando previsualizaciones de hasta 5,000 ítems razonablemente rápido.

### Guidelines (Guías - GUD)
- **GUD-001 (Componentes UI):** Se debe reutilizar `DataTable` (`components/ui/data-table.tsx`) para la previsualización.

## 4. Interfaces & Data Contracts

### Prisma Schema Updates

```prisma
// Nuevo modelo para trazabilidad de actualizaciones masivas
model CostUpdateBatch {
  id             String   @id @default(uuid())
  userId         String   // ID o Email del usuario que ejecutó la acción
  userName       String?
  filtersApplied Json     // Ej: { supplierId: "uuid", categoryId: "uuid" }
  adjustmentType String   // "PERCENTAGE_INC", "PERCENTAGE_DEC", "FIXED_INC", "FIXED_DEC"
  adjustmentValue Decimal @db.Decimal(10, 2)
  itemsAffected  Int      // Cantidad de productos modificados
  createdAt      DateTime @default(now())

  @@index([createdAt])
  @@index([userId])
  @@map("cost_update_batch")
}
```

### API Payload Contract (Vista Previa / Confirmación)

```typescript
// Request para /api/cost-updates/preview
interface CostUpdatePreviewRequest {
  filters: {
    supplierId?: string;
    categoryId?: string;
    search?: string;
  };
  adjustment: {
    type: 'PERCENTAGE_INC' | 'PERCENTAGE_DEC' | 'FIXED_INC' | 'FIXED_DEC';
    value: number;
  };
}

// Response para la vista previa
interface CostUpdatePreviewResponse {
  items: Array<{
    id: string;
    sku: string;
    name: string;
    currentCost: number;
    newCost: number;
    variationPercent: number;
    warningFlag: boolean; // true si la variación es considerada riesgosa
  }>;
  totalItems: number;
}
```

## 5. Acceptance Criteria

- **AC-001:** Dado que un administrador selecciona el proveedor "Sony" y define un ajuste de +10%, Cuando solicita la previsualización, Entonces ve un `DataTable` con todos los productos de Sony y la columna de Nuevo Costo muestra el valor exacto incrementado en 10%.
- **AC-002:** Dado que un administrador aprueba una previsualización de 100 productos, Cuando hace clic en "Confirmar", Entonces el sistema actualiza los 100 productos en DB, crea 1 registro en `CostUpdateBatch`, y muestra un mensaje de éxito.
- **AC-003:** Dado un error en la actualización masiva de la DB (transacción fallida), Cuando se intenta aplicar el cambio, Entonces ningún producto es modificado y la UI muestra un error técnico amigable.

## 6. Test Automation Strategy

- **Unit Tests:** Validación exhaustiva del motor matemático que calcula los nuevos costos (rounding, precision decimal, casos negativos no permitidos).
- **Integration Tests:** Verificación del endpoint de confirmación (`POST /api/cost-updates/apply`) para asegurar que los productos se actualicen transaccionalmente y se genere el batch de auditoría correctamente.
- **Frameworks:** Jest/Vitest para backend logic y React Testing Library para el componente UI de simulación.

## 7. Rationale & Context

El enfoque de separar la visualización (Preview) de la ejecución brinda seguridad operativa ("fail-safe"). Obligar al usuario a revisar el `DataTable` antes de confirmar previene daños catastróficos a la base de datos (por ejemplo, agregar accidentalmente dos ceros de más a un porcentaje). No implementar la exportación/importación CSV en esta iteración agiliza la entrega de valor enfocándonos en el 80% de los casos de uso (aumentos generalizados de proveedores).

## 8. Dependencies & External Integrations

### Infrastructure Dependencies
- **INF-001**: `@/components/ui/data-table.tsx` - Requerido para la renderización de la previsualización.
- **INF-002**: `prisma` - Requerido para `$transaction` en las actualizaciones masivas y auditoría.

## 9. Examples & Edge Cases

### Cálculo de Ajuste con Advertencia
```typescript
// Producto A: Costo Actual = $1,000
// Regla: Aumento Fijo de $1,500
// Resultado: Nuevo Costo = $2,500. Variación = 150%.
// Como 150% > 100% (umbral), warningFlag = true. El DataTable lo muestra en rojo.
```

### Prevención de Costo Negativo
```typescript
// Producto B: Costo Actual = $50
// Regla: Disminución Fija de $100
// Resultado: Nuevo Costo = $0. (La UI de preview no debe permitir avanzar o el backend debe fallar la validación si el nuevo costo es < 0).
```

## 10. Validation Criteria

- La UI de selección de filtros debe cargar ágilmente listas de proveedores y categorías.
- La tabla de previsualización (`DataTable`) debe ser capaz de paginar o manejar la vista de una lista razonable de productos sin trabar el navegador.
- El log en `CostUpdateBatch` debe coincidir exactamente en cantidad de ítems afectados con la respuesta de la base de datos tras la transacción.

## 11. Related Specifications / Further Reading

- `@[specs/spec-price-lists.md]` - Define cómo los cambios de costo impactarán finalmente en los precios de venta dinámicos.
- `@[specs/ui-architecture-adm.md]` - Define la paleta de colores para botones y flujos de acción estándar.
