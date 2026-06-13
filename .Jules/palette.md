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
