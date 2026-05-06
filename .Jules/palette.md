## 2025-05-23 - [Accessible Icon Buttons & Storybook Tooltips]
**Learning:** Icon-only buttons should consistently use `aria-label` for screen readers and `Tooltip` for visual feedback. In this design system (Radix-based), Tooltips require a `TooltipProvider` which was missing in Storybook, preventing visual verification of accessibility features in isolation.
**Action:** Always wrap icon-only buttons in `Tooltip` + `TooltipTrigger` (with `asChild`) and ensure `TooltipProvider` is available in the component context (and Storybook decorators).
