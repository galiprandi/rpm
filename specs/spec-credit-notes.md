---
title: Sistema de Notas de Crédito y Devoluciones
version: 1.1
date_created: 2026-05-02
date_updated: 2026-05-04
owner: RPM Dev Team
tags: [process, sales, inventory, cash, customer-credit]

## 🟢 Estado de Implementación
Esta especificación está **completamente implementada**. Ver sección "Estado de Implementación" al final del documento.
---

# Introduction

Especificación del sistema de notas de crédito y devoluciones para RPM. Permite registrar devoluciones de productos por parte de clientes, imputar el dinero a la cuenta corriente del cliente o reintegrarlo en efectivo, y restablecer automáticamente el stock de los productos devueltos.

El diseño busca **cambios mínimos en el sistema existente** reutilizando:
- `cash_movement` para egresos de caja por reintegros
- `stock_movement` para restauración de stock
- `customer.balance` para créditos a favor del cliente
- `invoice` con type `NOTA_CREDITO` para la parte fiscal

## 1. Purpose & Scope

### Propósito
Proveer un flujo completo y trazable para gestionar devoluciones de clientes, incluyendo:
- Emisión de notas de crédito (fiscal y operativa)
- Devolución de productos al stock con trazabilidad
- Reintegro de dinero al cliente o acreditación en su cuenta corriente
- Integración con arqueo de caja y saldos de clientes

### Alcance
- ✅ Devoluciones totales y parciales de ventas directas (`direct_sale`)
- ✅ Devoluciones totales y parciales de órdenes de trabajo (`work_order`)
- ✅ Reintegro en efectivo / transferencia (egreso de caja)
- ✅ Acreditación a cuenta corriente del cliente (`customer.balance` negativo = a favor)
- ✅ Restablecimiento automático de stock con `stock_movement`
- ❌ Generación de comprobante `NOTA_CREDITO` en tabla `invoice` (no implementado)
- ✅ Búsqueda de venta original por número o cliente
- ✅ Cancelación de notas de crédito emitidas

### Fuera de alcance
- ❌ Cambios de producto (swap) — se modela como devolución + nueva venta
- ❌ Devoluciones sin referencia a venta original
- ❌ Notas de débito
- ❌ Devoluciones mixtas (parte efectivo, parte cuenta) — solo CASH o ACCOUNT_CREDIT
- ❌ Integración AFIP en esta fase
- ❌ Estados DRAFT → ISSUED — las NC se crean directamente en estado ISSUED

## 2. Definitions

| Término | Definición |
|---------|------------|
| **Nota de Crédito (NC)** | Comprobante que anula parcial o totalmente una venta anterior. Genera un egreso de dinero o crédito a favor del cliente. |
| **Venta Original** | La transacción original que se está anulando parcialmente: `direct_sale` o `work_order`. |
| **Reintegro** | Devolución de dinero al cliente en efectivo o transferencia. |
| **Acreditación** | Crédito a favor del cliente registrado en `customer.balance` (balance negativo). |
| **Item Devuelto** | Producto o servicio de la venta original que el cliente devuelve. Solo los productos físicos afectan stock. |

## 3. Requirements, Constraints & Guidelines

### Requisitos Funcionales

- **REQ-001**: El sistema debe permitir buscar una venta original (`direct_sale` o `work_order`) por número, fecha o cliente.
- **REQ-002**: El usuario debe poder seleccionar qué items de la venta original se devuelven y en qué cantidad.
- **REQ-003**: Solo se pueden devolver items que existan en la venta original, con cantidad menor o igual a la vendida.
- **REQ-004**: Para cada item de producto devuelto, el sistema debe aumentar el stock del producto y crear un `stock_movement` de tipo `IN`.
- **REQ-005**: El total de la nota de crédito se calcula automáticamente como la suma de los items devueltos.
- **REQ-006**: El usuario debe elegir el destino del reintegro: `CASH` o `ACCOUNT_CREDIT`.
- **REQ-007**: Si el destino es `CASH`, se debe crear un `cash_movement` de tipo `EXPENSE` con el monto reintegrado.
- **REQ-008**: Si el destino es `ACCOUNT_CREDIT`, se debe decrementar `customer.balance` (hacerlo más negativo = crédito a favor).
- **REQ-009**: No hay soporte para devoluciones mixtas en esta implementación.
- **REQ-010**: La caja debe estar abierta para realizar reintegros en efectivo.
- **REQ-011**: No se crea registro en `invoice` en esta implementación (futuro: integración AFIP).
- **REQ-012**: Toda nota de crédito debe tener trazabilidad completa: quién la creó, cuándo, items devueltos, movimientos de stock y caja generados.

### Requisitos Técnicos

- **REQ-013**: Las notas de crédito y sus items deben ser **inmutables** una vez creadas (no editar/eliminar).
- **REQ-014**: Las validaciones de stock y caja deben ejecutarse dentro de una transacción de base de datos.
- **REQ-015**: Los items devueltos se almacenan en una tabla dedicada `credit_note_item` para trazabilidad.

### Restricciones

- **CON-001**: No se puede devolver un item con cantidad mayor a la vendida en la transacción original.
- **CON-002**: No se puede crear una nota de crédito con monto total igual a cero.
- **CON-003**: No se puede realizar reintegro en efectivo si la caja está cerrada.
- **CON-004**: Los servicios (`serviceId`) pueden figurar en la nota de crédito pero **no afectan stock**.
- **CON-005**: El monto de reintegro en efectivo no puede superar el saldo disponible en caja para ese método de pago.

## 4. Interfaces & Data Contracts

### Modelo de Datos (Prisma)

#### Nuevo modelo: `credit_note`

```prisma
model credit_note {
  id               String             @id @default(cuid())
  originalSaleId   String
  originalSaleType String
  customerId       String
  total            Decimal            @db.Decimal(10, 2)
  refundMethod     String             // 'CASH' | 'ACCOUNT_CREDIT'
  paymentMethodId  String?
  status           String             @default("ISSUED") // 'ISSUED' | 'CANCELLED'
  notes            String?
  createdAt        DateTime           @default(now())
  createdBy        String
  customer         customer           @relation(fields: [customerId], references: [id])
  paymentMethod    payment_method?    @relation(fields: [paymentMethodId], references: [id])
  items            credit_note_item[]

  @@index([customerId])
  @@index([originalSaleId, originalSaleType])
  @@index([paymentMethodId])
  @@index([status])
  @@map("credit_note")
}
```

#### Nuevo modelo: `credit_note_item`

```prisma
model credit_note_item {
  id              String      @id @default(cuid())
  creditNoteId    String
  productId       String?
  serviceId       String?
  name            String      // Nombre del producto/servicio (snapshot)
  quantity        Int
  unitPrice       Decimal     @db.Decimal(10, 2)
  totalPrice      Decimal     @db.Decimal(10, 2)

  creditNote      credit_note @relation(fields: [creditNoteId], references: [id], onDelete: Cascade)
  product         product?    @relation(fields: [productId], references: [id])
  service         service?    @relation(fields: [serviceId], references: [id])

  @@index([creditNoteId])
  @@index([productId])
  @@index([serviceId])
  @@map("credit_note_item")
}
```

#### Relación inversa en modelos existentes

```prisma
// En model customer (existente)
model customer {
  // ... campos existentes ...
  credit_notes credit_note[]  // Nuevo: relación inversa
}

// En model invoice (existente)
model invoice {
  // ... campos existentes ...
  creditNote credit_note?     // Nuevo: relación inversa (1:1 opcional)
}

// En model product (existente)
model product {
  // ... campos existentes ...
  credit_note_items credit_note_item[]  // Nuevo: relación inversa
}
```

### API Endpoints

#### `POST /api/credit-notes`

Crea una nueva nota de crédito con todos los efectos (stock, caja, cliente).

**Body:**
```typescript
{
  originalSaleId: string;           // ID de direct_sale o work_order
  originalSaleType: 'direct_sale' | 'work_order';
  items: Array<{
    productId?: string;
    serviceId?: string;
    quantity: number;
  }>;
  refundMethod: 'CASH' | 'ACCOUNT_CREDIT';
  paymentMethodId?: string;          // Requerido si refundMethod = CASH
  notes?: string;
}
```

**Validaciones:**
- `originalSaleId` debe existir en la tabla correspondiente
- `customerId` debe coincidir con el cliente de la venta original
- Cada `item` debe corresponder a un item existente en la venta original
- `quantity` <= cantidad vendida del item original
- Si `refundMethod` = `CASH`, `paymentMethodId` es requerido y caja debe estar abierta

**Transacción atómica:**
1. Crear `credit_note` con status `ISSUED` y `credit_note_item`s
2. Si `refundMethod` = `CASH`: crear `cash_movement` de tipo `EXPENSE`
3. Si `refundMethod` = `ACCOUNT_CREDIT`: decrementar `customer.balance`
4. Para cada item con `productId`: actualizar `product.stock` + y crear `stock_movement` tipo `IN`
5. Invalidar cache de dashboard (`revalidatePath('/adm')`)

**Response (201):**
```json
{
  "id": "cuid",
  "originalSaleId": "...",
  "originalSaleType": "direct_sale",
  "customerId": "...",
  "total": 25000.00,
  "refundMethod": "CASH",
  "paymentMethodId": "...",
  "status": "ISSUED",
  "notes": "...",
  "createdAt": "2026-05-04T...",
  "createdBy": "..."
}
```

#### `GET /api/credit-notes`

Lista de notas de crédito con filtros.

**Query Params:**
- `customerId` (optional)
- `originalSaleId` (optional)
- `status` (optional): ISSUED, CANCELLED
- `startDate`, `endDate` (optional)

**Response:**
```json
[
  {
    "id": "...",
    "originalSaleId": "...",
    "originalSaleType": "direct_sale",
    "customerId": "...",
    "customer": { "id": "...", "name": "Juan Pérez", "phone": "..." },
    "total": 25000.00,
    "refundMethod": "CASH",
    "paymentMethodId": "...",
    "status": "ISSUED",
    "notes": "...",
    "createdAt": "2026-05-02T14:30:00Z",
    "createdBy": "...",
    "_count": { "items": 2 }
  }
]
```

#### `GET /api/credit-notes/:id`

Detalle completo de una nota de crédito.

**Response:**
```json
{
  "id": "...",
  "originalSaleId": "...",
  "originalSaleType": "direct_sale",
  "customerId": "...",
  "customer": { "id": "...", "name": "Juan Pérez", "phone": "...", "email": "...", "balance": -15000.00 },
  "total": 25000.00,
  "refundMethod": "CASH",
  "paymentMethodId": "...",
  "paymentMethod": { "id": "...", "name": "Efectivo", "code": "CASH" },
  "status": "ISSUED",
  "notes": "Producto defectuoso",
  "items": [
    { "id": "...", "productId": "...", "serviceId": null, "name": "Filtro de Aceite", "quantity": 2, "unitPrice": 5000.00, "totalPrice": 10000.00, "product": { "id": "...", "name": "Filtro de Aceite" }, "service": null },
    { "id": "...", "productId": "...", "serviceId": null, "name": "Lámpara LED", "quantity": 1, "unitPrice": 15000.00, "totalPrice": 15000.00, "product": { "id": "...", "name": "Lámpara LED" }, "service": null }
  ],
  "createdAt": "2026-05-02T14:30:00Z",
  "createdBy": "user@email.com"
}
```

#### `POST /api/credit-notes/:id/cancel`

Cancelar una nota de crédito emitida.

**Body:**
```json
{ "reason": "string (opcional)" }
```

**Reglas:**
- Solo se pueden cancelar NC con status `ISSUED`
- Crea movimientos inversos (egreso de stock, re-ingreso de caja, ajuste de balance)
- Actualiza status a `CANCELLED`

### Servicios

```typescript
// lib/services/creditNoteService.ts

interface CreditNoteItemInput {
  productId?: string;
  serviceId?: string;
  quantity: number;
}

interface CreateCreditNoteInput {
  originalSaleId: string;
  originalSaleType: 'direct_sale' | 'work_order';
  items: CreditNoteItemInput[];
  refundMethod: 'CASH' | 'ACCOUNT_CREDIT';
  paymentMethodId?: string;
  paymentMethodCode?: string;
  notes?: string;
  createdBy: string;
}

async function createCreditNote(input: CreateCreditNoteInput): Promise<CreditNote>
async function cancelCreditNote(id: string, reason?: string): Promise<CreditNote>
async function getCreditNotes(filters: CreditNoteFilters): Promise<CreditNote[]>
async function getCreditNoteById(id: string): Promise<CreditNoteDetail>
async function getAlreadyReturnedQuantities(originalSaleId: string, originalSaleType: string, tx?: any): Promise<Record<string, number>>
```

## 5. Acceptance Criteria

- **AC-001**: Dado una venta directa de 2 filtros de aceite a $5000 cada uno, cuando el cliente devuelve 1 filtro solicitando reintegro en efectivo, entonces el stock del filtro aumenta en 1, se crea un cash_movement EXPENSE por $5000, y se genera una NOTA_CREDITO.
- **AC-002**: Dado una orden de trabajo con productos y servicios, cuando el cliente devuelve solo los productos solicitando crédito a cuenta, entonces el stock se restablece, el balance del cliente decrementa (crédito a favor), no se genera movimiento de caja, y se genera una NOTA_CREDITO.
- **AC-003**: Dado una venta a cuenta corriente donde el cliente adeudaba $10000, cuando se emite una NC por $15000 a cuenta del cliente, entonces el balance queda en -$5000 (crédito a favor de $5000).
- **AC-004**: Dado una nota de crédito CASH por $20000, cuando se procesa, entonces se crea un cash_movement EXPENSE por $20000 y el stock se actualiza.
- **AC-005**: Dado una caja cerrada, cuando un usuario intenta crear una NC con reintegro en efectivo, entonces el sistema rechaza la operación con error 400.
- **AC-006**: Dado un item de servicio en la venta original, cuando se incluye en una NC, entonces no se crea stock_movement para ese item.
- **AC-007**: Dado una NC emitida, cuando se cancela, entonces se revierten todos los movimientos (stock, caja, balance) y se marca la NC como CANCELLED.
- **AC-008**: Dado un producto con stock de 5 unidades, cuando se devuelven 2 en una NC, entonces el stock queda en 7 y se crea un stock_movement IN con previousStock=5 y newStock=7.

## 6. Test Automation Strategy

- **Unit Tests**: `lib/services/creditNoteService.ts` — lógica de cálculo de totales, validación de items, cálculo de montos mixtos
- **Integration Tests**: API endpoints `POST /api/credit-notes`, `GET /api/credit-notes/:id`, `PATCH /api/credit-notes/:id/status`
- **Test Data**: Crear venta directa de prueba, luego emitir NC contra ella
- **E2E**: Flujo completo: búsqueda de venta → selección de items → elección de método de reintegro → confirmación → verificación de stock y saldo

## 7. Rationale & Context

### ¿Por qué no reutilizar `direct_sale` con flag negativo?
Las notas de crédito no son ventas. Reutilizar `direct_sale` generaría confusión en reportes, stocks y métricas de negocio. Un modelo dedicado permite:
- Trazabilidad clara venta-original → devolución
- Validaciones específicas (cantidad <= vendida)
- Estados propios (DRAFT → ISSUED → CANCELLED)
- Facilitar futura integración AFIP (las NC tienen requisitos fiscales distintos)

### ¿Por qué `customer.balance` negativo para crédito a favor?
El modelo actual usa `balance` positivo = deuda. Extenderlo con valores negativos para crédito a favor es consistente y no requiere nuevos campos. El frontend puede mostrar "Crédito a favor: $X" cuando balance < 0.

### ¿Por qué solo 2 tablas nuevas?
`credit_note` + `credit_note_item` es el mínimo necesario para trazabilidad completa. Todo lo demás (caja, stock, cliente, factura) se maneja con tablas existentes.

## 8. Dependencies & External Integrations

### Sistema Interno
- **DAT-001**: `direct_sale` / `work_order` — venta original que se devuelve
- **DAT-002**: `product.stock` + `stock_movement` — para restablecimiento de inventario
- **DAT-003**: `cash_movement` — para egresos de caja por reintegros
- **DAT-004**: `customer.balance` — para acreditación a cuenta corriente
- **DAT-005**: `invoice` — para comprobante fiscal NOTA_CREDITO

### APIs Dependientes
- **EXT-001**: `GET /api/direct-sales/:id` o equivalente (para obtener items de venta original)
- **EXT-002**: `GET /api/work-orders/:id` (para obtener items de OT original)
- **EXT-003**: `GET /api/cash/status` (para validar caja abierta antes de reintegro en efectivo)

## 9. Examples & Edge Cases

### Ejemplo 1: Devolución total con reintegro en efectivo

```
Venta original (Direct Sale #DS-001):
- Filtro de Aceite x2 @ $5,000 = $10,000
- Lámpara LED x1 @ $15,000 = $15,000
Total: $25,000 | Pagado en efectivo

Cliente devuelve TODO. Solicita reintegro en efectivo.

NC generada:
- Items devueltos: Filtro x2, Lámpara x1
- Total: $25,000
- RefundMethod: CASH
- CashAmount: $25,000

Efectos:
- Stock Filtro: +2
- Stock Lámpara: +1
- Caja: EXPENSE $25,000 efectivo
- Invoice: NOTA_CREDITO #0001-00000042 (DRAFT)
```

### Ejemplo 2: Devolución parcial a cuenta corriente

```
Venta original (Work Order #OT-128):
- Polarizado 3M x1 @ $35,000 = $35,000
- Instalación (servicio) x1 @ $12,000 = $12,000
Total: $47,000 | Pagado: $20,000 | Pendiente: $27,000

Cliente devuelve solo el Polarizado (no la instalación). Solicita crédito a cuenta.

NC generada:
- Items: Polarizado x1
- Total: $35,000
- RefundMethod: ACCOUNT_CREDIT
- AccountCreditAmount: $35,000

Efectos:
- Stock Polarizado: +1
- Balance cliente: -$35,000 (crédito a favor de $35,000)
- NO hay movimiento de caja
- El cliente ahora tiene $35,000 de crédito que puede usar en futuras compras
```


### Edge Case: Cancelación de NC

```
NC #NC-005 emitida por $15,000 (CASH) ayer.
Hoy el cliente se arrepiente y quiere quedarse con el producto.

Operación: Cancelar NC #NC-005

Efectos inversos:
- Caja: INCOME $15,000 (re-ingreso del efectivo que salió)
  Nota: Este INCOME debe tener referenceType='credit_note_cancelled' para no confundir con venta
- Stock: OUT con cantidad devuelta (el stock vuelve a bajar)
- Balance: Sin cambio (si era CASH puro)
- Invoice: NOTA_CREDITO marcada como CANCELLED
- credit_note.status: CANCELLED
```

### Edge Case: NC contra venta a crédito con saldo pendiente

```
Venta a crédito: Total $50,000 | Pagado $0 | Balance cliente: $50,000

NC por $20,000 a cuenta:
- Balance cliente: $50,000 - $20,000 = $30,000 (sigue debiendo, pero menos)
- Stock: restablecido

NC por $60,000 a cuenta (más que la venta):
- Error: El total de NC no puede superar el total de la venta original
```

## 10. Validation Criteria

- [x] Migración de Prisma crea `credit_note` y `credit_note_item` sin errores
- [x] `POST /api/credit-notes` crea todos los registros esperados en una transacción
- [x] Stock se actualiza correctamente para productos devueltos
- [x] Servicios en NC no generan movimientos de stock
- [x] Reintegro en efectivo solo funciona con caja abierta
- [x] Balance de cliente se actualiza correctamente para ACCOUNT_CREDIT
- [x] No se puede crear NC si la cantidad devuelta excede la vendida
- [x] Cancelación de NC revierte todos los movimientos
- [x] El total de NC no puede superar el total de la venta original
- [x] Cache de dashboard se invalida al crear NC
- [ ] `invoice` de tipo NOTA_CREDITO se crea y vincula a `credit_note` (pendiente: integración AFIP)

## 11. Estado de Implementación

### Componentes Implementados
- ✅ Modelo Prisma: `credit_note`, `credit_note_item`
- ✅ Servicio: `lib/services/creditNoteService.ts`
  - `createCreditNote`: Crea NC con stock, caja y balance updates
  - `cancelCreditNote`: Cancela NC revirtiendo efectos
  - `getCreditNotes`: Lista NCs con filtros
  - `getCreditNoteById`: Detalle completo de NC
  - `getAlreadyReturnedQuantities`: Validación de cantidad devuelta
- ✅ API Endpoints:
  - `POST /api/credit-notes`: Crear NC
  - `GET /api/credit-notes`: Listar NCs
  - `GET /api/credit-notes/:id`: Detalle de NC
  - `POST /api/credit-notes/:id/cancel`: Cancelar NC
- ✅ Componentes UI:
  - `CustomerCreditNoteDialog`: Diálogo para crear NC desde perfil de cliente
  - `CreditNotesClient`: Lista de NCs en `/adm/credit-notes`

### Diferencias con Spec Original
1. **Sin integración AFIP**: No se crea `invoice` en esta fase
2. **Sin estados DRAFT**: Las NC se crean directamente en estado `ISSUED`
3. **Sin devoluciones mixtas**: Solo `CASH` o `ACCOUNT_CREDIT` (no `MIXED`)
4. **Modelo simplificado**: Sin `cashAmount`, `accountCreditAmount`, `refundMethodCode`
5. **Validación mejorada**: `getAlreadyReturnedQuantities` previene devolver más de lo vendido

### Pendientes Futuros
- Integración AFIP (crear invoice con NOTA_CREDITO)
- Soporte para devoluciones mixtas (parte efectivo, parte cuenta)
- Estados DRAFT → ISSUED workflow
- Reportes de NCs por período

## 12. Related Specifications / Further Reading

- `/specs/inventory-sales.md` — Ventas directas, control de stock, movimientos de inventario
- `/specs/cash-management.md` — Arqueo de caja, movimientos EXPENSE/INCOME
- `/specs/customer-credit.md` — Cuenta corriente, saldo de clientes, pagos genéricos
- `/specs/afip-integration.md` — Facturación electrónica, modelo `invoice`, NOTA_CREDITO (futuro)
