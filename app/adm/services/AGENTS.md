# AGENTS.md - Services Domain

## Domain Overview

Catálogo de servicios de instalación con costos base, tiempos estimados y factores por tipo de vehículo. Define el trabajo estándar que se realiza en órdenes de trabajo.

## Related Specifications

- **@[specs/business-domain.md]** - Entidad Servicio en modelo de negocio y flujo de instalación
- **@[specs/checklist-crud-implementation.md]** - Estándares CRUD para entidades importantes
- **@[specs/spec-price-lists.md]** - Soporte para excepciones de servicios en listas de precios

## Key Components

- `page.tsx` - CRUD principal con `CrudAdmin` y stats cards
- `ServiceDialog` - Modal creación/edición
- `ServiceForm` - Formulario con costo, tiempo y factor vehículo

## Architecture

- **Tipo**: Entidad importante (con stats cards según checklist)
- **Campos**: nombre, descripción, costo base, tiempo (minutos), factor vehículo
- **Relaciones**: WorkOrders (servicios utilizados)
- **Precios**: Dinámicos desde listas con posibles excepciones
- **Factores**: Multiplicador de costo/tiempo según tipo de vehículo

## Development Notes

- Usa `CrudAdmin` con stats cards (servicios, activos, tiempo promedio, costo promedio)
- Costo base como referencia para cálculos dinámicos de precios
- Tiempo estimado para planificación de trabajos
- Factor vehículo ajusta costo/dificultad por tipo (auto, SUV, camioneta)
- Integración con listas de precios para excepciones específicas
- Utilizado en órdenes de trabajo para definir trabajos a realizar
