# Nitro 🤖 Journal

## 📋 BACKLOG
- [ ] Voice-to-text integration for noisy workshop environment.
- [ ] Contextual QR code scanning from within the chat panel.
- [ ] Direct photo attachments for work order checklist items.

## ✅ DONE
- [x] 2026-07-21 — Implement dynamic context-aware suggestions, accidental-wipe protection (double click clear confirm), robust session persistence, friendly client-side error formatting, and Escape key stream cancellation.
- [x] 2026-07-20 — Group adjacent confirmation actions inline, restrict interaction buttons to the latest assistant message, add Alt+1 to Alt+4 keyboard shortcuts for empty-state suggestion chips with visual badges, and author a comprehensive component unit test suite.
- [x] 2026-07-25 — Integrate registerVehicle tool for existing customers standalone registration, map its visual states in ChatFloating component, document it in base instructions, and restore/refine the chatbot UI/UX enhancements (PR #212).
- [x] 2026-07-16 — Implement Clear Conversation button in the chat header, stop active stream and reset attachments, input, and errors cleanly, and disable the auto-focus logic on mobile to prevent virtual keyboard hijacking on load.
- [x] 2026-07-16 — Polish chat window UX with comprehensive icon-only button tooltips, improve keyboard navigation for suggestion chips, and refine text contrast for completed check icons and error state panels to meet WCAG AA standards.
- [x] 2026-03-28 — Initial audit of bot tools, removal of mock tools, fixing conversation history unit tests, and implementing major UI/UX improvements (smart scrolling, success states for tool execution, empty-state quick start suggestion chips, and full WCAG accessibility).

## 🧠 LEARNINGS
### 2026-07-21 — State Loading & Multi-User State Separation
**Learning:** Persisting state to sessionStorage/localStorage is highly beneficial for seamless navigation, but naive multi-effect sync patterns based on `userId` dependencies introduce race conditions when the user identifier transitions. During a render tick, React schedules state updates, so effects that save state may fire using the *previous* user's messages bound to the *new* user's key. Wrapping loading and saving into a unified effect gated by a `lastLoadedUserIdRef` ref solves this cleanly and prevents data leaks.
**Action:** Always coordinate local storage loads and saves for key-dynamic resources in a single synchronized block or ref gate to guarantee data privacy.

### 2026-07-20 — Button Grouping and State Guarding
**Learning:** Rendering adjacent confirmation action buttons block-wise takes up excessive vertical space in a compact chat window, while permitting old action triggers to remain clickable can lead to accidental double actions on obsolete context. Grouping adjacent actions inline inside a flex row makes the interface extremely compact and modern, while disabling triggers on older historical messages guarantees prompt safety.
**Action:** Always group consecutive inline actions side-by-side inside a single flex container (safely bypassing whitespace/empty tokens) and restrict active interaction triggers strictly to the latest message.

### 2026-07-25 — Standalone Vehicle Registration & Robust State Tracking
**Learning:** While composite tools like `registerCustomerWithVehicle` are powerful, users frequently need to perform discrete, smaller operations (like adding a vehicle to an existing customer) conversing with the chatbot. Making the `registerVehicle` tool available standalone directly expands Nitro's technical capabilities without increasing cognitive load. Additionally, maintaining a perfect 1-to-1 sync between backend tools, system instructions, and frontend label loaders ensures zero black-box states during LLM tool-calling.
**Action:** Always provide standalone counterparts for composite operations, ensure they are documented in system instructions, and map visual progress keys (`toolLabels` & `completedLabels`) on the client layout.

### 2026-07-16 — Session Reset Cleanliness
**Learning:** Clearing a chat conversation shouldn't just set the messages array to empty; it should also gracefully reset the stream's error states (`clearError`), cancel active runs (`stop`), clear file attachments, and clean the text input to ensure a completely clean state.
**Action:** Provide holistic reset handlers that bind client-side states, stream states, and input files in one single click action.

### 2026-07-16 — Mobile Viewport & Virtual Keyboards
**Learning:** Automatically focusing on inputs when loading a chat modal/drawer on mobile devices causes virtual keyboards to immediately slide up, obstructing quick suggestions/welcome chips and requiring users to dismiss them. Disabling auto-focus on mobile devices improves user delight and scannability.
**Action:** Restrict auto-focus hooks to desktop viewports using dynamic width checks (e.g. `!isMobile`).

### 2026-07-16 — Accessibility & High Contrast Interactive Elements
**Learning:** Icon-only interactive elements lack affordance for users with low vision or cognitive limitations. Wrapping them with Radix-powered accessible Tooltips improves both click confidence and accessibility. Furthermore, ensuring 700-weight colors (like `text-red-700` and `text-emerald-700`) on light/muted backgrounds complies with WCAG AA 4.5:1 minimum contrast guidelines.
**Action:** Wrap all secondary/icon-only controls with accessible tooltips and use 700-weight semantic colors for status typography on light surfaces.

### 2026-03-28 — Scrolling Hijack Prevention
**Learning:** Forcing page/chat scrolling to the bottom on every token stream can annoy users who scrolled up to read previous instructions.
**Action:** Restrict auto-scroll to cases where the scroll position is already at the bottom or the action was initiated by a user submit.

### 2026-03-28 — Micro-UX & Settle States
**Learning:** Abruptly hiding tool states when they finish executing (`output-available`) causes rapid layout shifting and cognitive disconnect. Retaining completed tool indicators with clear success icons provides visual closure and high UX quality.
**Action:** Always transition from dynamic loading states to a static "completed/checked" state instead of simple deletion.
