## 📋 BACKLOG
- [ ] Personalización de Checklist — Permitir editar las etiquetas de los checklists de entrada/salida.
- [ ] Gestión de Fotos — Carga y eliminación masiva de fotos de órdenes de trabajo.
- [ ] Impresión — Generación estandarizada de PDF para Remitos y Presupuestos.

## ✅ COMPLETADO
- [x] 2025-07-08 — Servicio Centralizado de OT y Timeline Unificado (PR #jorge/work-orders/centralized-updates)

## 🧠 APRENDIZAJES
## 2025-07-08 - UX Kanban y Propagación de Eventos
**Aprendizaje:** Los elementos interactivos anidados en tarjetas Kanban (como dropdowns de técnicos) requieren stop-propagation tanto en onMouseDown como en onClick para evitar la navegación del Link y conflictos con el inicio del arrastre.
**Acción:** Usar el "Patrón Guardián de Navegación Kanban" para todas las futuras interfaces tipo tablero.

## 2025-07-08 - Efectos Secundarios Centralizados
**Aprendizaje:** Mover los efectos secundarios como movimientos de stock y facturación automática a un servicio centralizado evita la fragmentación de lógica y el doble disparo durante el drag-and-drop del Kanban.
**Acción:** Siempre devolver un flag booleano de cambio de estado desde los servicios de actualización para permitir que los llamadores disparen retroalimentación condicional de UI o notificaciones externas.
