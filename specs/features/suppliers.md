🚦 Estado: 🟢 Completamente implementado (100%)

# Proveedores y Compras

## 1. Propósito / Alcance
Gestionar el registro de los proveedores de RPM y, eventualmente, las compras y reposiciones de stock asociadas a cada uno.

## 2. Casos de Uso Principales (Flujos de éxito)
- **Gestión de Proveedor**: ABM (Alta, Baja, Modificación) de proveedores (nombre, contacto, CUIT).
- **Vinculación a Productos**: Los productos pueden tener un proveedor principal para saber a quién reclamar garantías o reponer stock.
- **Actualización Masiva**: Permite utilizar el módulo de actualización de costos filtrando por un proveedor específico (ej. "Aumentó proveedor X un 10%").

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: No hay un módulo complejo de órdenes de compra (Purchase Orders) automatizadas con envío de correos.
- **RES-02**: No se lleva la cuenta corriente del proveedor (deuda de RPM hacia el proveedor) en la primera fase.

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1**: No se puede borrar un proveedor que tiene productos asociados en el catálogo activo.
- **Validación 1**: CUIT debe ser válido y único para evitar duplicidad de registros del mismo mayorista.

## 5. Dependencias Técnicas Clave
- **Tablas BD**: `Supplier`, `Product`
- **Servicios**: `supplierService.ts`
