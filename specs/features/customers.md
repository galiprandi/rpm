🚦 Estado: 🟡 Parcialmente implementado (Lógica en API routes, refactor a servicio en progreso)

# Clientes y Cuentas Corrientes

## 1. Propósito / Alcance
Gestionar la base de datos de clientes, sus vehículos asociados (para el taller) y sus cuentas corrientes (crédito y saldos a favor). Permite tener un registro histórico de ventas, pagos parciales y devoluciones por cliente.

## 2. Casos de Uso Principales (Flujos de éxito)
- **Gestión de Cliente**: ABM (Alta, Baja, Modificación) de un cliente con datos de contacto y datos fiscales (CUIT/IVA).
- **Vehículos**: Vincular uno o más vehículos a un cliente por número de patente/identificador.
- **Cuenta Corriente (Crédito)**: Vender a un cliente "a cuenta", generando una deuda que actualiza el campo `balance` del cliente.
- **Saldos a favor**: Registro de notas de crédito que pueden impactar en el balance positivo del cliente.
- **Creación vía Bot**: "Nitro, crea un cliente con nombre Pedro Corbalán" -> El bot recopila datos, muestra resumen y pide confirmación antes de crear.

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: No emite resúmenes de cuenta en PDF de forma automatizada en esta fase.
- **RES-02**: Los clientes no tienen portal de acceso propio.

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1**: El balance del cliente se actualiza automáticamente al crear una OT o realizar una venta directa a cuenta.
- **Límite 2**: No se puede eliminar un cliente que tiene historial de transacciones (solo desactivar).
- **Validación 1**: Los pagos realizados por el cliente se registran como `cash_movement` con `referenceType: 'customer_payment'`.
- **Validación 2**: Para crear clientes vía bot, se requiere confirmación explícita del usuario antes de ejecutar la creación.

## 5. Dependencias Técnicas Clave
- **Tablas BD**: `customer`, `vehicle`, `cash_movement`
- **Servicios**: `customerService.ts` (pendiente de extraer de `/api/customers`).
- **Rutas API**: `/api/customers`, `/api/reports/debtors`
