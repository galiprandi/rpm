# Design Decisions: Product Module Refinement

## Context
The product module is a core part of the administrative dashboard. This refinement focuses on improving visual hierarchy, interaction feedback, and accessibility consistency.

## Applied Patterns

### 1. Unified Action Hierarchy
- **Primary Actions**: Moved "Nuevo Producto" to the `Header` component's `primaryAction`. This aligns with the system's pattern where the main page CTA resides in the header, leaving the table's header actions for secondary tasks like "Exportar".
- **Visual De-duplication**: Updated `CrudAdmin` to support `hideCreateAction`, ensuring the creation button is only present in one high-hierarchy location.

### 2. Semantic Iconography & Feedback
- **Status Indicators**: Adjusted `lowStock` icon color to use semantic orange-500 (`#f97316`) for better visibility of alerts.
- **Interactive Containers**: The image upload area in `ProductForm` now uses `bg-primary/5` and `transition-all` on hover, providing clear affordance.
- **Destructive Actions**: Standardized the "Eliminar imagen" button to use the `destructive` variant, clearly communicating the irreversible nature of the action.

### 3. Accessible Exceptions Dialog
- **Visual Contrast**: Preview cards in the `ProductPricesModal` now use a combination of `bg-primary/5` and `border-primary/20` to distinguish calculated results from input fields.
- **Screen Reader Support**: All interactive elements (buttons, inputs) in the prices and product dialogs now include explicit `aria-label` or `aria-required` attributes.
- **Responsive Inputs**: Refined input widths in the price exception dialog to use `w-full`, providing a more balanced layout in mobile and desktop views.

## Component Evolution
- `ProductsClient`: Now serves as a model for "Page-level Header + CrudAdmin" integration.
- `ProductForm`: Enhanced image management UX.
- `ProductPricesModal`: Improved the complex "Exception Management" flow with better visual grouping.
