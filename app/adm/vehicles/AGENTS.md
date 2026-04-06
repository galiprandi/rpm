# AGENTS.md - Vehicles Domain

## Domain Overview

Gestión de vehículos de clientes con categorías flexibles que soportan tanto automotores como equipos especiales. Esencial para taller y órdenes de trabajo.

## Related Specifications

- **@[specs/workshop.md]** - Gestión de taller y flujos de vehículos
- **@[specs/business-domain.md]** - Entidad Vehículo en modelo de negocio y factores de cálculo
- **@[specs/ui-architecture.md]** - Sección /taller en web pública

## Key Components

- `new/page.tsx` - Formulario de alta de vehículo con categorías
- `[id]/page.tsx` - Vista detalle y edición del vehículo
- Formularios adaptativos según categoría (automotor vs equipo)

## Architecture

- **Categorías**: CAR, SUV, PICKUP, TRUCK, MOTORCYCLE, TRAILER, AUDIO_EQUIPMENT, ELECTRIC_SCOOTER, OTHER
- **Campos**: identificador (patente/N° serie), marca, modelo, año, cliente asociado
- **Relaciones**: Customer (dueño), WorkOrders (historial de servicios)
- **Factores**: Categoría afecta dificultad/tiempo en servicios

## Development Notes

- Formulario adaptable según tipo de vehículo
- Identificador único: patente para automotores, N° serie para equipos
- Integración con clientes (pre-selección desde URL params)
- Soporte para equipos no motorizados (audio, trailers, etc.)
- Vinculado con cálculos de costos de servicios por factor vehículo
- Historial de servicios a través de órdenes de trabajo
