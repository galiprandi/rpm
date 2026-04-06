# AGENTS.md - Suppliers Domain

## Domain Overview

Catálogo de proveedores con información de contacto, datos de facturación y seguimiento de productos asociados. Esencial para gestión de compras y actualizaciones de costos.

## Related Specifications

- **@[specs/spec-mass-cost-update.md]** - Filtrado por proveedor para actualizaciones masivas de costos
- **@[specs/business-domain.md]** - Proveedores en modelo de negocio y flujo de compras
- **@[specs/checklist-crud-implementation.md]** - Estándares CRUD para catálogos (sin stats cards)
- **@[specs/product-importer.md]** - Importación de productos por proveedor

## Key Components

- `page.tsx` - CRUD principal con `CrudAdmin` (catálogo sin stats)
- `SupplierDialog` - Modal creación/edición
- `SupplierForm` - Formulario con contacto y datos de facturación

## Architecture

- **Tipo**: Catálogo (sin stats cards según checklist)
- **Campos**: nombre, contacto, teléfono, email, dirección, notas
- **Relaciones**: Products (productos por proveedor)
- **Componentes**: Separados en `/components/suppliers/` según regla de separación

## Development Notes

- Usa `CrudAdmin` sin stats cards (catálogo simple)
- Filtro clave en actualizaciones masivas de costos
- Información de contacto para gestión de compras
- Soporte para soft delete (`isActive`)
- Relación con productos para control de inventario
- Componentes específicos en directorio separado por entidad
