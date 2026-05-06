🚦 Estado: 🟢 Completamente implementado (100%)

# Gestión de Productos e Inventario

## 1. Propósito / Alcance
Control integral del catálogo de productos, inventario (stock) e imágenes. Permite la importación masiva de productos y actualizaciones masivas de costos, optimizando la gestión de grandes volúmenes de datos.

## 2. Casos de Uso Principales (Flujos de éxito)
- **Catálogo de Productos**: Mantenimiento de información de productos, marcas y categorías.
- **Importador de Productos**: Permite importar productos y actualizar stock/costos mediante archivos CSV o Excel.
- **Actualización Masiva de Costos**: Actualización en bloque de costos de reposición aplicando porcentajes de aumento por marca, categoría o proveedor.
- **Gestión de Imágenes**: Subida, compresión (WebP) y almacenamiento de imágenes de productos (en CDN/R2 o File System local).

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: No maneja múltiples almacenes/sucursales (solo hay un stock global por producto).
- **RES-02**: Las imágenes no se editan dentro del sistema (solo compresión y redimensionamiento automático).

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1 - Archivos Grandes**: El importador procesa archivos en lotes (chunks) para no bloquear la base de datos ni exceder los límites de memoria.
- **Límite 2 - Imágenes Duplicadas**: Al subir una nueva imagen principal, la anterior se elimina del storage para ahorrar espacio.
- **Validación 1**: La actualización masiva de costos genera un log/auditoría para que los administradores puedan rastrear quién cambió qué precio.

## 5. Dependencias Técnicas Clave
- **Tablas BD**: `Product`, `Category`, `Brand`, `Supplier`, `StockMovement`
- **Servicios**: `productImporterService.ts`, `imageUploadService.ts` (S3/Cloudflare R2 o Local)
- **Rutas API**: `/api/products/import`, `/api/products/mass-update`
