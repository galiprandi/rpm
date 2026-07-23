## 2025-05-22 - Standardizing Entity List Rows and Status Badges
**Learning:** Consistency in primary entity presentation (Users, Suppliers) across the admin panel improves scannability and professional feel. Using a branded icon container (`bg-primary/10`, `border-primary/20`) combined with `font-semibold tracking-tight` creates a clear visual anchor for the main data point in a table row. Additionally, aligning privilege-related badges (like Admin) with a soft-red protocol (`text-red-600 border-red-200 bg-red-50`) distinguishes high-impact roles from standard operational statuses.
**Action:** Always apply the Standardized List Row Entity Pattern to the primary name/identity column in administrative tables. Ensure icons have `aria-hidden="true"` and follow the defined color protocols for role-based badges.

## 2025-05-23 - Form UX Enhancement and Accessibility in Modals
**Learning:** Form-heavy modals (like `QuickSaleModal`) benefit significantly from the Form UX Enhancement Pattern: using contextual Lucide icons inside relative containers with `pl-9` padding, and strictly linking `Label` components to `Input` elements via `htmlFor` and `id`. This creates a more professional, "delightful" interface while ensuring full accessibility for screen readers. Replacing native HTML checkboxes with the custom `Checkbox` component further ensures theme consistency across complex UI states.
**Action:** When refactoring or creating forms, prioritize the established Icon + Input wrapper pattern and ensure all `Label` components are correctly linked to their respective `Input` via IDs and use the `required` prop for visual consistency.

## 2026-06-09 - Accessibility and Consistency in User Management
**Learning:** Transitioning from generic avatars to the Standardized List Row Entity Pattern for users provides a more cohesive administrative experience. Ensuring that all action buttons in high-density tables (like User Management) are accompanied by both Tooltips and descriptive ARIA labels is essential for both power-user efficiency and screen reader accessibility.
**Action:** In management tables, always wrap icon-only buttons in `Tooltip` components and ensure they have explicit `aria-label` attributes.

## 2026-06-11 - Semantic Consistency in Movement Histories
**Learning:** Historical data views, like stock movements, benefit from a multi-layered semantic approach: using shadcn/ui `Table` components for structural consistency, applying the Standardized List Row Entity Pattern to actors (Users/System), and utilizing a three-tier badge protocol (emerald/red/amber) for directionality (IN/OUT/ADJUST). This improves information density and scannability without sacrificing accessibility.
**Action:** When displaying history or logs, use the three-tier semantic badge protocol for statuses and ensure all tables use the shadcn/ui component set instead of native HTML tags.

## 2026-06-12 - Accessibility for Destructive Actions in Lists
**Learning:** High-density lists with icon-only destructive actions (like 'Delete') are high-risk for user error and screen reader ambiguity. Wrapping these buttons in a `Tooltip` while simultaneously providing a descriptive `aria-label` ensures both power users and users with assistive technologies have clear confirmation of the action's intent.
**Action:** Always wrap icon-only action buttons in history or itemized lists with a `Tooltip` and provide a localized `aria-label` (e.g., "Eliminar pago").

## 2026-06-14 - Accessible Form Collapsibles and Icon Patterns
**Learning:** Collapsible form sections (like 'Datos de Facturación') require explicit ARIA attributes (`aria-expanded`, `aria-controls`) paired with structural IDs to be accessible. When implementing the Form UX Enhancement Pattern with shadcn/ui `Select` components, the `SelectTrigger` needs `pl-9` and the icon needs `z-10` to ensure visual and functional correctness.
**Action:** Always include `aria-expanded` and `aria-controls` on form section toggles. Ensure `SelectTrigger` has `pl-9` when icons are used.

## 2026-06-16 - Form UX Consistency in Payment Methods
**Learning:** Applying the Form UX Enhancement Pattern to technical configuration forms (like Payment Methods) provides a more professional feel. Standardizing the 'Code' field with `font-mono` and relevant Lucide icons (e.g., `Hash`) improves scannability. Replacing native checkboxes with the project's custom `Checkbox` component ensures consistent styling and accessibility, provided the `label` prop is used correctly.
**Action:** Consistently use the Icon + Input wrapper pattern and the custom `Checkbox` component in all administrative forms to maintain the Micro-UX standard.

## 2026-06-18 - Precision and Consistency in Financial Inputs
**Learning:** Margin and percentage inputs across administrative forms (e.g., `CategoryForm`, `PriceListForm`) must use `type="number"`, `step="0.1"`, and handle value updates using `parseFloat` to ensure consistent decimal precision support. This prevents data loss from `parseInt` and provides a better UX for fine-grained adjustments.
**Action:** Always use `parseFloat` and `step="0.1"` (or finer) for margin/percentage fields to maintain consistency with the app's financial logic.

## 2026-06-18 - Standardizing Tables and Warnings in Dialogs
**Learning:** Dialog-based summaries (like Purchase Voucher previews) benefit from using the project's standard `Table` components and the semantic amber warning protocol (`text-amber-600 border-red-200 bg-red-50`). This creates a cohesive "admin" feel and ensures that critical discrepancies are visually distinct from informational states.
**Action:** When refactoring modal summaries, always replace native HTML tables with the shadcn/ui `Table` set and use the three-tier semantic protocol for alerts.

## 2026-06-20 - Enhancing Credit Note Form Accessibility and UX
**Learning:** Applying the Form UX Enhancement Pattern to specialized administrative dialogs (like Customer Credit Notes) significantly improves the professional feel and scannability. Using contextual icons like `Undo2` for refund methods and `font-mono` for financial totals creates clear visual anchors. Explicitly linking `Label` components to `SelectTrigger` components via `id` and `htmlFor` is a critical step for accessibility in shadcn/ui-based forms.
**Action:** Always ensure that `SelectTrigger` has a unique ID matching its `Label`, and use the relative/absolute icon pattern for all select and input fields in administrative modals.

## 2026-06-22 - Standardizing Administrative Tables and Maintaining Badge Contrast
**Learning:** Refactoring native HTML tables to the shadcn/ui `Table` set in administrative modules ensures visual consistency and provides better interactive states (hover, borders). When updating status badges, maintaining a `700` text weight on `50` backgrounds (e.g., `text-emerald-700` on `bg-emerald-50`) is critical to meeting WCAG AA contrast requirements (4.5:1), as lighter `600` variants often fall short. Additionally, consistent application of `aria-hidden="true"` to decorative icons and `aria-label` to pagination elements significantly reduces screen reader noise in data-heavy views.
**Action:** Always use the shadcn/ui `Table` components for administrative data and verify that badge color combinations meet accessibility contrast standards. Ensure all decorative icons are hidden from screen readers.

## 2026-06-25 - Standardizing User Management Forms and Select Accessibility
**Learning:** Applying the Form UX Enhancement Pattern to User Management creates a more professional and accessible experience. Replacing native selects with shadcn/ui `Select` components featuring contextual icons (like `Shield`) within a relative/absolute wrapper ensures visual harmony with other administrative modules. A critical accessibility requirement for shadcn/ui is explicitly linking the `Label` to the `SelectTrigger` via matching `id` and `htmlFor` attributes, and ensuring the decorative icon is properly layered with `z-10` and `aria-hidden="true"`. Additionally, standardizing technical inputs like Email with `font-mono` typography improves data scannability.
**Action:** Always refactor native selects to the enhanced `Select` + Icon pattern in administrative forms. Ensure all labels are semantically linked to their interactive triggers and apply `font-mono` to technical/identifier fields.

## 2026-06-28 - Accessible Contrast and High-Fidelity Skeletons
**Learning:** Financial status indicators using `emerald-600` or `red-600` often fail WCAG AA contrast requirements (4.5:1) on white or very light backgrounds. Elevating these to `emerald-700` and `red-700` ensures accessibility while maintaining semantic meaning. Furthermore, "high-fidelity" skeletons that reuse actual layout components (like `Header` and `CrudStats`) in `loading.tsx` provide a much smoother hydration experience by perfectly matching the final layout's structural footprint, effectively eliminating Cumulative Layout Shift (CLS).
**Action:** Always prioritize `700` weight colors for accessible status text and reuse high-level layout components within loading skeletons to ensure visual stability.

## 2026-06-30 - Enhancing Settings Accessibility and External Labeling
**Learning:** Shared layout components like `SettingItem` that wrap diverse controls (inputs, selects, links) benefit from a flexible title rendering strategy. By conditionally rendering the title as a `Label` when an `htmlFor` prop is provided, we enable semantic keyboard focus and click-to-activate behavior for the wrapped controls without breaking non-form navigation patterns. Furthermore, extending sub-components like `ThemeSelector` to accept and pass through an `id` to their inner triggers is essential for maintaining this semantic link in complex composite components.
**Action:** In shared configuration or layout items, support an optional `htmlFor` prop to promote titles to `Label` components. Ensure all internal triggers in composite components accept an `id` to facilitate this association.

## 2026-07-02 - Actionable Dashboard Metrics and Communication UX
**Learning:** Dashboard cards that represent terminal operational states (like 'Ready for Delivery') should serve as communication hubs rather than just data summaries. Integrating one-click WhatsApp notification buttons using pre-filled templates and verified phone numbers significantly reduces friction for workshop managers. A critical discovery was that backend "privacy" measures like `maskPhone` can inadvertently break these high-value UX flows if applied too aggressively to administrative datasets. Additionally, pairing technical identifiers (like license plates) with `font-mono` and providing accessible tooltips for all icon-only actions ensures both scannability and inclusivity.
**Action:** Always provide unmasked contact data for administrative communication features. Use the 'One-Click WhatsApp Notification' pattern for status-based dashboard items and ensure all technical IDs use mono typography.

## 2026-07-05 - Status Block Pattern for Dashboard Summary Cards
**Learning:** Transitioning dashboard summary metrics from plain text to a grid of color-coded "status blocks" significantly improves data scannability and professional feel. Using contextual icons (e.g., `Clock`, `Wrench`, `CheckCircle2`) paired with monospaced typography for numeric values creates clear visual anchors. Maintaining a 700-weight text color on 50-weight backgrounds (e.g., `text-amber-700` on `bg-amber-50`) ensures WCAG AA contrast compliance while preserving semantic meaning. Subtle hover transforms (`scale-[1.02]`) and shadows provide "delight" by signaling interactivity.
**Action:** When designing dashboard overview components, use the Status Block Pattern with semantic icons and 700-weight contrast-compliant text.

## 2026-07-08 - Standardizing Accessible Contrast in History and Stock Views
**Learning:** Many built-in status colors like `emerald-600` or `orange-600` fail WCAG AA contrast (4.5:1) on white backgrounds. Elevating these to `700` variants (e.g., `text-emerald-700`, `text-orange-700`) is a low-effort, high-impact way to ensure accessibility without losing semantic meaning. Additionally, icon-only buttons in dense technical views (like Price Lists) must always be paired with a `Tooltip` and an explicit `aria-label` that provides specific context (e.g., "Editar precio de [Lista]") to ensure screen reader users aren't left guessing.
**Action:** Always verify contrast for semantic text on light backgrounds and ensure all icon-only buttons have descriptive tooltips and ARIA labels.

## 2026-07-15 - Dashboard Micro-UX and Navigation Accessibility
**Learning:** Dashboard summary cards should not be navigational dead-ends. Adding explicit footer links (e.g., "Ver todas... →") improves flow and discoverability. The 'Status Block Pattern'—replacing generic dots with semantic icons and using `font-mono` for numeric counts—enhances both scannability and professional feel. Furthermore, systematic contrast normalization of primary colors (e.g., `blue-600` to `blue-700`) and reduction of opacity on critical secondary labels (e.g., `/50` to `/80`) ensures WCAG AA compliance in dense data views.
**Action:** Default to the Status Block Pattern with semantic icons for all summary grids. Ensure every dashboard card includes a clear navigational path to its respective module and maintain strict 700-weight contrast for active status colors.

## 2026-07-10 - Standardizing Product Selector and Select Accessibility
**Learning:** The `ProductServiceSelector` component, being a high-traffic entry point, benefit from both the Standardized List Row Entity Pattern and the Form UX Enhancement Pattern. Replacing native labels with linked `Label` components and adding contextual icons (`Tags`, `BadgeDollarSign`) to `Select` triggers with `pl-9` padding significantly improves professional feel and accessibility. Furthermore, using `font-mono` for technical metadata (SKU, Stock) helps users distinguish technical IDs from descriptive text at a glance.
**Action:** When enhancing search or selection components, apply the Row Entity Pattern to result icons and the Select + Icon pattern to filters. Ensure technical fields always use monospaced typography.

## 2026-07-12 - Systematic Accessible Contrast Normalization
**Learning:** Tailwind "600" weight semantic colors (emerald, blue, red, orange, amber) frequently fail WCAG AA contrast requirements (4.5:1) when used for text or icons on white or 50-weight backgrounds. Elevating these to "700" weight across all administrative modules (Customers, OTs, Invoices, Cash, Users) is a necessary step for baseline accessibility. Inconsistencies often arise where an icon uses 600 while adjacent text uses 700, or vice versa, creating visual disharmony.
**Action:** Always default to 700-weight for semantic text colors on light backgrounds. Conduct systematic sweeps of new modules to ensure "600" weight contrast traps are not reintroduced.

## 2026-07-18 - Refining Form UX Enhancement Pattern
**Learning:** When applying the Form UX Enhancement Pattern (icons inside inputs), using the same icon for both the `SettingItem` title and the input field creates visual redundancy and clutter. Using distinct but semantically related icons (e.g., `MapPin` for the category and `Hash` for the specific ID input) improves scannability. Additionally, for inputs using monospaced typography, `pl-10` provides a safer visual buffer than `pl-9` to prevent character overlap with the absolute-positioned icon.
**Action:** Always use distinct icons for setting rows vs. internal inputs and default to `pl-10` for enhanced inputs to ensure maximum readability and professional finish.

## 2026-07-21 - Standardizing Monetary Typography in Purchase Vouchers
**Learning:** In administrative modules dealing with supplier documentation (like Purchase Vouchers), consistency in monetary presentation is vital for professional feel. Replacing native `toLocaleString` and `toFixed` with the centralized `formatARS` utility ensures uniformity. Combining `font-mono` with `font-semibold tracking-tight` for these values, along with technical identifiers like voucher numbers, creates a high-fidelity technical look. Furthermore, elevating discrepancy warnings from `text-amber-600` to `700` variants on light backgrounds ensures WCAG AA compliance across all feedback states.
**Action:** Always use `formatARS(amount, 2)` for financial totals and pair it with monospaced bold typography for technical scannability. Verify contrast for all semantic feedback blocks.

## 2026-07-16 - Interactive Tooltip Trigger Accessibility
**Learning:** When wrapping non-native interactive elements (like `<p>` or `<span>`) in a `TooltipTrigger`, they must have `tabIndex={0}` and a visible focus state to be keyboard-accessible. Additionally, since the project provides a global `TooltipProvider` in the root layout, individual components should avoid redundant nesting to maintain a clean DOM and consistent delay behavior.
**Action:** Always add `tabIndex={0}` and `focus-visible` styles to non-button tooltip triggers. Do not include `TooltipProvider` in local components.

## 2026-07-24 - Mobile Viewport Focus and Chatbot Reset Actions
**Learning:** Automatically focusing inputs inside slide-outs or floating panels on mobile devices (`isMobile`) triggers intrusive virtual keyboard popups that disrupt visual viewports and cause layout zoom. Additionally, in floating panel overlays, dense destructive utilities like "Clear Conversation" must be disabled in their initial empty states, and wrapped in descriptive tooltips alongside screen reader `aria-label` tags to maintain accessibility and clarity.
**Action:** Restrict auto-focus mechanisms to `!isMobile` on overlay/modal open, and ensure any contextual destructive operations are disabled when their relevant state is empty.

## 2026-07-20 - Multi-Step Modal Form Layout Separation & Select Trigger Accessibility
**Learning:** Dense composite multi-step forms (like the final Step 3 of the Quick Sale checkout) can suffer from poor keyboard focus scannability and "input fatigue" if select triggers and numeric amounts are grouped together without distinct labels. Transitioning from a generic inline row into a structured, fully labeled column-grid pattern gives assistive technologies explicit target names. Additionally, absolute visual indicators/icons (like the `DollarSign`) inside those input wrappers must have `pointer-events-none` to prevent blocking click/tap operations, `z-10` for proper layout layering, and `aria-hidden="true"` to prevent screen readers from reading decorative character values out of context.
**Action:** Always separate composite inline inputs into clean column-grids with individual HTML `Label` bindings. Apply `pointer-events-none z-10` and `aria-hidden="true"` to any decorative overlay icons.

## 2026-07-21 - Caching and Infinite-Loop Prevention in Search Triggers
**Learning:** Dynamic API queries triggered upon overlay/dialog opening require careful state-caching and fault tolerance. In a `useEffect` model monitoring `isOpen` and result arrays, a simple request failure can leave target states empty. If left unchecked, resetting request-indicators can trigger infinite fetch-and-render loops, causing browser freeze or server overload. Handling failure states explicitly by mapping to placeholder empty arrays `[]` elegantly arrests recursive render hooks while maintaining standard fallback operations.
**Action:** Always map overlay network errors or empty results to valid fallback states to break potential infinite fetching cascades.

## 2026-07-23 - Keyboard-Accessible Tooltip Triggers and Clean Provider Contexts
**Learning:** Adding Tooltips to custom non-button elements (like `div`, `span`, `p`, or `Badge`) requires making them keyboard-focusable via `tabIndex={0}` and adding clear focus-visible outlines or dotted underline styles to signal interactive states to keyboard users. Since the app-wide `TooltipProvider` is globally pre-configured inside `app/layout.tsx`, nesting local `<TooltipProvider>` elements within individual client components creates unnecessary DOM wrapping, causes styling discrepancies, and defaults standard delays inconsistently.
**Action:** Always make non-button tooltip triggers keyboard focusable using `tabIndex={0}`, standard focus indicators, and custom focus-visible underlines. Avoid nesting local `<TooltipProvider>` elements within sub-components.

## 2026-07-23 - Keyboard-Accessible Focus Rings on Borderless Inputs
**Learning:** Wrapping a borderless input (configured with `focus-visible:ring-0` to prevent inner outline clutter) inside a container with `focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all` creates an exceptionally elegant visual focus state. This allows focus events to bubble up semantically, highlighting the entire interactive header bar for keyboard/accessibility navigation without sacrificing a modern, clean aesthetics layout.
**Action:** Apply the `focus-within` container highlight pattern to search bar wrappers or other borderless inputs to maintain high-contrast accessibility focus states.
