# AGENTS.md - Categories Domain

## Domain Overview

Catálogo de categorías de productos con márgenes por defecto, ordenamiento y colores para organización visual del inventario.

## Related Specifications

- **@[specs/checklist-crud-implementation.md]** - Estándares CRUD para catálogos (sin stats cards)
- **@[specs/business-domain.md]** - Líneas de negocio y márgenes típicos por categoría
- **@[specs/product-importer.md]** - Creación automática de categorías durante importación

## Key Components

- `page.tsx` - CRUD de categorías con `CrudAdmin`
- `CategoryDialog` - Modal creación/edición
- `CategoryForm` - Formulario con márgen y color

## Architecture

- **Tipo**: Catálogo (sin stats cards según checklist)
- **Campos**: nombre, descripción, márgen por defecto, color, orden
- **Relaciones**: Products (`categoryId` con cascade delete)
- **Ordenamiento**: Campo `sortOrder` para organización personalizada

## Development Notes

- Usa `CrudAdmin` sin stats cards (catálogo simple)
- Márgenes por defecto usados en cálculos de precios
- Colores para identificación visual en UI
- Soporte para soft delete (`isActive`)
- Importación masiva crea categorías automáticamente si no existen
