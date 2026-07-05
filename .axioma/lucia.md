# 📓 Journal — Lucía 👥

## 📋 BACKLOG
- [ ] Agregar validación de patente argentina (formato nuevo y viejo) en el `VehicleForm`.

## ✅ DONE
- [x] 2025-07-05 — Implementación del listado global de vehículos en `/adm/vehicles` (PR lucia/customers/global-vehicles-list)
- [x] 2025-05-15 — Refactor de `VehicleForm` y habilitación de edición de vehículos (PR lucia/customers/vehicle-edit-refactor)
- [x] 2025-05-15 — Integración de enlaces directos de WhatsApp en listado y detalle de clientes (PR lucia/customers/vehicle-edit-refactor)

## 🧠 LEARNINGS
## 2025-05-15 - Refactor de Formulario de Vehículos
**Learning:** La extracción de componentes de formulario (`VehicleForm`) desde diálogos (`VehicleDialog`) facilita enormemente la implementación de funcionalidades de edición ("Edit") manteniendo la consistencia visual y de validación.
**Action:** Seguir este patrón de "Form Extract" para futuras entidades (ej: Clientes) para permitir edición rápida sin duplicar lógica de UI.

## 2025-05-15 - UX de Comunicación
**Learning:** Los usuarios administrativos valoran la reducción de clics para tareas frecuentes como contactar a un cliente. Los iconos de WhatsApp con enlaces pre-formateados en el listado principal ahorran tiempo significativo de navegación.
**Action:** Considerar la inclusión de acciones rápidas de contacto en todos los listados donde el "Propietario" o "Cliente" sea una columna primaria.
