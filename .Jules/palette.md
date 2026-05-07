# Palette's Journal - RPM Accesorios

Critical UX and accessibility learnings.

## 2025-05-23 - [Accessible Icon Buttons & Storybook Tooltips]
**Learning:** Icon-only buttons should consistently use `aria-label` for screen readers and `Tooltip` for visual feedback. In this design system (Radix-based), Tooltips require a `TooltipProvider` which was missing in Storybook, preventing visual verification of accessibility features in isolation.
**Action:** Always wrap icon-only buttons in `Tooltip` + `TooltipTrigger` (with `asChild`) and ensure `TooltipProvider` is available in the component context (and Storybook decorators).

## 2025-05-15 - Spanish Pagination Consistency in DataTables
**Learning:** The application targets a Spanish-speaking audience, so core UI components like `DataTable` must have their built-in text (pagination summaries, search placeholders, etc.) translated to Spanish to maintain a consistent UX. Additionally, accessibility for screen readers is enhanced by adding ARIA labels to icon-only navigation buttons.
**Action:** Always ensure any new or modified data presentation components use Spanish labels (e.g., "registros" instead of "items") and provide explicit `aria-label` for icon-only interactive elements.

## 2025-05-14 - DataTable Pagination Accessibility
**Learning:** Icon-only buttons in critical navigation components like `DataTable` often lack explicit labels, making them difficult to use for screen reader users and ambiguous for others. Providing both `aria-label` and `Tooltip` is the standard for this project.
**Action:** Always wrap icon-only buttons with `Tooltip` and provide `aria-label`.

## 2025-05-02 - [Tooltip Accessibility Pattern]
**Learning:** Icon-only buttons require both `aria-label` for screen readers and `Tooltip` for visual users to be truly accessible. In Storybook, Radix-based Tooltips won't render unless wrapped in a `TooltipProvider` decorator.
**Action:** Always wrap icon-only buttons in `Tooltip` + `TooltipTrigger` and provide an explicit `aria-label`. Ensure Storybook's `preview.ts` has the necessary providers.

## 2026-05-07 - [Low Stock Tooltip & Keyboard Accessibility]
**Learning:** Providing visual-only cues (like orange text for low stock) is insufficient for accessibility. Adding a Tooltip with the exact threshold and an ARIA label ensures all users understand the context. Additionally, making the indicator focusable via `tabIndex={0}` allows keyboard users to trigger the tooltip.
**Action:** When using color-based status indicators, always supplement with a Tooltip for threshold context and an `aria-label` for screen readers. Ensure the element is keyboard-focusable.
