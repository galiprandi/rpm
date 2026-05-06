🚦 Estado: 🟡 Parcialmente implementado

# Gestión de Taller y Órdenes de Trabajo (OT)

## 1. Propósito / Alcance
Digitalizar el flujo completo del taller mecánico/instalación, desde el ingreso del vehículo hasta su entrega. Involucra la creación de Órdenes de Trabajo (OTs), asignación de técnicos, registro de estado (Kanban), checklists de calidad y registro fotográfico.

## 2. Casos de Uso Principales (Flujos de éxito)
- **Ingreso de Vehículo**: Creación de OT vinculada a un cliente, vehículo y un detalle de servicios a realizar.
- **Asignación y Estado**: Cambio de estado de la OT (`PENDING`, `IN_PROGRESS`, `READY`, `DELIVERED`) y asignación a un técnico.
- **Checklists**: Llenado de checklist de ingreso (estado del vehículo) y checklist de calidad de salida.
- **Registro Fotográfico**: Subida de fotos del "antes" y "después" del trabajo realizado.
- **Facturación de OT**: Conversión de una OT terminada en una venta/factura final.

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: No gestiona turnos u horarios estrictos tipo calendario interactivo (se hace en la web pública).
- **RES-02**: El tiempo de mano de obra no se calcula automáticamente cronometrando al técnico.

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1**: No se puede cambiar a estado `DELIVERED` si hay pagos pendientes o facturación no completada (dependiendo de la regla de negocio configurada).
- **Límite 2**: El checklist de salida es obligatorio para pasar a estado `READY`.
- **Validación 1**: Cada cambio de estado registra el usuario y la fecha para auditoría de tiempos.

## 5. Dependencias Técnicas Clave
- **Tablas BD**: `WorkOrder`, `Vehicle`, `Checklist`, `WorkOrderItem`
- **Componentes UI**: Tablero Kanban para visualización de OTs.
- **Dependencias**: Integración con el módulo de productos para descontar materiales usados en el taller.
