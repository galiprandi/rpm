# Especificación: Sistema de Arqueo de Caja

## Resumen
Sistema completo de gestión de caja central que permite abrir caja, registrar movimientos (entradas, salidas), y cerrar con arqueo detallado por método de pago para detectar diferencias.

## Alcance

### Incluido ✅ IMPLEMENTADO
- ✅ Apertura de caja con monto inicial en efectivo
- ✅ **Selección de responsable/cajero de turno** (por defecto usuario actual)
- ✅ Trazabilidad dual: quien ejecuta (createdBy) vs quien opera (responsibleId)
- ✅ Registro de ingresos manuales (capital, reembolsos)
- ✅ Registro de egresos (proveedores, gastos)
- ✅ Cierre de caja con conteo físico por método de pago
- ✅ Detección y registro de diferencias de arqueo
- ✅ Previsualización en tiempo real de diferencias
- ✅ Ajustes automáticos (ADJUSTMENT) por diferencias
- ✅ Vista dedicada `/adm/cash`
- ✅ Navegación en sidebar

### Incluido ✅ IMPLEMENTADO (continuación)
- ✅ Historial de arqueos para auditoría - endpoint GET /api/cash/history
- ✅ Tab "Estado" - vista principal con métricas y operaciones
- ✅ Tab "Historial" - tabla con paginación de arqueos previos

### Incluido ⏳ PENDIENTE
- ⏳ Tab "Últimos Movimientos" - lista cronológica del día (requiere endpoint adicional)

### Excluido
- ❌ Múltiples cajas simultáneas (solo caja central)
- ❌ Impresión de tickets de arqueo
- ❌ Integración con sistemas contables externos

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

Selector de Responsable:
  - Dropdown con usuarios STAFF/ADMIN activos
  - Por defecto: usuario actual (quien ejecuta la acción)
  - Opcional: puede seleccionar otro miembro del staff
  - Si es diferente al usuario actual: muestra warning "(Diferente al usuario actual)"

Validación: No puede haber caja abierta, responsable debe ser STAFF/ADMIN
Resultado: Movimiento OPENING creado con:
  - createdBy: usuario que hizo clic (auditoría técnica)
  - responsibleId: cajero seleccionado (responsable operativo)
  - estado = OPEN
```

**Notas:**
- El efectivo del cierre de ayer es la base de hoy (flujo natural de caja)
- Si ayer no hubo cierre, sugiere $0
- Usuario puede ajustar si hizo retiro de efectivo o agregó más base
- **Trazabilidad dual**: createdBy (quién ejecutó) vs responsibleId (quién opera la caja)
- Casos de uso: manager abre antes de que llegue cajero, turnos compartidos, etc.

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


## Interfaz de Usuario

### Página `/adm/cash` - Implementada ✅

#### Sección: Estado Actual (Header) ✅
```
[Estado: Caja Abierta desde 08:30 - Juan Pérez]
┌─────────────────────────────────────────────────────┐
│ Apertura    Ingresos    Egresos     Esperado        │
│ $10,000     $0          $500        $9,500         │
└─────────────────────────────────────────────────────┘

[Abrir Caja]  [Cerrar Caja]  [Registrar Egreso]
```
**Estado:** Cards implementadas con métricas en tiempo real

#### Sección: Desglose por Método de Pago ✅
Tabla dinámica con:
- Método, Apertura, Ingresos, Egresos, Esperado
- Solo muestra métodos con movimientos (optimización)

#### Sección: Últimos Movimientos (Sidebar o Tab) ⏳ PENDIENTE
Lista cronológica de los últimos 20 movimientos del día.
**Nota:** Falta implementar tab con historial de movimientos

#### Sección: Historial de Arqueos (Tab) ✅ IMPLEMENTADO
Tabla de arqueos previos:
| Fecha | Responsable | Abierto por | Cerrado por | Diferencia | Estado |
|-------|-------------|-------------|-------------|------------|--------|
| 09/04 | Juan Pérez | Juan Pérez | María G. | $0 | Cuadrado |
| 08/04 | Pedro López | María G. | Juan Pérez | -$150 | Faltante* |
| 07/04 | Ana Ruiz | Ana Ruiz | - | - | Abierta |

**Notas:**
- **Responsable**: Quién operó físicamente la caja (responsibleId)
- **Abierto por**: Quién ejecutó la acción en el sistema (createdBy)
- Si son diferentes, muestra "Abierto por: X" debajo del responsable
- Requiere endpoint GET /api/cash/history

### Modales Implementados ✅

#### Modal: Abrir Caja ✅
- Input monto inicial
- **Selector de responsable** con dropdown de usuarios STAFF/ADMIN
- Sugerencia pre-llenada con cierre anterior
- Validación: no permite abrir si ya está abierta, valida responsable

#### Modal: Registrar Egreso ✅
- Monto, Método de pago (dropdown), Motivo (requerido), Notas (opcional)
- Validación: caja debe estar abierta

#### Modal: Cerrar Caja (Arqueo) ✅
- Tabla con: Método | Esperado | Contado (input) | Diferencia (calculada en tiempo real)
- Diferencias se muestran en rojo (faltante) o verde (sobrante)
- Textarea obligatorio si hay diferencias
- Crea ADJUSTMENT automático por cada diferencia

## APIs

### Endpoints Implementados ✅

```typescript
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
//   }>,
//   suggestedOpeningAmount: number  // monto del cierre anterior
// }

// POST /api/cash/open
// Body: { 
//   amount: number,
//   responsibleId?: string // Opcional, por defecto es el usuario actual
// }
// Error: 400 si ya hay caja abierta o responsable inválido
// Success: 201 con datos del opening creado

// POST /api/cash/income
// Body: {
//   amount: number,
//   method: string,
//   reason: string,
//   notes?: string
// }
// Error: 400 si caja cerrada
// Success: 201 con datos del income creado

// POST /api/cash/expense
// Body: { 
//   amount: number,
//   method: string,  // CASH, TRANSFER, etc.
//   reason: string, // motivo obligatorio
//   notes?: string  // opcional
// }
// Error: 400 si caja cerrada o monto inválido
// Success: 201 con datos del expense creado

// POST /api/cash/close
// Body: { 
//   counts: Record<string, number>, // método: monto contado
//   differenceReason?: string // obligatorio si hay diferencia
// }
// Error: 400 si no hay caja abierta o falta explicación
// Success: 201 con closing + differences calculadas
//         Crea ADJUSTMENT automático por cada diferencia
```

### Endpoints Implementados (continuación) ✅

```typescript
// GET /api/cash/history?limit=30&page=1
// Response: {
//   history: Array<{
//     id: string,
//     date: string,
//     openedBy: string,        // Quién ejecutó la apertura
//     responsibleBy: string,     // Quién opera la caja (responsable de turno)
//     closedBy: string,
//     difference: number,
//     differenceReason?: string,
//     totalIncome: number,
//     totalExpense: number,
//     isClosed: boolean,
//     status: 'BALANCED' | 'SURPLUS' | 'SHORTAGE' | 'OPEN'
//   }>,
//   pagination: { page, limit, totalCount, totalPages, hasMore }
// }
// Para: Tab "Historial de Arqueos" en la vista

// GET /api/users?role=staff,admin&active=true
// Response: { users: Array<{ id, name, email, role, isActive }> }
// Para: Selector de responsable en modal de apertura
// Permisos: STAFF o ADMIN
```

## Reglas de Negocio

1. **Solo una caja abierta**: No se puede abrir si ya existe OPENING del día sin CLOSING
2. **Cierre obligatorio**: Solo ADMIN puede forzar apertura sobre caja sin cerrar del día anterior
3. **Egresos limitados**: No se puede registrar egreso en efectivo si excede saldo disponible
4. **Bloqueo por caja cerrada**: Con la caja cerrada (o sin abrir) no se pueden realizar ventas ni registrar pagos de OTs. El sistema debe bloquear estas operaciones tanto en el BFF como en la UI.
5. **Auditoría**: Toda diferencia debe tener motivo documentado
6. **Permisos**:
   - Abrir/Cerrar: ADMIN, STAFF
   - Registrar ingresos/egresos: ADMIN, STAFF
   - Ver historial completo: ADMIN, STAFF
   - Ver usuarios STAFF/ADMIN: ADMIN, STAFF

## Criterios de Aceptación

- [x] Usuario puede abrir caja ingresando monto inicial
- [x] **Usuario puede seleccionar responsable/cajero de turno al abrir**
- [x] **Usuario puede registrar ingresos manuales con motivo**
- [x] Usuario puede registrar egresos con motivo
- [x] Sistema muestra desglose por método de pago en tiempo real
- [x] Usuario puede cerrar caja ingresando conteo físico
- [x] Sistema calcula y muestra diferencias antes de confirmar cierre
- [x] Diferencias se registran con motivo obligatorio
- [x] Historial de arqueos accesible desde la vista con paginación
- [x] Trazabilidad dual: createdBy vs responsibleBy visible en historial
- [x] Sin caja abierta, no se pueden registrar egresos/ingresos manuales
- [ ] **Bloqueo preventivo**: El botón de "Venta Rápida" y el registro de pagos de OTs deben estar deshabilitados si la caja no está abierta.

## Dependencias
- Modelo `cash_movement` existente
- Sistema de autenticación y roles
- APIs de pagos existentes (para integrar ventas automáticas)
