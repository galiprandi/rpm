# AGENTS.md - Products Domain

## Domain Overview

Catálogo principal de productos con control de stock, costos dinámicos y precios calculados. Soporta importación masiva, movimientos y múltiples listas de precios.

## Related Specifications

- **@[specs/spec-price-lists.md]** - Precios dinámicos desde costo de reposición (migración de salePrice)
- **@[specs/product-importer.md]** - Importación masiva de productos con mapeo automático
- **@[specs/business-domain.md]** - Entidad Producto en modelo de negocio
- **@[specs/spec-mass-cost-update.md]** - Actualizaciones masivas de costos

## Key Components

- `page.tsx` - CRUD principal con stats cards y múltiples modales
- `import/` - Módulo completo de importación masiva
- `ProductDialog` - Modal creación/edición
- `ProductPricesModal` - Vista de precios en múltiples listas
- `ProductMovementsModal` - Historial de movimientos de stock

## Architecture

- **Tipo**: Entidad importante (con stats cards según checklist)
- **Campos**: SKU, nombre, stock, costPrice, replacementCost, categoría, proveedor
- **Relaciones**: Category, Supplier, PriceListItem (excepciones)
- **Precios**: Dinámicos desde listas, sin `salePrice` estático
- **Stock**: Control con mínimos y seguimiento de movimientos

## Development Notes

- Usa `loading.tsx` con esqueletos estructurales para mejorar el performance percibido.
- Refina `ProductForm` con iconos contextuales, campos monoespaciados (SKU/EAN) y `Select` de shadcn/ui.
- Usa `CrudAdmin` con stats cards (productos, categorías, proveedores, stock bajo).
- Precios calculados dinámicamente via `getProductBaseCost()`.
- Integración completa con módulo de importación masiva.
- Soporte para múltiples listas de precios por producto
- Control de stock con alertas de mínimos
- Historial de movimientos y ajustes
