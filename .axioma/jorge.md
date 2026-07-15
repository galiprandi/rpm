# Jorge 🦾 — Journal de Órdenes de Trabajo

## 📋 BACKLOG
- [ ] Photo Management — Bulk upload and deletion of work order photos.
- [ ] Quick Status Actions — Expand the quick status transitions in Kanban for more states.
- [ ] Technician Efficiency Report — Add a small widget in the WO detail showing estimated vs actual time if available.

## ✅ DONE
- [x] 2025-07-15 — Checklist Standardization & Interactive UX (PR #pending)
  - Centralized default checklists in `lib/constants/work-order.ts`.
  - Added "Completar Checklist" action for missing entry/exit checklists.
  - Improved API to support partial and full checklist updates.
  - Enhanced Detail View with interactive item toggling and real-time persistence.
  - Aligned Creation Wizard with the new shared constants.

## 🧠 LEARNINGS

### 2025-07-15 — Centralización de Lógica de Negocio
**Learning:** Mantener los templates de checklist en constantes compartidas no solo mejora la consistencia entre el Wizard de creación y la vista de detalle, sino que facilita futuras actualizaciones del protocolo de inspección sin tocar múltiples archivos UI.
**Action:** Seguir extrayendo configuraciones de "pasos" o "protocolos" a archivos de constantes en lugar de hardcodearlos en componentes.

### 2025-07-15 — UX de Gating en Checklists
**Learning:** Inicialmente, el gating de la UI impedía mostrar los items inmediatamente después de hacer click en "Completar". Ajustar el estado local para reflejar el cambio de "modo inicialización" a "modo edición" inmediatamente mejora drásticamente la percepción de velocidad.
**Action:** Al inicializar datos desde el cliente, asegurar que el estado UI se actualice en tándem con el guardado para evitar flashes de "sin datos".
