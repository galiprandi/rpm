---
title: Dashboard de Administrador RPM - Especificación de UI/UX
version: 1.3
date_created: 2026-04-05
date_updated: 2026-04-25
owner: Equipo de Desarrollo
tags: [app, design, ui, dashboard, admin, rpm, caching, performance]
status: ✅ Implementado con optimizaciones de performance
---

# Dashboard de Administrador RPM

Esta especificación detalla el diseño, arquitectura y requerimientos del dashboard principal para administradores del sistema RPM Accesorios y Equipamiento.

## 1. Purpose & Scope

**Propósito:**
Proveer una vista unificada y accionable del estado operativo del negocio, permitiendo al administrador monitorear métricas críticas, identificar alertas que requieren atención inmediata, y tomar decisiones rápidas sin navegar múltiples pantallas.

**Alcance:**
- Panel principal único accesible desde `/adm` (reemplaza dashboard actual)
- 7 secciones de métricas clave (Ventas, Taller, Stock, Listos para Entrega, Arqueo de Caja, Movimientos de Caja, Movimientos de Productos)
- Componentes interactivos con acciones directas (click-to-call, navegación rápida)
- **Cache de 60 segundos** en dashboard data (`unstable_cache`)
- **Cache de 5 minutos** en cash status con invalidación automática
- **Polling de 30 segundos** en DashboardClient para reducir queries de auth
- Diseño responsive prioritario para desktop (admin trabaja en PC/tablet)
- Botón de "Venta Rápida" en header para acceso directo a ventas de mostrador

**Fuera de alcance (Fase 1):**
- Turnos Web (falta modelo WebAppointment en DB)
- Facturación AFIP (modelo Invoice implementado - integración AFIP pendiente)
- Edición de datos desde el dashboard (solo lectura + navegación)
- Gráficos complejos o analítica histórica profunda (van a reportes)
- Notificaciones push (solo badges visuales)

---

## 2. Definitions

| Término | Definición |
|---------|------------|
| **OT** | Orden de Trabajo (WorkOrder) |
| **READY** | Estado de OT: trabajo completado, listo para entregar al cliente |
| **MVP** | Minimum Viable Product - Producto Mínimo Viable |
| **Click-to-call** | Función donde clickear un icono de teléfono inicia llamada telefónica |
| **Stock crítico** | Productos con cantidad actual ≤ stock mínimo configurado |
| **Ticket promedio** | Monto medio de venta (total ventas / cantidad transacciones) |
| **Margen ponderado** | Promedio de márgenes de ganancia ponderado por volumen de venta |

---

## 3. Requirements, Constraints & Guidelines

### Requerimientos Funcionales

- **REQ-001**: El dashboard debe cargar en < 3 segundos
- **REQ-002**: Cada sección debe mostrar máximo 5 items (usar "Ver más" para el resto)
- **REQ-003**: Los números financieros deben usar formato ARS con separador de miles
- **REQ-004**: Fechas relativas ("Hace 2 horas") para eventos recientes (< 24h)
- **REQ-005**: Click en cualquier métrica debe navegar a la vista detallada correspondiente
- **REQ-006**: Badge de teléfono debe usar `tel:` protocol para click-to-call

### Requerimientos de Seguridad

- **SEC-001**: Solo usuarios con rol ADMIN o STAFF pueden acceder al dashboard
- **SEC-002**: No mostrar datos de clientes completos (solo nombre + patente/vehículo)
- **SEC-003**: Números de teléfono deben estar enmascarados parcialmente (XXX-XXX-1234)

### Constraints

- **CON-001**: No usar WebSockets - usar polling cada 30s con `unstable_cache` de 60s en dashboard y 5min en cash status
- **CON-002**: Máximo 6 secciones visibles simultáneamente (evitar scroll excesivo)
- **CON-003**: Colores semánticos fijos: Verde = OK, Amarillo = Atención, Rojo = Crítico
- **CON-004**: Iconos solo de Lucide React (consistente con design system)

### Guidelines

- **GUD-001**: Priorizar métricas accionables sobre informativas puras
- **GUD-002**: Usar emojis como indicadores visuales rápidos (🚗 🚙 🛻 🚚)
- **GUD-003**: Cada card debe responder a "¿Y qué hago con esto?"
- **GUD-004**: Layout en grid 3 columnas en desktop, 1 en mobile

---

## 4. Interfaces & Data Contracts

### Layout del Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Dashboard                           [Venta Rápida 🛒]│
├─────────────────────────────────────────────────────────────┤
│  [1] VENTAS HOY    │  [2] OTs ACTIVAS    │  [3] ALERTAS STOCK│
│  $485.000          │  8 (3→2→3)          │  5 productos 🔴   │
│  12 facturas       │  ↗ 2 nuevas         │  [Ver lista]      │
├─────────────────────────────────────────────────────────────┤
│  [4] TALLER (Kanban)         │  [5] LISTOS PARA ENTREGA      │
│  [Pend:3][Prog:2][List:3]   │  [6] ARQUEO DE CAJA            │
│                              │  Efectivo: $250.000            │
│                              │  Tarjeta: $180.000             │
│                              │  Transferencia: $55.000        │
├─────────────────────────────────────────────────────────────┤
│  [7] MOVIMIENTOS DE CAJA      │  [8] MOVIMIENTOS DE PRODUCTOS │
│  Ingreso Efectivo $500       │  Salida: 2x Polarizado         │
│  Egreso Tarjeta $200         │  Ajuste: +5 Limpia             │
│  Apertura Caja $100.000      │  Entrada: +10 LED              │
└─────────────────────────────────────────────────────────────┘
```

### API Endpoints Requeridos

```typescript
// GET /api/dashboard/summary
interface DashboardSummary {
  // Sección 1: Ventas (basado en work_orders completadas + direct_sales)
  sales: {
    today: {
      total: number;           // $485000 (sum de work_orders + direct_sales del día)
      workOrderCount: number;  // 12 (cantidad de work_orders completadas + direct_sales del día)
      vsYesterday: number;     // +15%
    };
    ticketAverage: number;      // $40416 (total / count)
  };

  // Sección 2: OTs
  workOrders: {
    active: {
      total: number;           // 8
      byStatus: {
        pending: number;       // 3 (CONFIRMED)
        inProgress: number;    // 2 (IN_PROGRESS)
        ready: number;         // 3 (READY)
      };
      newToday: number;        // 2
    };
  };

  // Sección 3: Stock
  stock: {
    lowStockCount: number;      // 5
    lowStockItems: Array<{
      id: string;
      name: string;
      stock: number;
      minStock: number;
    }>;
  };

  // Sección 5: Listos para entrega
  readyForDelivery: Array<{
    workOrderId: string;        // "1234"
    vehicle: {
      type: 'COMPACT' | 'SEDAN' | 'SUV' | 'PICKUP' | 'TRUCK';
      description: string;      // "Hilux 2022"
    };
    customer: {
      name: string;             // "Juan Pérez"
      phone: string;            // "+54 9 11 1234-5678" (enmascarado)
    };
    total: number;              // 85000
    completedAt: string;        // ISO date
    invoiceStatus: 'ISSUED' | 'PENDING';
  }>;

  // Sección 6: Arqueo de Caja por Método (basado en cash_movement)
  paymentsByMethod: Array<{
    code: string;               // "CASH"
    name: string;               // "Efectivo"
    total: number;              // 250000 (neto: ingresos - egresos)
  }>;

  // Sección 7: Movimientos de Caja (cash_movement)
  cashMovements: Array<{
    id: string;
    type: 'INCOME' | 'EXPENSE' | 'OPENING' | 'CLOSING';
    amount: number;
    method: string;             // "CASH"
    methodName: string;         // "Efectivo"
    referenceId?: string;
    referenceType?: string;
    reason?: string;
    createdAt: string;
    createdBy: string;
  }>;

  // Sección 8: Movimientos de Productos (stock_movement)
  recentMovements: Array<{
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    productName: string;
    quantity: number;
    reason: string;
    timestamp: string;
    userName: string;
  }>;

  // Meta
  generatedAt: string;          // ISO timestamp para freshness indicator
}
```

---

## 5. Acceptance Criteria

- **AC-001**: Given el dashboard carga, When el admin ve la sección de ventas, Then ve el monto total del día con formato ARS
- **AC-002**: Given hay OTs en estado READY, When el admin ve la lista, Then cada item muestra vehículo, cliente, monto y botón de llamada
- **AC-003**: Given el admin clickea el botón 📞, When el navegador soporta `tel:`, Then se abre la app de llamadas con el número
- **AC-004**: Given hay productos bajo stock mínimo, When el dashboard carga, Then muestra badge rojo con cantidad y enlace a lista
- **AC-005**: Given pasan 30 segundos, When el sistema ejecuta polling, Then los números se actualizan sin recargar la página
- **AC-006**: Given el usuario es STAFF (no ADMIN), When accede al dashboard, Then ve todas las secciones excepto alertas de configuración del sistema

---

## 6. Test Automation Strategy

- **Test Levels**: Unit tests para transformación de datos, E2E para flujo completo
- **Frameworks**: Playwright para E2E, Vitest para unit tests
- **Test Data**: Fixtures con datos de ejemplo (ventas, OTs, stock)
- **CI/CD**: Tests ejecutan en GitHub Actions antes de merge
- **Coverage**: Mínimo 80% de cobertura en lógica de dashboard

---

## 7. Rationale & Context

El dashboard busca resolver el problema de "¿cómo está el negocio ahora?" en una sola pantalla. La decisión de incluir "Listos para Entrega" con click-to-call prioriza la acción de cobro rápido, que es el principal flujo de ingresos del taller.

La ausencia de gráficos históricos es intencional: el admin puede acceder a reportes detallados desde el menú. El dashboard es para el "ahora" y las "acciones pendientes".

---

## 8. Dependencies & External Integrations

### External Systems
- **EXT-001**: Base de datos PostgreSQL - fuente de todas las métricas
- **EXT-002**: Prisma ORM - queries optimizadas con select/aggregations

### Data Dependencies
- **DAT-001**: WorkOrder - estado, totales, relación cliente/vehículo (fuente de ventas de taller)
- **DAT-002**: DirectSale - ventas rápidas de mostrador (fuente complementaria de ventas)
- **DAT-003**: Product - stock, stock mínimo
- **DAT-004**: Customer - nombre, teléfono (enmascarado)
- **DAT-005**: StockMovement - movimientos de productos (entradas, salidas, ajustes)
- **DAT-006**: CashMovement - movimientos de caja para arqueo (fuente de verdad para caja)
- **DAT-007**: PaymentMethod - mapeo de códigos a nombres de métodos de pago

---

## 9. Examples & Edge Cases

### Nota Importante: Fuente de Datos para Arqueo de Caja

**Decisión de Arquitectura:**
- El arqueo de caja (`paymentsByMethod` y `cashMovements`) se basa en la tabla `cash_movement` como fuente de verdad
- `cash_movement` se crea automáticamente cuando se registran pagos (tanto de work_orders como direct_sales)
- Esto permite trazabilidad completa de todos los movimientos de dinero, incluyendo apertura/cierre de caja
- Los pagos directos (`payment` y `direct_sale_payment`) son la fuente para crear los `cash_movement`, no para el dashboard

**Beneficios:**
- Unificación de todas las operaciones de caja en una sola tabla
- Facilita implementación futura de funcionalidad de arqueo de caja
- Permite registrar movimientos manuales (apertura, cierre, ajustes) fuera del contexto de ventas
- Historial completo de operaciones de caja por usuario

### Ejemplo: Card "Listos para Entrega"

```typescript
// Componente WorkOrderReadyCard
interface Props {
  workOrder: {
    id: string;
    vehicle: { type: VehicleType; description: string };
    customer: { name: string; phone: string };
    total: number;
  };
}

// Mapeo emoji según tipo de vehículo
const VEHICLE_EMOJIS: Record<VehicleType, string> = {
  COMPACT: '🚗',
  SEDAN: '🚙',
  SUV: '🚙',
  PICKUP: '🛻',
  TRUCK: '🚚',
};

// Teléfono enmascarado
function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1-XXXX-$2');
}
```

### Edge Case: Sin trabajos listos
- Mostrar mensaje: "No hay trabajos pendientes de entrega 🎉"
- Ocultar sección o mostrar placeholder positivo

### Edge Case: Sin conexión
- Mostrar últimos datos conocidos con indicador "Datos de hace X minutos"
- Badge gris con "Sin conexión - Reintentando..."

---

## 10. Performance & Caching Strategy

### Optimizaciones Implementadas

| Componente | Estrategia | Duración | Impacto |
|------------|-----------|----------|---------|
| Dashboard Page (`app/adm/page.tsx`) | `unstable_cache` | 60s | ~50% menos queries |
| Cash Status API (`/api/cash/status`) | `unstable_cache` + `revalidateTag` | 5min | ~90% menos queries caja |
| DashboardClient | Polling interval | 30s | ~90% menos queries auth |
| Dashboard Service | Aggregate queries | - | ~40% menos queries |

### Invalidación de Cache

- **Cash movements**: Cache se invalida automáticamente en `open`, `close`, `income`, `expense`
- **Dashboard**: Invalidación manual vía `revalidateTag('dashboard-data')`

### API de Query Stats

Endpoint `/api/admin/query-stats` expone métricas de queries para monitoreo.

## 11. Validation Criteria

- Dashboard carga sin errores de JavaScript
- Todos los números formateados correctamente en ARS
- Click-to-call funciona en dispositivos móviles
- Polling actualiza datos cada 30s sin parpadeo UI
- Responsive: 3 columnas en desktop, 1 en mobile
- Cumple CON-001: No usa WebSockets
- Cache reduce queries de dashboard en ~75%

---

## 11. Related Specifications / Further Reading

- [`ui-architecture-adm.md`](./ui-architecture-adm.md) - Arquitectura de UI Admin
- [`workshop.md`](./workshop.md) - Especificación del módulo Taller (OTs)
- [`inventory-sales.md`](./inventory-sales.md) - Especificación de Stock y Ventas
- [`components.md`](./components.md) - Sistema de componentes UI
