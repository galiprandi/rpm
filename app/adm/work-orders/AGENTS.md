# AGENTS.md - Work Orders Domain

## Domain Overview

Gestión de órdenes de trabajo (OT) que documentan instalaciones y servicios. Flujo completo desde presupuesto hasta entrega con estados definidos, tracking de vehículos y sistema de pagos múltiples.

## Related Specifications

- **@[specs/workshop.md]** - Especificación principal de taller y flujos de trabajo
- **@[specs/business-domain.md]** - Entidad OT en modelo de negocio y flujo de estados
- **@[specs/spec-price-lists.md]** - Integración con listas de precios para cálculos

## Key Components

- `page.tsx` - Vista principal con kanban/list de OTs por estado
- `new/` - Flujo de creación de nueva orden
- `[id]/` - Vista detalle y gestión de OT específica con sección de pagos
- `PaymentDialog.tsx` - Componente para registrar pagos
- `FuelLevelSlider.tsx` - Componente reusable para Slider de nivel de combustible

## Services
- `auditService.ts` - Sistema de auditoría para registrar cambios en OTs

## Architecture

### Estados (Kanban - 6 columnas)
- **CONFIRMED** - OT confirmada/agendada
- **WAITING** - En espera en taller
- **IN_PROGRESS** - En proceso de trabajo
- **QC_CHECK** - Control de calidad
- **READY** - Listo para retiro
- **DELIVERED** - Entregada al cliente

> **Nota**: El estado PAID ya no existe como columna Kanban. El estado de pago se muestra mediante código de colores en el importe de cada tarjeta.

### Sistema de Pagos

**Modelos:**
- `PaymentMethod` - Métodos de pago configurables (Efectivo, Transferencia, QR, etc.)
- `Payment` - Pagos individuales asociados a una OT

**Características:**
- Múltiples pagos por OT (pagos parciales)
- Código de colores en importe: Verde (pagado), Amarillo (parcial), Gris (sin pagar)
- CRUD de métodos de pago en `/adm/payment-methods` (solo ADMIN)
- Registro de pagos desde vista detalle de OT

### Relaciones
- Customer, Vehicle, Products, Services, Technician
- Payment (nuevo) - Pagos asociados a la OT

### Vistas
- **Kanban**: Visualización por estados con código de colores en importe
- **Lista**: Vista alternativa con filtros
- **Detalle**: Información completa + sección de pagos + registro de pagos
  - Edición de kilometraje y combustible en checklists
  - Edición de fecha agendada y notas

## Development Notes

- Vista Kanban principal para gestión visual por estados (6 columnas)
- Código de colores en importe calculado desde los pagos registrados
- Integración con selector de listas de precios en creación
- Tracking de vehículo y cliente asociados
- Soporte para asignación de técnicos y fechas programadas
- Cálculo de totales con productos y servicios
- Sistema de pagos múltiples con métodos de pago configurables
- Estados definidos según flujo de negocio del taller (sin estado PAID)
