## 📋 BACKLOG
- [ ] Idea pendiente — breve descripción

## ✅ COMPLETADO
- [x] 2026-08-03 — Historial de Servicios y Duplicación de Ítems en Asistente de Creación de OT (PR jorge/work-orders/wizard-vehicle-history)
- [x] 2026-07-31 — Controles Interactivos de Estado y Técnico en Vista de Lista de OT (PR #jorge/work-orders/list-view-interactive-controls)
- [x] 2026-07-30 — Atajos de Fecha de Entrega y Resumen de Ítems en Kanban/Lista (PR #jorge/work-orders/scheduled-date-items-summary)
- [x] 2026-07-29 — Duplicación/Clonación de Órdenes de Trabajo desde Detalle e Historial con Resguardo de Borrador (PR #jorge/work-orders/duplicate-work-order-ux)
- [x] 2026-07-28 — Atajo de "Marcar todos como OK" en checklists de ingreso y egreso en creación y edición de OT (PR #jorge/work-orders/checklist-bulk-toggle)
- [x] 2026-07-27 — Selector de Estado Interactivo en Detalle de OT (PR #jorge/work-orders/status-select-header)
- [x] 2026-07-26 — Historial de Órdenes de Trabajo del Vehículo en Detalle de OT (PR #jorge/work-orders/vehicle-history-tab)
- [x] 2026-07-24 — Bloqueo de Estados Terminales y Reversión de Saldos por Cancelación de OT (PR #jorge/work-orders/cancelled-terminal-states)
- [x] 2026-07-23 — Búsqueda por Cliente y Pre-carga de Cuenta en Alta de OT (PR #jorge/work-orders/preloaded-customer-search)
- [x] 2026-07-22 — Indicadores Visuales de Checklist/Fotos y Exportación CSV en Taller (PR #jorge/work-orders/enhanced-metadata-csv-export)
- [x] 2026-07-21 — Botones de Filtro Rápido en Taller: Demoradas y Turnos de Hoy (PR #jorge/work-orders/quick-filters)
- [x] 2026-07-20 — Gestión de Fotos — Carga y eliminación masiva de fotos de órdenes de trabajo (PR jorge/work-orders/photo-management)
- [x] 2026-07-18 — Impresión Estandarizada de Remitos y Presupuestos (PR #jorge/work-orders/standardized-printing)
- [x] 2026-07-16 — Checklist Estándar e Interactivo en Taller (PR #jorge/work-orders/checklists-refactor)
- [x] 2026-07-16 — Paridad de Vista de Lista y Corrección de Prioridad HOY (PR #jorge/work-orders/list-view-parity)
- [x] 2025-07-12 — Refinamiento de UX en Taller: Acciones Rápidas y Navegación (PR #jorge/work-orders/ux-refinement)
- [x] 2025-07-08 — Servicio Centralizado de OT y Timeline Unificado (PR #jorge/work-orders/centralized-updates)

## 🧠 APRENDIZAJES
## 2026-08-03 - Historial de Servicios y Duplicación de Ítems en Asistente de Creación de OT
**Aprendizaje 1:** Integrar el historial de servicios de un vehículo directamente en el asistente de creación de órdenes de trabajo (Step 1) dota a los recepcionistas y técnicos de un contexto inmediato sumamente valioso sobre reparaciones previas, recomendaciones pasadas e ítems instalados sin forzarlos a navegar a la ficha del vehículo en una pestaña secundaria.
**Aprendizaje 2:** Al anidar un botón de "Cargar ítems" en el historial de servicios dentro de la creación, se resuelve una enorme fricción administrativa al permitir clonar todo un listado de productos y servicios anteriores directamente en el borrador actual en un solo clic, redirigiendo de manera natural a la pantalla de revisión (Paso 2).
**Aprendizaje 3:** Para resguardar el trabajo en curso del usuario, siempre se debe consultar mediante un diálogo de confirmación `confirm` antes de sobreescribir la lista de ítems del borrador si el usuario ya tiene ítems cargados. Esto requiere el uso correcto de las propiedades de tipado de `ConfirmOptions` (p. ej., usar `description` en lugar de `message`, y `confirmText` / `cancelText` para los botones interactivos).

## 2026-07-31 - Controles Interactivos de Estado y Técnico en Vista de Lista de OT
**Aprendizaje 1:** En dispositivos móviles, la vista de lista es la predeterminada y única disponible. Forzar a los usuarios a navegar al detalle de cada orden de trabajo individual para tareas simples como cambiar de técnico o actualizar el estado de la OT genera una enorme fricción y ralentiza el flujo operativo de taller. Reemplazar los textos estáticos con menús desplegables (`DropdownMenu`) inline dota de una velocidad excepcional a la gestión desde cualquier dispositivo móvil o tablet.
**Aprendizaje 2:** Al anidar elementos interactivos complejos (como dropdowns con portales) dentro de contenedores clickeables (como filas envueltas en `<Link>`), es imperativo bloquear la propagación del evento tanto en `onMouseDown` como en `onClick` a nivel del trigger. Esto asegura que la selección de un menú no dispare la navegación general del enlace, preservando la consistencia y usabilidad de la UI.
**Aprendizaje 3:** Para respetar estrictamente las reglas de estados terminales, deshabilitar visualmente y funcionalmente los triggers de los dropdowns (añadiendo estilos de `cursor-not-allowed opacity-60`) cuando el estado de la OT is `"CANCELLED"` o `"DELIVERED"` previene cambios accidentales y mantiene la integridad transaccional de los datos sin requerir validaciones intrusivas posteriores.
