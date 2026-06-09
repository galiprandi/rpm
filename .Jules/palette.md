## 2025-05-22 - Standardizing Entity List Rows and Status Badges
**Learning:** Consistency in primary entity presentation (Users, Suppliers) across the admin panel improves scannability and professional feel. Using a branded icon container (`bg-primary/10`, `border-primary/20`) combined with `font-semibold tracking-tight` creates a clear visual anchor for the main data point in a table row. Additionally, aligning privilege-related badges (like Admin) with a soft-red protocol (`text-red-600 border-red-200 bg-red-50`) distinguishes high-impact roles from standard operational statuses.
**Action:** Always apply the Standardized List Row Entity Pattern to the primary name/identity column in administrative tables. Ensure icons have `aria-hidden="true"` and follow the defined color protocols for role-based badges.

## 2026-06-09 - Accessibility and Consistency in User Management
**Learning:** Transitioning from generic avatars to the Standardized List Row Entity Pattern for users provides a more cohesive administrative experience. Ensuring that all action buttons in high-density tables (like User Management) are accompanied by both Tooltips and descriptive ARIA labels is essential for both power-user efficiency and screen reader accessibility.
**Action:** In management tables, always wrap icon-only buttons in `Tooltip` components and ensure they have explicit `aria-label` attributes.
