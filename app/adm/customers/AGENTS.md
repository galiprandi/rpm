# AGENTS.md - Customers Domain

## Domain Overview

Gestión de clientes con datos de contacto, facturación AFIP y vehículos asociados. Soporta múltiples vehículos por cliente y seguimiento de órdenes de trabajo.

## Related Specifications

- **@[specs/business-domain.md]** - Entidad Cliente en modelo de negocio y flujo de atención
- **@[specs/checklist-crud-implementation.md]** - Estándares CRUD para entidades importantes
- **@[specs/auth.md]** - Configuración de autenticación y acceso

## Key Components

- `page.tsx` - CRUD principal con `CrudAdmin` y stats cards
- `[id]/page.tsx` - Vista detalle del cliente
- `CustomerDialog` - Modal creación/edición
- `CustomerForm` - Formulario con datos fiscales AFIP

## Architecture

- **Tipo**: Entidad importante (con stats cards según checklist)
- **Campos**: nombre, teléfono, email, datos de facturación (CUIT, tipo factura)
- **Relaciones**: Vehicles (múltiples), WorkOrders (histórico)
- **Datos fiscales**: Soporte para CUIT y tipos de factura AFIP (A/B/M)

## Development Notes

- Usa `CrudAdmin` con stats cards (clientes, teléfonos, vehículos, OTs)
- Integración con datos de facturación AFIP
- Soporte para múltiples vehículos por cliente
- Navegación a detalle del cliente desde listado
- Seguimiento de órdenes de trabajo asociadas
