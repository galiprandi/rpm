# Palette's Journal - RPM Accesorios

## 2025-05-14 - DataTable Pagination Accessibility
**Learning:** Icon-only buttons in critical navigation components like `DataTable` often lack explicit labels, making them difficult to use for screen reader users and ambiguous for others. Providing both `aria-label` and `Tooltip` is the standard for this project.
**Action:** Always wrap icon-only buttons with `Tooltip` and provide `aria-label`.
