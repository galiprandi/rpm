## 📋 BACKLOG
- [ ] Photo Management — Bulk upload and deletion of work order photos.
- [ ] Gestión de Fotos — Carga y eliminación masiva de fotos de órdenes de trabajo.
- [x] Printing — Standardized PDF generation for Remitos and Budgets.
- [x] Impresión — Generación estandarizada de PDF para Remitos y Presupuestos.
- [x] Fecha programada en Kanban: muestre y resalte las fechas programadas en las tarjetas Kanban.

## ✅ COMPLETADO
- [x] 2025-07-08 — Servicio Centralizado de OT y Timeline Unificado (PR #jorge/work-orders/centralized-updates)
- [x] 2025-07-12 — Refinamiento de UX en Taller: Acciones Rápidas y Navegación (PR #jorge/work-orders/ux-refinement)
- [x] 2026-07-16 — Paridad de Vista de Lista y Corrección de Prioridad HOY (PR #jorge/work-orders/list-view-parity)
- [x] 2026-07-16 — Checklist Estándar e Interactivo en Taller (PR #jorge/work-orders/checklists-refactor)
- [x] 2026-07-18 — Impresión Estandarizada de Remitos y Presupuestos (PR #jorge/work-orders/standardized-printing)

## 🧠 APRENDIZAJES
## 2025-07-08 - UX Kanban y Propagación de Eventos
**Aprendizaje:** Los elementos interactivos anidados en tarjetas Kanban (como dropdowns de técnicos) requieren stop-propagation tanto en onMouseDown como en onClick para evitar la navegación del Link y conflictos con el inicio del arrastre.
**Acción:** Usar el "Patrón Guardián de Navegación Kanban" para todas las futuras interfaces tipo tablero.

## 2025-07-08 - Efectos Secundarios Centralizados
**Aprendizaje:** Mover los efectos secundarios como movimientos de stock y facturación automática a un servicio centralizado evita la fragmentación de lógica y el doble disparo durante el drag-and-drop del Kanban.
**Acción:** Siempre devolver un flag booleano de cambio de estado desde los servicios de actualización para permitir que los llamadores disparen retroalimentación condicional de UI o notificaciones externas.

## 2025-07-12 - Acciones Rápidas en Kanban
**Aprendizaje:** Las acciones rápidas en tarjetas Kanban (hover buttons) reducen drásticamente la fricción para flujos lineales de trabajo, evitando la necesidad de drag-and-drop para transiciones comunes.
**Acción:** Implementar el patrón `NEXT_STATUS_MAP` para guiar al usuario hacia la siguiente acción lógica en el flujo de negocio.

## 2026-07-16 - Checklists Interactivos y Resilientes
**Aprendizaje:** Almacenar checklists como datos serializados es flexible, pero requiere que las operaciones de actualización (PUT/POST) realicen merges seguros (preservando marcas de tiempo como `completedAt`) para evitar regresiones de datos. La inicialización con plantillas unificadas directamente en la interfaz de detalle elimina la necesidad de re-crear OTs completas para agregar protocolos faltantes.
**Acción:** Siempre fusionar campos de forma granular en APIs que operen sobre documentos JSON embebidos.

## 2026-07-18 - Emulación de Impresión y Contenido de Documentos
**Aprendizaje:** El uso de emulación de medios de impresión (`page.emulate_media(media="print")`) en Playwright facilita enormemente la auditoría y validación visual automatizada de layouts que de otra manera no son fácilmente verificables en pantalla normal. Asimismo, estructurar secciones de despacho (origen/destino) para remitos y cláusulas de validez/precio para presupuestos entrega un nivel de profesionalismo indispensable en documentos de taller y ventas.
**Acción:** Siempre usar emulación de impresión y validación con capturas de pantalla para todos los comprobantes y reportes imprimibles.
