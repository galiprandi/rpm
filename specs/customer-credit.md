# Especificación: Cuenta Corriente de Clientes

## Resumen
Sistema de cuenta corriente simple que permite registrar OTs con pago pendiente, visualizar saldo deudor por cliente, realizar pagos genéricos contra la deuda acumulada, y gestionar créditos a favor del cliente por devoluciones (notas de crédito).

## Alcance

### Incluido
- Campo `balance` en cliente (saldo deudor positivo = debe, negativo = a favor)
- Visualización de saldo pendiente o crédito a favor en perfil de cliente
- Filtro "Solo pendientes de pago" en lista de OTs
- Reporte de deudores con ordenamiento
- Registro de pagos genéricos que descuenten del balance
- Ventas rápidas (`QuickSaleModal`) a clientes en cuenta corriente
- Habilitar botón "Vender" en QuickSale cuando hay cliente seleccionado (acumula deuda)
- **Créditos a favor por devolución**: Notas de crédito con `refundMethod='ACCOUNT_CREDIT'` decrementan `balance` (generan saldo negativo = crédito a favor)
- **Uso de crédito a favor**: En futuras ventas, el sistema puede aplicar automáticamente el crédito disponible

### Excluido
- Historial detallado de movimientos (ledger completo)
- Estados de cuenta impresos
- Límites de crédito por cliente
- Notificaciones automáticas
- Facturación diferida
- Conversión automática de crédito a favor en pago de nuevas compras (requiere UI de aplicación manual)

## Modelo de Datos

### Cambio en Cliente
```prisma
model customer {
  // ... campos existentes ...
  balance Decimal @db.Decimal(10, 2) @default(0) // Saldo deudor (positivo = debe, negativo = crédito a favor)
}
```

### Estados de Pago en OT
| Estado | Condición |
|--------|-----------|
| `PAID` | totalPaid >= total |
| `PENDING` | totalPaid < total && totalPaid > 0 |
| `UNPAID` | totalPaid = 0 |

## Flujos de Usuario

### 1. OT con Pago Pendiente
```
Al crear OT desde el flujo normal:
- Si el cliente no paga completo en el momento
- OT se marca con saldo pendiente (balance acumula al cliente)

Visualización:
- OT Detail: "Saldo pendiente: $X"
- Filtros: Marca OT en lista de pendientes
```

### 2. Venta Rápida a Cuenta Corriente (QuickSaleModal)
```
Usuario → Dashboard → "Venta Rápida"

Flujo:
1. Seleccionar/agregar items al carrito
2. Seleccionar cliente (search/crear nuevo)
3. Botón "Vender" se habilita solo si hay cliente seleccionado
4. Al confirmar venta:
   - Si cliente tiene balance > 0: Acumula deuda (suma a balance)
   - Si cliente paga algo en el momento: Resta del total, resto va a balance
   - Si cliente paga completo: No afecta balance (venta normal)

Validación:
- Sin cliente seleccionado: Botón "Vender" deshabilitado + mensaje "Seleccione un cliente para continuar"
- Con cliente seleccionado: Botón habilitado, al vender se registra contra su cuenta
```

### 3. Pago Genérico
```
Cliente → Perfil de Cliente → "Registrar Pago"
Inputs:
  - Monto a abonar ($)
  - Método de pago
  - Notas opcionales

Sistema:
  - Descuenta del customer.balance
  - Asocia el pago al cliente (no a OT específica)
  - Si balance queda en 0, todas sus OTs pasan a PAID
```

### 4. Crédito por Devolución (Nota de Crédito)
```
Cliente solicita devolución → Se emite NC con refundMethod='ACCOUNT_CREDIT'

Sistema:
  - Decrementa customer.balance (hace más negativo = crédito a favor)
  - NO crea movimiento de caja (el dinero no sale de la caja)
  - El crédito queda disponible para futuras compras
  - Stock se restablece para productos devueltos

Ejemplo:
  - Balance actual: $10,000 (debe)
  - NC por devolución: $15,000
  - Nuevo balance: -$5,000 (crédito a favor de $5,000)

Visualización en perfil:
  - Balance > 0: "Saldo Pendiente: $X 🔴"
  - Balance = 0: "Al día ✅"
  - Balance < 0: "Crédito a favor: $X 🟢"

**Estado de implementación:** ✅ Completamente implementado
- Servicio: `lib/services/creditNoteService.ts`
- API: `POST /api/credit-notes`
- UI: `CustomerCreditNoteDialog` en perfil de cliente
- Ver spec detallada: `/specs/spec-credit-notes.md`
```

### 5. Consulta de Deuda
```
Usuario → /adm/customers/[id]
Sección "Cuenta Corriente":
  - Saldo actual: $X (rojo si > 0, verde si = 0)
  - Lista de OTs impagas con montos individuales
  - Botón "Registrar Pago"
```

## Interfaz de Usuario

### QuickSaleModal - Integración Cuenta Corriente
```
┌─────────────────────────────────────────────────────┐
│ Venta Rápida                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Items:                                              │
│ • Filtro de Aceite    x2    $25,000               │
│ • Servicio Cambio     x1    $15,000               │
│ ─────────────────────────────────────────           │
│ Total:                            $40,000          │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Cliente: [Juan Pérez          �] [+ Nuevo]        │
│         Saldo actual: $12,500 (deuda)              │
│                                                     │
│ [Cancelar]          [Vender] ← Habilitado          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Sin cliente seleccionado:**
```
Cliente: [Buscar cliente...     🔍] [+ Nuevo]

[Cancelar]          [Vender] ← Deshabilitado (gris)
        ↑ "Seleccione un cliente para continuar"
```

### Filtros de OTs
```
[Ver Todos] [Pendientes] [Pagados] [En Taller]

Diseño extensible para futuros filtros:
- Dropdown o chips horizontales
- Filtros combinables (AND/OR)
- Persistencia en URL query params
```

### Reporte de Deudores `/adm/reports/debtors`
```
Ordenar por: [Mayor Deuda ▼] [Más Reciente] [Más Antiguo]

┌────────────────┬─────────────┬───────────┬──────────────┐
│ Cliente        │ Deuda Total │ # OTs     │ Más Antigua  │
├────────────────┼─────────────┼───────────┼──────────────┤
│ Juan Pérez     │ $45,000     │ 3         │ 15/03/2026   │
│ María González │ $23,500     │ 1         │ 02/04/2026   │
│ Carlos López   │ $8,200      │ 1         │ 08/04/2026   │
└────────────────┴─────────────┴───────────┴──────────────┘

Click en fila → Perfil del cliente con sus OTs pendientes
```

### Perfil de Cliente - Sección Cuenta Corriente
```
┌─────────────────────────────────────┐
│ CUENTA CORRIENTE                    │
├─────────────────────────────────────┤
│                                     │
│  Saldo Pendiente:      $23,500 🔴   │
│  // o Crédito a favor: $5,000 🟢     │
│                                     │
│  [Registrar Pago]                   │
│                                     │
├─────────────────────────────────────┤
│ OTs Impagas:                        │
│ • #1287 - ABC123     $12,500        │
│ • #1256 - DEF456     $11,000        │
│                                     │
│ Historial NC:                       │
│ • NC #0001-00000042  $15,000 🟢 (crédito) │
│                                     │
│ [Ver Todas las OTs]                │
└─────────────────────────────────────┘
```

## APIs

### Endpoints Nuevos/Modificados

```typescript
// POST /api/customers/[id]/payments
// Body: { amount: number, method: string, notes?: string }
// Action: Descuenta del customer.balance, crea registro de pago

// GET /api/reports/debtors
// Query: { sortBy: 'amount' | 'oldest' | 'newest', limit?: number }
// Response: Array<{
//   customerId: string,
//   customerName: string,
//   balance: number,
//   workOrderCount: number,
//   oldestDebtDate: string
// }>

// GET /api/work-orders
// Query modificado: { filter: 'PENDING' | 'PAID' | 'ALL' }
// Response incluye: pendingAmount por OT
```

## Reglas de Negocio

1. **Balance simple**: Un solo número por cliente. Positivo = deuda, negativo = crédito a favor, cero = al día.
2. **Pagos genéricos**: No se asignan a OT específica, descuentan del balance total
3. **Créditos por devolución**: Las notas de crédito con `refundMethod='ACCOUNT_CREDIT'` decrementan el balance. Si el balance era positivo (deuda), la deuda se reduce. Si el crédito supera la deuda, el balance queda negativo (crédito a favor).
4. **Orden de cancelación**: Cuando balance llega a 0, todas sus OTs pasan a PAID
5. **Visualización prioritarias**: Las OTs con pendientes se muestran primero en Kanban. Clientes con crédito a favor se destacan visualmente.
6. **Permisos**: Cualquier usuario con acceso a clientes puede registrar pagos

## Lógica de Cálculo

```
Al crear OT:
  customer.balance += (OT.total - OT.initialPayment)

Al registrar pago genérico:
  customer.balance -= payment.amount
  if (customer.balance <= 0):
    marcar todas las OTs del cliente como PAID

Al emitir NC con ACCOUNT_CREDIT o MIXED:
  customer.balance -= NC.accountCreditAmount
  // Si balance queda negativo, el cliente tiene crédito a favor
  // Si balance era positivo, la deuda se reduce

Al consultar deudores:
  SELECT customer.*, COUNT(work_order) as otCount
  WHERE customer.balance > 0
  ORDER BY balance DESC (o oldest/newest según filtro)

Al consultar clientes con crédito a favor:
  SELECT customer.*
  WHERE customer.balance < 0
  ORDER BY balance ASC (mayor crédito primero)
```

## Criterios de Aceptación

- [x] Campo balance existe en cliente y se actualiza automáticamente
- [x] QuickSaleModal permite venta a cuenta corriente con checkbox
- [x] Lista de OTs tiene filtro "Pendientes de pago"
- [x] Lista de clientes muestra saldo deudor o crédito a favor
- [x] Lista de clientes tiene filtro "Solo con Saldo" + exportación a CSV
- [x] Usuario puede registrar pago genérico que descuente del balance
- [x] Reporte de deudores ordenable por monto/fecha
- [x] Cuando balance llega a 0, OTs se marcan como pagadas
- [x] API /api/direct-sales soporta sellOnCredit y remainingAmount
- [x] **Crédito a favor por NC**: El balance decrementa correctamente al emitir una NC con ACCOUNT_CREDIT
- [x] **Visualización de crédito a favor**: El perfil del cliente muestra "Crédito a favor" cuando balance < 0
- [ ] **Reporte de créditos a favor**: Filtro o vista separada de clientes con saldo negativo (crédito disponible)

## Dependencias
- Modelo customer existente
- Modelo work_order con relación a pagos
- Vista Kanban de OTs existente
- Sistema de autenticación
