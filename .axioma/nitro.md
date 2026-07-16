# Nitro 🤖 Journal

## 📋 BACKLOG
- [ ] Voice-to-text integration for noisy workshop environment.
- [ ] Contextual QR code scanning from within the chat panel.
- [ ] Direct photo attachments for work order checklist items.

## ✅ DONE
- [x] 2026-03-28 — Initial audit of bot tools, removal of mock tools, fixing conversation history unit tests, and implementing major UI/UX improvements (smart scrolling, success states for tool execution, empty-state quick start suggestion chips, and full WCAG accessibility).
- [x] 2026-07-16 — Polish chat window UX with comprehensive icon-only button tooltips, improve keyboard navigation for suggestion chips, and refine text contrast for completed check icons and error state panels to meet WCAG AA standards.
- [x] 2026-07-16 — Implement Clear Conversation button in the chat header, stop active stream and reset attachments, input, and errors cleanly, and disable the auto-focus logic on mobile to prevent virtual keyboard hijacking on load.

## 🧠 LEARNINGS
### 2026-03-28 — Micro-UX & Settle States
**Learning:** Abruptly hiding tool states when they finish executing (`output-available`) causes rapid layout shifting and cognitive disconnect. Retaining completed tool indicators with clear success icons provides visual closure and high UX quality.
**Action:** Always transition from dynamic loading states to a static "completed/checked" state instead of simple deletion.

### 2026-03-28 — Scrolling Hijack Prevention
**Learning:** Forcing page/chat scrolling to the bottom on every token stream can annoy users who scrolled up to read previous instructions.
**Action:** Restrict auto-scroll to cases where the scroll position is already at the bottom or the action was initiated by a user submit.

### 2026-07-16 — Accessibility & High Contrast Interactive Elements
**Learning:** Icon-only interactive elements lack affordance for users with low vision or cognitive limitations. Wrapping them with Radix-powered accessible Tooltips improves both click confidence and accessibility. Furthermore, ensuring 700-weight colors (like `text-red-700` and `text-emerald-700`) on light/muted backgrounds complies with WCAG AA 4.5:1 minimum contrast guidelines.
**Action:** Wrap all secondary/icon-only controls with accessible tooltips and use 700-weight semantic colors for status typography on light surfaces.

### 2026-07-16 — Mobile Viewport & Virtual Keyboards
**Learning:** Automatically focusing on inputs when loading a chat modal/drawer on mobile devices causes virtual keyboards to immediately slide up, obstructing quick suggestions/welcome chips and requiring users to dismiss them. Disabling auto-focus on mobile devices improves user delight and scannability.
**Action:** Restrict auto-focus hooks to desktop viewports using dynamic width checks (e.g. `!isMobile`).

### 2026-07-16 — Session Reset Cleanliness
**Learning:** Clearing a chat conversation shouldn't just set the messages array to empty; it should also gracefully reset the stream's error states (`clearError`), cancel active runs (`stop`), clear file attachments, and clean the text input to ensure a completely clean state.
**Action:** Provide holistic reset handlers that bind client-side states, stream states, and input files in one single click action.
