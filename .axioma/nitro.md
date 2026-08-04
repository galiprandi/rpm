# Nitro 🤖 Journal

## 📋 BACKLOG

## ✅ DONE
- [x] 2026-08-04 — Implement the assignWorkOrderTechnician tool for the virtual assistant (Nitro) enabling workshop staff to assign or change the responsible technician/mechanic of a work order directly from the chat panel. Features smart partial matching on name, active role validation/disambiguation, and automatic audit logging via the updateWorkOrder service, with comprehensive unit tests, system prompt documentation, and UI status label mapping.
- [x] 2026-08-03 — Implement the attachPhotoToChecklistItem tool for the virtual assistant (Nitro) enabling workshop staff to upload and associate photos directly with specific ENTRY/EXIT checklist items via the chat panel. Features smart partial label matching, automatic JSONB checklist status updating, photo registration, and work order gallery integration, with comprehensive unit tests and user instruction updates (PR #317).
- [x] 2026-08-02 — Implement global keyboard shortcuts Alt+V (toggle voice dictation) and Alt+C (clear conversation flow with confirmation) inside ChatFloating.tsx, featuring responsive tooltips and ARIA-labels, comprehensive keyboard listener lifecycle management, and full unit test coverage (PR #315).
- [x] 2026-08-01 — Implement the searchServices tool for the chatbot (Nitro) enabling workshop staff to query active shop services, durations, and costs, with full Drizzle ORM queries, visual status labels, comprehensive integration tests, and system documentation (PR #295).
- [x] 2026-07-30 — Enhance chatbot file attachment UI to show dynamic local image previews (thumbnails) and fallback uppercase file extension badges with comprehensive, leak-proof browser object URL lifetime management (PR #290).
- [x] 2026-07-28 — Implement dynamic local image previews and file extension badges for chat file attachments with robust object URL memory management and cleanup lifecycles (PR #289).
- [x] 2026-07-27 — Implement the registerWorkOrderPayment tool for the virtual assistant (Nitro) with full database transaction support, cash movement registration, atomic balance adjustment, and integrity verification tests (PR #288).
- [x] 2026-07-26 — Enhance chatbot keyboard accessibility and navigation by adding focus-visible offset ring/outline styling to all close, clear, toggle, and secondary controls inside ChatFloating.tsx (PR #276).
- [x] 2026-07-26 — Implement contextual client-side barcode and QR code detection for uploaded image attachments using the native browser BarcodeDetector API, and expand dynamic context-aware suggestion chips for admin pages (/cash, /purchase-vouchers, /suppliers, /settings, /reports) (PR #263).
- [x] 2026-07-24 — Integrate the virtual assistant "Preguntar a Nitro" trigger directly in the AppSidebar and AdminClientLayout for seamless mobile and desktop accessibility, and upgrade ChatFloating mobile fullscreen layout to use dynamic h-[100dvh].
- [x] 2026-07-23 — Implement contextual attachment quick-action button ("Procesar como Factura de Compra") inside ChatFloating.tsx, featuring instant Base64 serialization, prompt submission integration, and automated preview cleanup with robust unit test coverage.
- [x] 2026-07-22 — Implement voice-to-text dictation integration (es-AR locale) inside ChatFloating.tsx, featuring pulsing microphone animations, adaptive placeholders, graceful cleanup handlers, and full unit test coverage.
- [x] 2026-07-21 — Implement dynamic context-aware suggestions, accidental-wipe protection (double click clear confirm), robust session persistence, friendly client-side error formatting, and Escape key stream cancellation.
- [x] 2026-07-20 — Group adjacent confirmation actions inline, restrict interaction buttons to the latest assistant message, add Alt+1 to Alt+4 keyboard shortcuts for empty-state suggestion chips with visual badges, and author a comprehensive component unit test suite.
- [x] 2026-07-25 — Integrate registerVehicle tool for existing customers standalone registration, map its visual states in ChatFloating component, document it in base instructions, and restore/refine the chatbot UI/UX enhancements (PR #212).
- [x] 2026-07-16 — Implement Clear Conversation button in the chat header, stop active stream and reset attachments, input, and errors cleanly, and disable the auto-focus logic on mobile to prevent virtual keyboard hijacking on load.
- [x] 2026-07-16 — Polish chat window UX with comprehensive icon-only button tooltips, improve keyboard navigation for suggestion chips, and refine text contrast for completed check icons and error state panels to meet WCAG AA standards.
- [x] 2026-03-28 — Initial audit of bot tools, removal of mock tools, fixing conversation history unit tests, and implementing major UI/UX improvements (smart scrolling, success states for tool execution, empty-state quick start suggestion chips, and full WCAG accessibility).

## 🧠 LEARNINGS
### 2026-08-04 — Chatbot Work Order Technician Assignment Tool
**Learning:** For a fast-paced workshop environment, manager and staff actions like assigning mechanics/technicians to a work order can be optimized significantly using natural language through the chatbot interface. Supporting fuzzy/partial matching by technician name and checking their active role status prevents human error while providing helpful disambiguation prompts when multiple users match.
**Action:** Always employ robust fallback matching mechanisms (e.g. active users first, then fallback to general database matching) and gracefully prompt with exact names when search ambiguities are encountered.

### 2026-08-02 — Keyboard Shortcuts for Hands-Busy Workshop Staff
**Learning:** Workshop technicians are frequently hands-busy with gloves or mechanics tools, which makes precise mouse/trackpad clicking of tiny control buttons extremely tedious. Providing global, intuitive keyboard shortcuts like `Alt+V` to toggle voice dictation and `Alt+C` to clear chat (with confirmation safeguard) creates a highly ergonomic, fluid interface. Tooltips and ARIA accessibility labels should dynamically advertise these shortcuts so they are highly discoverable and compliant.
**Action:** Always include keyboard triggers alongside key visual interactions, especially for accessibility-critical buttons (mic, close, clear, confirm). Ensure standard JSDOM constructors are tested without arrow lexical `this` scoping mismatches.

### 2026-08-01 — Chatbot Workshop Services Search Tool
**Learning:** Expanding the chatbot's searching tools to include active workshop services (`searchServices`) bridges the gap between catalog management and actual garage operations. Providing immediate duration (minutes) and base cost feedback in response to natural language queries drastically cuts lookup times for on-duty technicians and administrative personnel.
**Action:** Always maintain strict code integrity checks by keeping unified instructions, tool registries, unit tests, and UI states fully synchronized.

### 2026-07-30 — Chatbot Image and File Attachment Visual Preview UI Standard
**Learning:** Attaching files without visual preview leaves the user uncertain about what is uploaded. Displaying a dynamic local thumbnail preview using `URL.createObjectURL(attachedFile)` when the file is an image, and a fallback uppercase file-type extension badge (e.g. "PDF", "TXT") otherwise, significantly boosts interactive clarity and engagement. Safely managing the object URL lifecycle via React hook cleanup destructors prevents browser memory leaks when files are changed, removed, or when the chat is closed/cleared.
**Action:** Always wrap companion web API object creations inside synchronized React `useEffect` structures and provide beautiful, responsive visual indicator fallbacks for arbitrary file uploads.
