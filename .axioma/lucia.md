# 📓 Journal — Lucía 👥

## 📋 BACKLOG

## ✅ DONE
- [x] 2025-07-08 — Notificaciones de deuda por WhatsApp y contacto rápido en vehículos (PR lucia/customers/debt-whatsapp-notif)
- [x] 2025-07-06 — Implementación de validación de patentes argentinas en `VehicleForm` (PR lucia/customers/plate-validation)
- [x] 2025-07-05 — Implementación del listado global de vehículos en `/adm/vehicles` (PR lucia/customers/global-vehicles-list)
- [x] 2025-05-15 — Refactor de `VehicleForm` y habilitación de edición de vehículos (PR lucia/customers/vehicle-edit-refactor)
- [x] 2025-05-15 — Integración de enlaces directos de WhatsApp en listado y detalle de clientes (PR lucia/customers/vehicle-edit-refactor)

## 🧠 LEARNINGS
## 2025-07-08 - Notificaciones Contextuales
**Learning:** La integración de herramientas de comunicación (WhatsApp) directamente en los puntos de fricción (reporte de deudores, ficha con saldo) reduce drásticamente el esfuerzo operativo. Usar mensajes pre-formateados asegura profesionalismo y consistencia en el trato con el cliente.
**Action:** Continuar identificando flujos donde el contacto con el cliente sea una acción primaria (ej: recordatorio de turnos) para automatizar el mensaje inicial.

## 2025-07-06 - Validación de Patentes Argentinas
**Learning:** La implementación de validaciones específicas de dominio (como patentes) mejora significativamente la calidad de la data y previene errores comunes de tipeo. Proporcionar "hints" visuales sobre el formato esperado reduce la frustración del usuario ante fallos de validación.
**Action:** Aplicar este patrón de "Validation + Hint" en otros campos críticos como CUIT o Teléfonos para mejorar la consistencia del sistema.

## 2025-05-15 - Refactor de Formulario de Vehículos
**Learning:** La extracción de componentes de formulario (`VehicleForm`) desde diálogos (`VehicleDialog`) facilita enormemente la implementación de funcionalidades de edición ("Edit") manteniendo la consistencia visual y de validación.
**Action:** Seguir este patrón de "Form Extract" para futuras entidades (ej: Clientes) para permitir edición rápida sin duplicar lógica de UI.

## 2025-05-15 - UX de Comunicación
**Learning:** Los usuarios administrativos valoran la reducción de clics para tareas frecuentes como contactar a un cliente. Los iconos de WhatsApp con enlaces pre-formateados en el listado principal ahorran tiempo significativo de navegación.
**Action:** Considerar la inclusión de acciones rápidas de contacto en todos los listados donde el "Propietario" o "Cliente" sea una columna primaria.
