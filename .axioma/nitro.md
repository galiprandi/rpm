# Nitro 🤖 Journal

## 📋 BACKLOG
- [ ] Voice-to-text integration for noisy workshop environment.
- [ ] Contextual QR code scanning from within the chat panel.
- [ ] Direct photo attachments for work order checklist items.

## ✅ DONE
- [x] 2026-03-28 — Initial audit of bot tools, removal of mock tools, fixing conversation history unit tests, and implementing major UI/UX improvements (smart scrolling, success states for tool execution, empty-state quick start suggestion chips, and full WCAG accessibility).

## 🧠 LEARNINGS
### 2026-03-28 — Micro-UX & Settle States
**Learning:** Abruptly hiding tool states when they finish executing (`output-available`) causes rapid layout shifting and cognitive disconnect. Retaining completed tool indicators with clear success icons provides visual closure and high UX quality.
**Action:** Always transition from dynamic loading states to a static "completed/checked" state instead of simple deletion.

### 2026-03-28 — Scrolling Hijack Prevention
**Learning:** Forcing page/chat scrolling to the bottom on every token stream can annoy users who scrolled up to read previous instructions.
**Action:** Restrict auto-scroll to cases where the scroll position is already at the bottom or the action was initiated by a user submit.
