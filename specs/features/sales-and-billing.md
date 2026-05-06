🚦 Estado: 🟡 Parcialmente implementado (Facturación AFIP pendiente)

# Ventas, Facturación y Caja

## 1. Propósito / Alcance
Este módulo centraliza todas las operaciones de venta (mostrador), gestión de listas de precios, facturación electrónica, arqueo de caja y emisión de notas de crédito. Su objetivo es asegurar la consistencia entre el movimiento de dinero, el control de stock y las obligaciones fiscales.

## 2. Casos de Uso Principales (Flujos de éxito)
- **Venta Rápida (Mostrador)**: Permite registrar una venta, descontar stock, generar la factura e ingresar el dinero a la caja o a la cuenta corriente del cliente.
- **Facturación Electrónica (Estructura)**: Base de datos preparada para registrar CAE y datos de AFIP.
- **Listas de Precios Dinámicas**: Permite definir márgenes sobre el costo de reposición (`replacementCost`) con reglas de redondeo, calculando el precio final automáticamente.
- **Arqueo de Caja**: Permite abrir y cerrar caja, registrar ingresos/egresos manuales y detectar diferencias físicas vs el sistema.
- **Devoluciones y Notas de Crédito**: Emite notas de crédito, restablece stock automáticamente y reintegra dinero (o genera saldo a favor del cliente).

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: No maneja contabilidad avanzada (asientos contables, libro diario).
- **RES-02**: No permite eliminar ventas o facturas una vez generadas; solo se pueden anular mediante Notas de Crédito.
- **RES-03**: La integración real con los Web Services de AFIP está en fase de planificación (pendientes certificados y librería `afip.js`).

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1 - Fallo en Venta**: Si una venta falla en mitad del proceso, se debe asegurar mediante transacciones que el stock no quede descontado erróneamente.
- **Límite 2 - Diferencia de Caja**: Al cerrar, si el monto físico no coincide, se registra un movimiento de ajuste automático (ADJUSTMENT).
- **Límite 3 - Devolución Parcial**: Las notas de crédito pueden ser por el total o parciales (seleccionando ítems específicos).

## 5. Dependencias Técnicas Clave
- **Tablas BD**: `direct_sale`, `direct_sale_item`, `cash_movement`, `invoice`, `credit_note`, `price_list`, `product`
- **Servicios**: `directSaleService.ts`, `invoiceService.ts`, `creditNoteService.ts`, `cashMovementService.ts`, `priceListService.ts`
- **Rutas API**: `/api/direct-sales`, `/api/cash`, `/api/invoices`, `/api/credit-notes`
