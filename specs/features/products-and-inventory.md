🚦 Estado: 🟢 Completamente implementado (100%)

# Gestión de Productos e Inventario

## 1. Propósito / Alcance
Control integral del catálogo de productos, inventario (stock) e imágenes. Permite la importación masiva de productos y actualizaciones masivas de costos, optimizando la gestión de grandes volúmenes de datos.

## 2. Casos de Uso Principales (Flujos de éxito)
- **Catálogo de Productos**: Mantenimiento de información de productos, marcas y categorías.
- **Importador de Productos**: Permite importar productos y actualizar stock/costos mediante archivos CSV o Excel (procesamiento vía API).
- **Actualización Masiva de Costos**: Actualización en bloque de costos de reposición aplicando porcentajes de aumento por marca, categoría o proveedor.
- **Gestión de Imágenes**: Subida y almacenamiento de imágenes de productos (vía GitHub CDN Service o local).

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: No maneja múltiples almacenes/sucursales (solo hay un stock global por producto).
- **RES-02**: Las imágenes no se editan dentro del sistema (solo redimensionamiento automático en algunos casos).

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1 - Archivos Grandes**: El importador procesa archivos en lotes para no bloquear la base de datos.
- **Límite 2 - Auditoría de Costos**: Cada actualización masiva queda registrada en la tabla `cost_update_batch` para trazabilidad.
- **Validación 1**: Los movimientos de stock son inmutables y siempre generan un registro en `stock_movement`.
- **Auditoría**: Soporta auditorías de stock mediante el [Conteo Cíclico Inteligente](./cyclic-count.md).

## 5. Dependencias Técnicas Clave
- **Tablas BD**: `product`, `category`, `supplier`, `stock_movement`, `cost_update_batch`
- **Servicios**: `productService.ts`, `costUpdateService.ts`, `githubCdnService.ts`
- **Rutas API**: `/api/import/products`, `/api/cost-updates`, `/api/products`
