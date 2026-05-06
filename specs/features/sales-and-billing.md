🚦 Estado: 🟢 Completamente implementado (100%)

# Ventas, Facturación y Caja

## 1. Propósito / Alcance
Este módulo centraliza todas las operaciones de venta (mostrador), gestión de listas de precios, facturación electrónica con AFIP, arqueo de caja y emisión de notas de crédito. Su objetivo es asegurar la consistencia entre el movimiento de dinero, el control de stock y las obligaciones fiscales.

## 2. Casos de Uso Principales (Flujos de éxito)
- **Venta Rápida (Mostrador)**: Permite registrar una venta, descontar stock, generar la factura (AFIP) e ingresar el dinero a la caja o a la cuenta corriente del cliente.
- **Facturación Electrónica AFIP**: Integración para emitir comprobantes B (Consumidor Final) y A (Responsable Inscripto) utilizando `afip.js`.
- **Listas de Precios Dinámicas**: Permite definir márgenes sobre el costo de reposición (`replacementCost`) con reglas de redondeo, calculando el precio final automáticamente.
- **Arqueo de Caja**: Permite abrir y cerrar caja, registrar ingresos/egresos manuales y detectar diferencias físicas vs el sistema.
- **Devoluciones y Notas de Crédito**: Emite notas de crédito, restablece stock automáticamente y reintegra dinero (o genera saldo a favor del cliente).

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: No maneja contabilidad avanzada (asientos contables, libro diario).
- **RES-02**: No permite eliminar ventas o facturas una vez generadas; solo se pueden anular mediante Notas de Crédito.
- **RES-03**: No hay soporte offline; la facturación AFIP requiere conexión.

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1 - AFIP Caído**: Si AFIP falla, la venta se marca como pendiente de facturar pero el stock y la caja se actualizan.
- **Límite 2 - Diferencia de Caja**: Al cerrar, si el monto físico no coincide, se registra un movimiento de ajuste automático (ADJUSTMENT).
- **Límite 3 - Devolución Parcial**: Las notas de crédito pueden ser por el total o parciales (seleccionando ítems específicos).

## 5. Dependencias Técnicas Clave
- **Tablas BD**: `Sale`, `SaleItem`, `CashRegister`, `CashMovement`, `Invoice`, `CreditNote`, `PriceList`, `Product`
- **Servicios**: `afipService.ts` (integración externa), `cashManagementService.ts`, `salesService.ts`
- **Librería**: `afip.js` (comunicación con AFIP)
