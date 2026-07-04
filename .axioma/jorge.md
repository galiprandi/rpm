## 📋 BACKLOG
- [ ] Agregar filtro rápido por técnico en el listado/kanban
- [ ] Implementar "Quick Actions" al pasar el mouse sobre una tarjeta de Kanban (ej: llamar, whatsapp, cambiar técnico)

## ✅ DONE
- [x] 2025-07-03 — Mejora visual del Kanban: icono de demora más intuitivo y totales por columna (PR #jorge/work-orders/kanban-ux-refinement)
- [x] 2026-07-04 — Gestión de técnicos y Quick Actions en Kanban (PR #jorge/work-orders/technician-and-quick-actions)

## 🧠 LEARNINGS
## 2025-07-03 - Visibilidad Financiera en Kanban
**Learning:** El usuario (dueño de taller) valora mucho saber cuánta plata tiene "trabajando" en cada etapa sin tener que entrar a cada orden.
**Action:** Implementar totales monetarios por columna en vistas de tipo Kanban para otros módulos si aplica.

## 2026-07-04 - Interacción en Elementos Draggable
**Learning:** Al añadir botones de acción dentro de elementos arrastrables (como tarjetas de Kanban), es vital usar `onMouseDown={(e) => e.stopPropagation()}` para evitar que el click inicie un arrastre no deseado y la acción se ignore.
**Action:** Aplicar este patrón en cualquier overlay de acción rápida dentro de listas con Drag & Drop.
