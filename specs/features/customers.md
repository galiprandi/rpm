🚦 Estado: 🟢 Completamente implementado (100%)

# Clientes y Cuentas Corrientes

## 1. Propósito / Alcance
Gestionar la base de datos de clientes, sus vehículos asociados (para el taller) y sus cuentas corrientes (crédito y saldos a favor). Permite tener un registro histórico de ventas, pagos parciales y devoluciones por cliente.

## 2. Casos de Uso Principales (Flujos de éxito)
- **Gestión de Cliente**: ABM (Alta, Baja, Modificación) de un cliente con datos de contacto y datos fiscales (CUIT/DNI).
- **Vehículos**: Vincular uno o más vehículos a un cliente por número de patente para asociarlo a órdenes de trabajo.
- **Cuenta Corriente (Crédito)**: Vender a un cliente "a cuenta", generando una deuda. Registrar pagos parciales o totales de la deuda.
- **Saldos a favor**: Si un cliente devuelve un producto, el reintegro puede quedar como "saldo a favor" en su cuenta para futuras compras.

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: No emite resúmenes de tarjeta de crédito automáticos; es un registro contable simple de debe/haber.
- **RES-02**: Los clientes no tienen portal de autogestión para ver su estado de cuenta.

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1 - Limite de crédito**: Al intentar vender a crédito, el sistema puede alertar si el cliente tiene demasiada deuda acumulada.
- **Límite 2**: No se puede eliminar un cliente que tiene saldo pendiente o facturas asociadas.
- **Validación 1**: Los movimientos de saldo deben cuadrar siempre (sumatoria de débitos/créditos).

## 5. Dependencias Técnicas Clave
- **Tablas BD**: `Customer`, `Vehicle`, `CustomerBalanceMovement`
- **Servicios**: `customerService.ts`, `creditService.ts`
- **Dependencias**: Se integra fuertemente con ventas, facturación y caja.
