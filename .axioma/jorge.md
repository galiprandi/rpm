## 📋 BACKLOG
- [ ] Checklist Customization — Allow editing the labels of the entry/exit checklists.
- [ ] Photo Management — Bulk upload and deletion of work order photos.
- [ ] Printing — Standardized PDF generation for Remitos and Budgets.

## ✅ DONE
- [x] 2025-07-08 — Centralized WO Service & Unified Timeline (PR #jorge/work-orders/centralized-updates)

## 🧠 LEARNINGS
## 2025-07-08 - Kanban UX & Event Propagation
**Learning:** Nested interactive elements in Kanban cards (like technician dropdowns) require both onMouseDown and onClick stop-propagation to prevent Link navigation and drag-start conflicts.
**Action:** Use the "Kanban Navigation Guard Pattern" for all future board-like interfaces.

## 2025-07-08 - Centralized Side Effects
**Learning:** Moving side effects like stock movements and auto-invoicing to a centralized service prevents logic fragmentation and double-triggering during Kanban drag-and-drop.
**Action:** Always return a boolean status-change flag from update services to allow callers to trigger conditional UI feedback or external notifications.
