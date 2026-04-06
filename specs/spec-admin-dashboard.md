---
title: Dashboard de Administrador RPM - Especificación de UI/UX
version: 1.1
date_created: 2026-04-05
date_updated: 2026-04-06
owner: Equipo de Desarrollo
tags: [app, design, ui, dashboard, admin, rpm]
status: � En implementación (feature branch)
---

# Dashboard de Administrador RPM

Esta especificación detalla el diseño, arquitectura y requerimientos del dashboard principal para administradores del sistema RPM Accesorios y Equipamiento.

## 1. Purpose & Scope

**Propósito:**
Proveer una vista unificada y accionable del estado operativo del negocio, permitiendo al administrador monitorear métricas críticas, identificar alertas que requieren atención inmediata, y tomar decisiones rápidas sin navegar múltiples pantallas.

**Alcance:**
- Panel principal único accesible desde `/adm` (reemplaza dashboard actual)
- 5 secciones de métricas clave (Ventas, Taller, Stock, Listos para Entrega, Movimientos)
- Componentes interactivos con acciones directas (click-to-call, navegación rápida)
- Actualización en tiempo real o caché breve (5 min máximo)
- Diseño responsive prioritario para desktop (admin trabaja en PC/tablet)

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

- **CON-001**: No usar WebSockets - usar polling cada 60s o SWR con revalidate
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
│  [1] VENTAS HOY    │  [2] OTs ACTIVAS    │  [3] ALERTAS STOCK│
│  $485.000          │  8 (3→2→3)          │  5 productos 🔴   │
│  12 facturas       │  ↗ 2 nuevas         │  [Ver lista]      │
├─────────────────────────────────────────────────────────────┤
│  [4] TALLER (Kanban)         │  [5] LISTOS PARA ENTREGA      │
│  [Pend:3][Prog:2][List:3]   │                                │
│                              │  🚗 Hilux - Juan Pérez         │
│                              │     #1234 · $85.000 · 📞       │
│                              │  🚙 Ranger - María Gómez       │
│                              │     #1235 · $120.000 · 📞      │
├─────────────────────────────────────────────────────────────┤
│  [6] MOVIMIENTOS RECIENTES                                   │
│  - Salida: 2x Polarizado     │                                 │
│  - Ajuste: +5 Limpia         │                                 │
│  - Entrada: +10 LED          │                                 │
└─────────────────────────────────────────────────────────────┘
```

### API Endpoints Requeridos

```typescript
// GET /api/dashboard/summary
interface DashboardSummary {
  // Sección 1: Ventas (basado en work_orders completadas)
  sales: {
    today: {
      total: number;           // $485000 (sum de work_orders completadas hoy)
      workOrderCount: number;  // 12 (cantidad de work_orders completadas hoy)
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

  // Sección 6: Movimientos
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
- **AC-005**: Given pasan 60 segundos, When el sistema ejecuta polling, Then los números se actualizan sin recargar la página
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
- **DAT-001**: WorkOrder - estado, totales, relación cliente/vehículo (fuente de ventas)
- **DAT-002**: Product - stock, stock mínimo
- **DAT-003**: Customer - nombre, teléfono (enmascarado)
- **DAT-004**: StockMovement - últimos 5 movimientos

---

## 9. Examples & Edge Cases

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

## 10. Validation Criteria

- Dashboard carga sin errores de JavaScript
- Todos los números formateados correctamente en ARS
- Click-to-call funciona en dispositivos móviles
- Polling actualiza datos cada 60s sin parpadeo UI
- Responsive: 3 columnas en desktop, 1 en mobile
- Cumple CON-001: No usa WebSockets

---

## 11. Related Specifications / Further Reading

- [`ui-architecture-adm.md`](./ui-architecture-adm.md) - Arquitectura de UI Admin
- [`workshop.md`](./workshop.md) - Especificación del módulo Taller (OTs)
- [`inventory-sales.md`](./inventory-sales.md) - Especificación de Stock y Ventas
- [`components.md`](./components.md) - Sistema de componentes UI
