🚦 Estado: 🟡 Parcialmente implementado (Lógica en API routes, pendiente refactor a servicios)

# Gestión de Taller y Órdenes de Trabajo (OT)

## 1. Propósito / Alcance
Digitalizar el flujo completo del taller mecánico/instalación, desde el ingreso del vehículo hasta su entrega. Involucra la creación de Órdenes de Trabajo (OTs), asignación de técnicos, registro de estado (Kanban), checklists de calidad y registro fotográfico.

## 2. Casos de Uso Principales (Flujos de éxito)
- **Ingreso de Vehículo**: Creación de OT vinculada a un cliente, vehículo y un detalle de servicios a realizar.
- **Asignación y Estado**: Cambio de estado de la OT (`PENDING`, `CONFIRMED`, `IN_PROGRESS`, `READY`, `DELIVERED`) y asignación a un técnico.
- **Checklists**: Llenado de checklist de ingreso (Json) y checklist de calidad de salida.
- **Registro Fotográfico**: Subida de fotos asociadas a la OT en la tabla `photo`.
- **Facturación de OT**: Las OTs generan deuda en la cuenta corriente del cliente y pueden vincularse a una factura.

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: No gestiona turnos interactivos complejos en esta fase.
- **RES-02**: El tiempo de mano de obra se registra por estados, no por cronómetro en tiempo real.

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1**: Al crear una OT, se actualiza automáticamente el saldo (balance) del cliente como deuda.
- **Límite 2**: Soporta la creación rápida de vehículos y marcas/modelos inexistentes durante el alta de la OT.
- **Validación 1**: Los cambios de estado críticos se registran en `work_order_audit_log`.

## 5. Dependencias Técnicas Clave
- **Tablas BD**: `work_order`, `vehicle`, `work_order_item`, `photo`, `work_order_audit_log`
- **Componentes UI**: Tablero Kanban, formularios de checklists.
- **Rutas API**: `/api/work-orders`, `/api/vehicles`, `/api/vehicle-makes`, `/api/vehicle-models`
