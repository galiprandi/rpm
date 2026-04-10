# Especificación: Sistema de Arqueo de Caja

## Resumen
Sistema completo de gestión de caja central que permite abrir caja, registrar movimientos (entradas, salidas), y cerrar con arqueo detallado por método de pago para detectar diferencias.

## Alcance

### Incluido
- Apertura de caja con monto inicial en efectivo
- Registro de movimientos de caja (ingresos y egresos)
- Cierre de caja con conteo físico por método de pago
- Detección y registro de diferencias de arqueo
- Historial de arqueos para auditoría
- Vista dedicada `/adm/cash`

### Excluido
- Múltiples cajas simultáneas (solo caja central)
- Impresión de tickets de arqueo
- Integración con sistemas contables externos

## Modelo de Datos

### Tipos de Movimiento (existente en `cash_movement`)
| Tipo | Descripción |
|------|-------------|
| `OPENING` | Apertura de caja - monto inicial |
| `CLOSING` | Cierre de caja - conteo final |
| `INCOME` | Ingreso de dinero (venta, etc) |
| `EXPENSE` | Egreso de dinero (pago proveedor, gastos) |
| `ADJUSTMENT` | Ajuste por diferencia de arqueo |

### Estados de Caja
| Estado | Condición |
|--------|-----------|
| `CLOSED` | No hay OPENING sin CLOSING correspondiente del día |
| `OPEN` | Hay OPENING del día actual sin CLOSING |

## Flujos de Usuario

### 1. Apertura de Caja
```
Usuario → /adm/cash → "Abrir Caja"

Sistema sugiere monto inicial (efectivo del cierre anterior):
  - "Monto inicial en efectivo: $____" (pre-llenado con closing anterior o $0 si no hay)
  - Usuario puede aceptar el valor, modificarlo, o poner $0
  - Transferencia, Tarjeta, MercadoPago, etc: $0 implícito (no hay base)

Validación: No puede haber caja abierta
Resultado: Movimiento OPENING creado solo para efectivo, estado = OPEN
```

**Notas:**
- El efectivo del cierre de ayer es la base de hoy (flujo natural de caja)
- Si ayer no hubo cierre, sugiere $0
- Usuario puede ajustar si hizo retiro de efectivo o agregó más base

### 2. Registro de Egreso (Gastos)
```
Usuario → /adm/cash → "Registrar Egreso"
Inputs: 
  - Monto ($)
  - Método de pago (CASH, TRANSFER, etc)
  - Motivo/Categoría (Proveedor, Servicio, Otros)
  - Descripción opcional
Validación: Caja debe estar abierta, fondos suficientes si es CASH
Resultado: Movimiento EXPENSE creado
```

### 3. Cierre de Caja (Arqueo por Método)
```
Usuario → /adm/cash → "Cerrar Caja"

Sistema muestra desglose del día:
┌─────────────┬──────────┬──────────┬──────────┬──────────┐
│ Método      │ Apertura │ Ingresos │ Egresos  │ Esperado │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ Efectivo    │ $10,000  │ +$5,200  │ -$500    │ $14,700  │
│ Transfer    │ $0       │ +$3,400  │ -$200    │ $3,200   │
│ MercadoPago │ $0       │ +$2,100  │ -        │ $2,100   │
│ Tarjeta     │ $0       │ +$1,800  │ -        │ $1,800   │
└─────────────┴──────────┴──────────┴──────────┴──────────┘

Usuario ingresa conteo físico/verificado por cada método (inputs con validación en tiempo real):
  - Efectivo: $____ (mientras tipea, sistema calcula diferencia)
  - Transferencia: $____
  - MercadoPago: $____
  - Tarjeta: $____

**Previsualización en tiempo real (antes de confirmar):**
```
┌─────────────┬──────────┬──────────┬──────────┐
│ Método      │ Esperado │ Contado  │ Estado   │
├─────────────┼──────────┼──────────┼──────────┤
│ Efectivo    │ $14,700  │ $14,500  │ 🔴 -$200 │ ← Se actualiza al tipear
│ Transfer    │ $3,200   │ $3,200   │ ✅ $0    │
│ MercadoPago │ $2,100   │ $2,200   │ 🟡 +$100 │
│ Tarjeta     │ $1,800   │ $____    │ ⏳ ...   │
└─────────────┴──────────┴──────────┴──────────┘

Total Faltante: $200 | Total Sobrante: $100 | Diferencia Neta: -$100
```

**Validación antes de cerrar:**
- Si hay faltante > $0: Input obligatorio "Motivo del faltante"
- Si hay sobrante > $0: Input obligatorio "Motivo del sobrante"
- Botón "Cerrar Caja" habilitado solo si todos los métodos tienen valor ingresado

**Flujo recomendado:**
1. Usuario ingresa conteo en cada método
2. Ve diferencias en tiempo real
3. Si detecta error propio (ej: tipeó $100 en vez de $1000), corrige antes de cerrar
4. Si la diferencia es real (robos, errores de cambio, etc), documenta el motivo
5. Confirma cierre → Sistema crea CLOSING + ADJUSTMENT por cada método con diferencia

**Detección de robos/desvíos:**
- Faltante en Efectivo: Posible robo físico, error de cambio, venta sin registrar
- Faltante en Transferencia: Desvío a otra cuenta, transferencia no registrada
- Faltante en MP/Tarjeta: Cancelación/estorno no registrado, fraude

Detección de robos/desvíos:
  - Faltante en Efectivo: Posible robo, error de cambio, venta sin registrar
  - Faltante en Transferencia: Desvío a otra cuenta, transferencia no registrada
  - Faltante en MP/Tarjeta: Cancelación/estorno no registrado, fraude
```

## Interfaz de Usuario

### Página `/adm/cash`

#### Sección: Estado Actual (Header)
```
[Estado: Caja Abierta desde 08:30 - Juan Pérez]

Desglose del día:
┌─────────────┬──────────┬──────────┬──────────┐
│ Método      │ Apertura │ Ventas   │ Egresos  │ Esperado │
├─────────────┼──────────┼──────────┼──────────┤
│ Efectivo    │ $1,000   │ $5,200   │ -$500    │ $5,700   │
│ Transfer    │ -        │ $3,400   │ -$200    │ $3,200   │
│ Tarjeta     │ -        │ $1,800   │ -        │ $1,800   │
└─────────────┴──────────┴──────────┴──────────┘

[Abrir Caja]  [Cerrar Caja]  [Registrar Egreso]
```

#### Sección: Últimos Movimientos (Sidebar o Tab)
Lista cronológica de los últimos 20 movimientos del día.

#### Sección: Historial de Arqueos (Tab)
Tabla de arqueos previos:
| Fecha | Usuario Apertura | Usuario Cierre | Diferencia | Estado |
|-------|------------------|----------------|------------|--------|
| 09/04 | Juan Pérez | María G. | $0 | Cuadrado |
| 08/04 | María G. | Juan Pérez | -$150 | Faltante* |

*Click para ver detalle de la diferencia

## APIs

### Endpoints Nuevos

```typescript
// POST /api/cash/open
// Body: { initialAmount: number, method: string }
// Error: 400 si ya hay caja abierta

// POST /api/cash/close
// Body: { 
//   counts: Record<string, number>, // método: monto contado
//   differenceReason?: string // obligatorio si hay diferencia
// }
// Error: 400 si no hay caja abierta

// GET /api/cash/status
// Response: {
//   status: 'OPEN' | 'CLOSED',
//   openedAt?: string,
//   openedBy?: string,
//   summary: Record<string, {
//     opening: number,
//     income: number,
//     expense: number,
//     expected: number
//   }>
// }

// GET /api/cash/history?limit=30
// Response: Array<{
//   id: string,
//   date: string,
//   openedBy: string,
//   closedBy: string,
//   difference: number,
//   differenceReason?: string
// }>
```

## Reglas de Negocio

1. **Solo una caja abierta**: No se puede abrir si ya existe OPENING del día sin CLOSING
2. **Cierre obligatorio**: Solo ADMIN puede forzar apertura sobre caja sin cerrar del día anterior
3. **Egresos limitados**: No se puede registrar egreso en efectivo si excede saldo disponible
4. **Auditoría**: Toda diferencia debe tener motivo documentado
5. **Permisos**: 
   - Abrir/Cerrar: ADMIN, STAFF
   - Registrar egresos: ADMIN, STAFF
   - Ver historial completo: ADMIN

## Criterios de Aceptación

- [ ] Usuario puede abrir caja ingresando monto inicial
- [ ] Usuario puede registrar egresos con motivo
- [ ] Sistema muestra desglose por método de pago en tiempo real
- [ ] Usuario puede cerrar caja ingresando conteo físico
- [ ] Sistema calcula y muestra diferencias antes de confirmar cierre
- [ ] Diferencias se registran con motivo obligatorio
- [ ] Historial de arqueos accesible desde la vista
- [ ] Sin caja abierta, no se pueden registrar egresos manuales

## Dependencias
- Modelo `cash_movement` existente
- Sistema de autenticación y roles
- APIs de pagos existentes (para integrar ventas automáticas)
