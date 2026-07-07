## 📋 BACKLOG
- [ ] Agregar filtro rápido por técnico en el listado/kanban
- [ ] Implementar "Quick Actions" al pasar el mouse sobre una tarjeta de Kanban (ej: llamar, whatsapp, cambiar técnico)

## ✅ DONE
- [x] 2025-07-03 — Mejora visual del Kanban: icono de demora más intuitivo y totales por columna (PR #jorge/work-orders/kanban-ux-refinement)
- [x] 2026-07-04 — Gestión de técnicos y Quick Actions en Kanban (PR #jorge/work-orders/technician-and-quick-actions)
- [x] 2026-07-05 — Implementación de buscador global y refinamiento de barra de filtros (PR #jorge/work-orders/search-and-filter-refinement)
- [x] 2026-07-06 — Línea de Tiempo unificada con historial de auditoría detallado (PR #jorge/work-orders/unified-audit-timeline-and-ux)

## 🧠 LEARNINGS
## 2025-07-03 - Visibilidad Financiera en Kanban
**Learning:** El usuario (dueño de taller) valora mucho saber cuánta plata tiene "trabajando" en cada etapa sin tener que entrar a cada orden.
**Action:** Implementar totales monetarios por columna en vistas de tipo Kanban para otros módulos si aplica.

## 2026-07-04 - Interacción en Elementos Draggable
**Learning:** Al añadir botones de acción dentro de elementos arrastrables (como tarjetas de Kanban), es vital usar `onMouseDown={(e) => e.stopPropagation()}` para evitar que el click inicie un arrastre no deseado y la acción se ignore.
**Action:** Aplicar este patrón en cualquier overlay de acción rápida dentro de listas con Drag & Drop.

## 2026-07-05 - Filtrado Eficiente y UX de Búsqueda
**Learning:** En módulos con volumen moderado de datos, el filtrado por cliente/vehículo debe ser instantáneo. Seguir el patrón de "Form UX Enhancement" con iconos internos en inputs y botones de "limpiar" reduce significativamente la carga cognitiva del usuario.
**Action:** Estandarizar la barra de filtros en otros listados administrativos (Clientes, Productos) siguiendo este mismo esquema de segmentado + búsqueda + selects con iconos.

## 2026-07-06 - Auditoría y Trazabilidad en el Taller
**Learning:** La trazabilidad es crítica en entornos multi-usuario. Mostrar "quién cambió qué" directamente en la línea de tiempo principal (en lugar de una tabla de logs separada) humaniza el historial y facilita la resolución de dudas sobre el proceso de una OT.
**Action:** Integrar logs de auditoría en las vistas de "Historial" de otros módulos clave (como Ventas o Vehículos) usando el mismo patrón de línea de tiempo unificada.
