# Navigation Paths

> Documento auto-generado con paths aprendidos durante sesiones de debugging con Playwright MCP.

---

## Admin Routes Map

### Sidebar principal (`AppSidebar`)
Acceso directo desde el menú lateral:

| Ruta | Nombre en sidebar | Tipo |
|------|-------------------|------|
| `/adm` | Dashboard | Listado |
| `/adm/customers` | Clientes | Listado |
| `/adm/work-orders` | Órdenes de Trabajo | Kanban + Lista |
| `/adm/products` | Productos | Listado |
| `/adm/services` | Servicios | Listado |
| `/adm/categories` | Categorías | Listado |
| `/adm/price-lists` | Precios | Listado |
| `/adm/cash` | Arqueo de Caja | Dashboard |
| `/adm/reports/debtors` | Deudores | Reporte |
| `/adm/suppliers` | Proveedores | Listado |
| `/adm/users` | Usuarios | Listado |

### Footer del sidebar
| Ruta | Nombre |
|------|--------|
| `/adm/settings` | Configuración |
| `/adm/novedades` | Novedades |

### Acceso indirecto (links desde otras vistas)
| Ruta | Se accede desde... |
|------|-------------------|
| `/adm/credit-notes` | Detalle de cliente (`secondaryActions` en `Header`) |
| `/adm/purchase-vouchers` | Botón "Comprobantes" en header de `/adm/suppliers` |
| `/adm/payment-methods` | Link "Métodos de Pago" dentro de `/adm/settings` |
| `/adm/operations` | Links "Ver operaciones" en Dashboard (`CashMovementsCard`) |

### Rutas de detalle (desde listados)
| Ruta de detalle | Se accede desde... |
|-----------------|-------------------|
| `/adm/customers/[id]` | Botón ojo en tabla de `/adm/customers` |
| `/adm/work-orders/[id]` | Click en tarjeta del Kanban o lista |
| `/adm/vehicles/[id]` | Links de patente en tabla de clientes |
| `/adm/price-lists/[id]` | Click en nombre de lista en `/adm/price-lists` |
| `/adm/purchase-vouchers/[id]` | Botón ojo en tabla de `/adm/purchase-vouchers` |
| `/adm/work-orders/new` | Botón "Nueva OT" en header de `/adm/work-orders` |

---

## Purchase Vouchers (Comprobantes de Compra)

### Listado
1. Navigate to `/adm/purchase-vouchers`
2. Esperar a que cargue la tabla con columnas: Proveedor, Comprobante, Fecha, Estado, Monto Total, Completado, Acciones
3. Stats en header: Borradores, Finalizados, Total Acumulado

### Crear nuevo comprobante
1. Desde listado, click `button[data-testid="create-voucher"]` (o text "Nuevo Comprobante")
2. Se abre dialog "Nuevo Comprobante de Compra"
3. Completar: Proveedor (combobox), Forma de Pago, Letra, Número de Factura, Fecha, Monto Total, Notas
4. Click "Crear Borrador"
5. Se abre automáticamente dialog "Cargar Productos"

### Agregar producto a comprobante
1. En dialog "Cargar Productos", usar textbox de búsqueda (placeholder: "Buscar: led+cronos...")
2. Escribir nombre de producto, esperar resultados
3. Click en el producto deseado
4. Completar Cantidad y Precio ($)
5. Click "Agregar"
6. Producto aparece en tabla "Productos cargados"
7. Click "Finalizar" para completar

### Ver detalle de comprobante finalizado
1. En listado, click en la fila del comprobante
2. (alternativa) usar botón de acciones en columna "Acciones"

---

## Arqueo de Caja (/adm/cash)

### Estado actual
1. Navigate to `/adm/cash`
2. Tabs: "Estado" (default), "Historial"
3. Tab "Estado" muestra:
   - Apertura Efectivo
   - Ingresos
   - Egresos
   - Esperado Efectivo
   - Tabla "Desglose por Método de Pago"
4. Botones: "Registrar Ingreso", "Registrar Egreso", "Cerrar Caja"

### Historial de arqueos
1. Click tab "Historial"
2. Tabla con columnas: Fecha, Responsable, Cerrado por, Monto Cierre, Diferencia, Estado
3. Paginación disponible

---

## Operaciones del Día (/adm/operations)

### Ver operaciones por fecha
1. Navigate to `/adm/operations`
2. Seleccionar fecha en input type=date (default: hoy)
3. Click "Actualizar"
4. Stats en header: Ingresos, Egresos, Balance
5. Tabla "Operaciones del Día" con columnas: Hora, Tipo, Cliente, Referencia, Método, Monto, Acciones
6. Tipos visibles: Ingreso, Ajuste, Cierre, Apertura

---

## Auth / Session

- App usa Better Auth (`/api/auth/session`)
- En dev con `DEBUG_AUTH="true"`, el middleware bypass auth
- Si da 404 en `/api/auth/session`, revisar que el server esté corriendo

---

## Notas de Debugging

### Purchase Voucher - Flujo completo E2E
1. Crear borrador → agregar producto → finalizar
2. Validar en DB: `stock`, `replacementCost`, `stock_movement`, `price_list_item`
3. Validar en UI: `/adm/operations` NO muestra PURCHASE_VOUCHER (bug conocido)

### Componentes clave
- `CreateDraftVoucherDialog`: modal para crear/editar cabecera
- `AddVoucherItemDialog`: modal para agregar productos y finalizar
- `PurchaseVouchersClient`: orquesta ambos modales
