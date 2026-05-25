# AGENTS.md - Categories Domain

## Domain Overview

Catálogo de categorías de productos con márgenes por defecto, ordenamiento y colores para organización visual del inventario.

## Related Specifications

- **@[specs/checklist-crud-implementation.md]** - Estándares CRUD para catálogos
- **@[specs/business-domain.md]** - Líneas de negocio y márgenes típicos por categoría
- **@[specs/product-importer.md]** - Creación automática de categorías durante importación

## Key Components

- `page.tsx` - CRUD de categorías con `CrudAdmin`
- `CategoryDialog` - Modal creación/edición utilizando `ModalBase`
- `CategoryForm` - Formulario con margen, color y estándares de accesibilidad

## Architecture

- **Tipo**: Catálogo con integración de `Header` para acciones primarias.
- **Campos**: nombre, descripción, margen por defecto, color, orden.
- **Relaciones**: Products (`categoryId` con restricción si existen productos relacionados).
- **UX Pattern**: Acciones de tabla protegidas por `Tooltip` y estados de carga (`saving`) explícitos.

## Development Notes

- Usa `Header` + `CrudAdmin` con `hideCreateAction={true}` para mantener consistencia visual.
- Márgenes por defecto usados en cálculos de precios.
- Colores para identificación visual en UI (ej: badges en tablas de productos).
- Soporte para soft delete (`isActive`).
