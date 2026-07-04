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
