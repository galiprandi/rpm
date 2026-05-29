🚦 Estado: 🟡 Parcialmente implementado (Fase 1-4 funcionales, corregidos bugs críticos de duplicados, paymentMethodId y eliminación de ítems)

# Comprobantes de Compra — Registro con Carga Ágil de Stock

## 1. Propósito / Alcance
Eliminar la fricción en la carga de facturas de proveedores. Un flujo lento provoca que el usuario postergue la carga, generando **stock fantasma** (mercadería física sin registrar en el sistema) y **pérdida de margen** cuando los costos de reposición suben pero los precios de venta no se actualizan a tiempo. Este módulo ofrece un flujo ágil y continuo que, al finalizar un comprobante, actualiza stock, costos de reposición y precios de venta en una sola operación atómica.

## 2. Casos de Uso Principales (Flujos de éxito)

### Fase 1 — Punto de Acceso e Historial
- **Acceso**: Desde el listado general de proveedores se habilita acceso directo a la sección centralizada de "Comprobantes de Compra" (`/adm/purchase-vouchers`).
- **Comportamiento**: Tabla con comprobantes registrados para consulta. Permite reanudar cargas en estado `DRAFT` o iniciar un "Nuevo Comprobante".

### Fase 2 — Inicialización y Cabecera ("El Pacto del Borrador")
- Al presionar "Nuevo Comprobante", el sistema solicita:
  - **Proveedor** (obligatorio): Selección de existente o creación rápida al vuelo.
  - **Letra** (obligatorio): Letra del comprobante fiscal (A, B, C, etc.).
  - **Número** (obligatorio): Número de la factura física.
  - **Fecha** (obligatorio): Fecha del comprobante físico.
  - **Monto Total** (obligatorio): Importe total declarado de la factura.
  - **Forma de Pago** (default: Cuenta Corriente): Selector del medio de pago utilizado. "Cuenta Corriente" no genera movimiento de caja.
  - **Notas** (opcional): Observaciones de texto libre.
- **Guardado manual**: El comprobante se persiste en estado `DRAFT` al presionar "Crear Borrador". No hay autoguardado pasivo; el usuario debe guardar explícitamente.

### Fase 3 — Carga Atómica de Productos (Modal Enfocado Continuo)
Una vez inicializada la cabecera, se habilita la carga de ítems **de a uno por vez** mediante un modal dedicado. Secuencia dentro del modal:

1. **Selección / Creación**: El usuario busca el producto. Si no existe, permite su alta rápida dentro del mismo flujo.
2. **Datos de Compra**: Se ingresa cantidad y costo unitario del comprobante.
3. **Proyección de Precios de Venta (Pre-cálculo)**: El sistema presenta inmediatamente los precios pre-calculados para cada lista de precios activa, respetando la jerarquía actual (rentabilidad de la lista o rentabilidad específica del producto, salvo que tenga precio fijo prioritario).
4. **Márgenes de Rentabilidad e Indicador de Alerta**: Se muestran los márgenes proyectados para cada lista. Si la rentabilidad queda por debajo de un margen mínimo preestablecido, el modal muestra una **alerta de baja rentabilidad** en la lista afectada.
5. **Confirmación y Reinicio Continuo**: Al confirmar el ítem, el avance se persiste en el borrador y el total acumulado se actualiza. El formulario del modal se reinicia vacío (producto, cantidad, costo y precios se limpian), pero el modal **permanece abierto** para cargar el siguiente producto. Solo se cierra cuando el usuario presiona explícitamente la (X).

### Fase 4 — Consolidación y Cierre Transaccional
Al presionar "Finalizar Carga", el sistema ejecuta una **operación atómica (transacción)** que realiza en un solo paso:

1. Cambia el estado del comprobante de `DRAFT` a `FINALIZED`.
2. **Incrementa el stock** real de los productos involucrados (un `stock_movement` tipo `PURCHASE_VOUCHER` por cada ítem con `previousStock` y `newStock`).
3. **Actualiza el costo de reposición** general (`replacementCost`) en el catálogo basado en los nuevos costos.
4. **Impacta los nuevos precios de venta** calculados en las listas de precios correspondientes.
5. **Movimiento de caja**: Genera un registro de `cash_movement` negativo por el monto total del comprobante (salvo forma de pago "Cuenta Corriente", que no genera movimiento).
6. Invalida caché de listados (`revalidatePath`).

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01 — Inmutabilidad post-cierre**: Un comprobante `FINALIZED` es estrictamente de solo lectura. No se puede editar ni volver a `DRAFT`.
- **RES-02 — Cero procesamiento de archivos**: No se contempla lectura de PDFs ni escaneo automático de facturas en esta etapa.
- **RES-03 — Sin cuenta corriente del proveedor**: No se gestiona la deuda de RPM hacia el proveedor como saldo pendiente.

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1 — Control de descuadre**: El sistema muestra el total acumulado de los ítems cargados vs. el Monto Total declarado en la cabecera. Si no coinciden al intentar finalizar, se **advierte al usuario** pero se **permite el cierre** si el administrador lo decide.
- **Límite 4 — Solo borradores editables**: No se pueden agregar ítems ni finalizar un comprobante que ya esté en estado `FINALIZED`.
- **Límite 5 — Fallo en transacción**: Si cualquier paso de la finalización falla (producto inexistente, método de pago inactivo), la transacción completa se revierte, manteniendo la integridad del stock, costos y caja.
- **Validación 1**: El método de pago, si se proporciona, debe existir y estar activo (`isActive: true`).
- **Validación 2**: Alerta visual de baja rentabilidad cuando el margen proyectado queda por debajo del mínimo preestablecido en alguna lista de precios.

## 5. Dependencias Técnicas Clave
- **Tablas BD**: `purchase_voucher`, `purchase_voucher_item`, `product`, `stock_movement`, `cash_movement`, `payment_method`, `supplier`, `price_list`
- **Servicios**: `purchaseVoucherService.ts` (`createDraftVoucher`, `addItemToVoucher`, `finalizeVoucher`, `getVoucherById`, `listVouchers`)
- **Rutas API**: `/api/purchase-vouchers` (GET, POST), `/api/purchase-vouchers/[id]` (GET, PATCH), `/api/purchase-vouchers/[id]/finalize` (POST)
- **Vistas UI**: `/adm/purchase-vouchers` (listado), `/adm/purchase-vouchers/create` (nuevo borrador), `/adm/purchase-vouchers/[id]` (detalle e ítems)
- **Componentes**: `PurchaseVouchersClient`, `CreateDraftVoucherDialog`, `AddVoucherItemDialog`, `VoucherPreviewDialog`, `QuickProductDialog`, `SupplierDialog`
