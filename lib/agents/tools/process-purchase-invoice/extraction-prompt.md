Extraé todos los datos de esta factura de compra del proveedor.
Identificá con precisión:
- Proveedor: nombre completo y CUIT si está visible
- Tipo de factura: letra A, B o C
- Número de factura: punto de venta y número completo
- Fecha: en formato ISO (YYYY-MM-DD)
- Monto total: número sin símbolos
- Método de pago: si está visible (efectivo, transferencia, tarjeta, etc.)
- Items: cada producto con nombre/descripción, cantidad y precio unitario de costo

Si un campo no está visible o no se puede leer, dejalo como null.
Para los items, extraé TODOS los que veas en la factura.
