# AGENTS.md - Work Orders Domain

## Domain Overview

Gestión de órdenes de trabajo (OT) que documentan instalaciones y servicios. Flujo completo desde presupuesto hasta entrega con estados definidos y tracking de vehículos.

## Related Specifications

- **@[specs/workshop.md]** - Especificación principal de taller y flujos de trabajo
- **@[specs/business-domain.md]** - Entidad OT en modelo de negocio y flujo de estados
- **@[specs/spec-price-lists.md]** - Integración con listas de precios para cálculos

## Key Components

- `page.tsx` - Vista principal con kanban/list de OTs por estado
- `new/` - Flujo de creación de nueva orden
- `[id]/` - Vista detalle y gestión de OT específica

## Architecture

- **Estados**: CONFIRMED, WAITING, IN_PROGRESS, QC_CHECK, READY, PAID, DELIVERED
- **Relaciones**: Customer, Vehicle, Products, Services, Technician
- **Vista**: Kanban por estados (principal) y vista lista alternativa
- **Precios**: Cálculo dinámico desde listas de precios al momento de creación

## Development Notes

- Vista Kanban principal para gestión visual por estados
- Integración con selector de listas de precios en creación
- Tracking de vehículo y cliente asociados
- Soporte para asignación de técnicos y fechas programadas
- Cálculo de totales con productos y servicios
- Estados definidos según flujo de negocio del taller
