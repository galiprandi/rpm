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
- `CategoryForm` - Formulario con margen, color y estándares de accesibilidad (Form UX Enhancement Pattern).

## Architecture

- **Tipo**: Catálogo con integración de `Header` para acciones primarias.
- **Campos**: nombre, descripción, margen por defecto, color, orden.
- **Relaciones**: Products (`categoryId` con restricción si existen productos relacionados).
- **UX Pattern**: Acciones de tabla protegidas por `Tooltip`, estados de carga (`saving`) explícitos y protección contra doble-click. Implementa el Standardized List Row Entity Pattern.

## Development Notes

- Usa `Header` + `CrudAdmin` con `hideCreateAction={true}` para mantener consistencia visual.
- `loading.tsx` implementa un esqueleto de alta fidelidad para mitigar el layout shift.
- Márgenes por defecto usados en cálculos de precios.
- Colores para identificación visual en UI (ej: badges en tablas de productos).
- Soporte para soft delete (`isActive`).
- Los campos técnicos y financieros (Margen, Cantidad de Productos) utilizan `font-mono`.
