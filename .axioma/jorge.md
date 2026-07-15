## 📋 BACKLOG
- [ ] Checklist Customization — Allow editing the labels of the entry/exit checklists.
- [ ] Photo Management — Bulk upload and deletion of work order photos.
- [ ] Printing — Standardized PDF generation for Remitos and Budgets.
- [ ] Personalización de Checklist — Permitir editar las etiquetas de los checklists de entrada/salida.
- [ ] Gestión de Fotos — Carga y eliminación masiva de fotos de órdenes de trabajo.
- [ ] Impresión — Generación estandarizada de PDF para Remitos y Presupuestos.
- [ ] Fecha programada en Kanban: muestre y resalte las fechas programadas en las tarjetas Kanban.

## ✅ COMPLETADO
- [x] 2025-07-15 — Paridad Kanban-Lista y Mejora de Priorización HOY (PR #jorge/work-orders/list-view-parity)
- [x] 2025-07-08 — Servicio Centralizado de OT y Timeline Unificado (PR #jorge/work-orders/centralized-updates)
- [x] 2025-07-12 — Refinamiento de UX en Taller: Acciones Rápidas y Navegación (PR #jorge/work-orders/ux-refinement)

## 🧠 APRENDIZAJES
## 2025-07-15 - Paridad UI y Propagación en Listas
**Aprendizaje:** Al agregar elementos interactivos (botones, dropdowns) dentro de filas de lista que son enlaces (`Link`), es imperativo usar `e.stopPropagation()` y `e.preventDefault()` en los eventos de clic para evitar que la acción del botón dispare accidentalmente la navegación de la fila.
**Acción:** Implementar este patrón de "aislamiento de interactividad" en todas las vistas de lista que utilicen el patrón de fila-enlace.

## 2025-07-15 - Robustez en Comparación de Fechas "Hoy"
**Aprendizaje:** El uso de `toDateString()` es el método más fiable para comparar si una fecha cae en el día actual del servidor/cliente, evitando errores por componentes de tiempo (horas/minutos) o desfases menores de milisegundos.
**Acción:** Estandarizar el uso de `scheduledDate.toDateString() === new Date().toDateString()` para badges de prioridad temporal.
## 2025-07-08 - UX Kanban y Propagación de Eventos
**Aprendizaje:** Los elementos interactivos anidados en tarjetas Kanban (como dropdowns de técnicos) requieren stop-propagation tanto en onMouseDown como en onClick para evitar la navegación del Link y conflictos con el inicio del arrastre.
**Acción:** Usar el "Patrón Guardián de Navegación Kanban" para todas las futuras interfaces tipo tablero.

## 2025-07-08 - Efectos Secundarios Centralizados
**Aprendizaje:** Mover los efectos secundarios como movimientos de stock y facturación automática a un servicio centralizado evita la fragmentación de lógica y el doble disparo durante el drag-and-drop del Kanban.
**Acción:** Siempre devolver un flag booleano de cambio de estado desde los servicios de actualización para permitir que los llamadores disparen retroalimentación condicional de UI o notificaciones externas.

## 2025-07-12 - Acciones Rápidas en Kanban
**Aprendizaje:** Las acciones rápidas en tarjetas Kanban (hover buttons) reducen drásticamente la fricción para flujos lineales de trabajo, evitando la necesidad de drag-and-drop para transiciones comunes.
**Acción:** Implementar el patrón `NEXT_STATUS_MAP` para guiar al usuario hacia la siguiente acción lógica en el flujo de negocio.
