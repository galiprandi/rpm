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
- `ProductsClient`, `UsersClient`, `SuppliersClient`: Now serve as models for "Page-level Header + CrudAdmin" integration.
- `ProductForm`: Enhanced image management UX.
- `ProductPricesModal`: Improved the complex "Exception Management" flow with better visual grouping.
- `UserForm`, `SupplierForm`: Standardized mandatory field signaling and accessibility attributes.

# Design Decisions: Work Order Module Refinement

## Context
The Work Order (OT) module is critical for workshop operations. This refinement focuses on improving the scannability of work status, financial clarity, and workshop-to-customer communication flow.

## Applied Patterns

### 1. Kanban Excellence
- **Scannable Status**: Kanban cards now use semantic `Badge` components for price display. Green-tinted for fully paid, yellow-tinted for partial payments, and neutral for pending.
- **Urgency Awareness**: "Delayed" orders now use the semantic orange-500 color (`text-orange-600` for text, `border-l-orange-500` for visual emphasis), replacing generic red to align with the system's "Warning" hierarchy instead of "Error".
- **Enhanced Affordance**: Added `Tooltip` descriptions to vehicle category icons, improving accessibility and providing immediate context for workshop icons.
- **Interaction Feedback**: Kanban columns now feature a subtle `bg-muted/40` hover state, clarifying drag-and-drop targets.

### 2. High-Hierarchy Detail Header
- **Contextual Grouping**: The Work Order detail page now separates vehicle specifications from customer contact info.
- **Actionable Metadata**: Contact information (Phone, Email) and Scheduled dates are now encapsulated in "pills" (rounded-full backgrounds), making them visually distinct from descriptive text.
- **Standardized Controls**: Replaced native HTML `<select>` with the project's Radix-based `Select` component, ensuring consistent styling across the administrative area.

### 3. Operational Clarity
- **Structured Checklists**: Checklist items in the detail view are now organized in a responsive grid. Checked items use a distinct tinted background (`bg-blue-50` or `bg-green-50`) to provide immediate visual confirmation of completed tasks.
- **Accessibility**: Standardized manual checkbox states with explicit visual feedback and better touch targets.

## Component Evolution
- `WorkOrdersPage`: Serves as the reference for Kanban-style interaction patterns.
- `WorkOrderDetailPage`: Establishes the "Metadata Pill" pattern for secondary actionable info in headers.

# Design Decisions: Category Module Refinement

## Context
The Categories module is a fundamental catalog for product organization. This refinement focuses on unifiying the action hierarchy and improving the accessibility of the management forms.

## Applied Patterns

### 1. Action Consistency
- **Primary CTA**: Moved "Nueva Categoría" to the `Header` component. This reinforces the pattern where the main intent of the page is clearly visible at the top level, separated from table-specific interactions.
- **Interaction Tooltips**: Added Tooltips to all row actions (Edit, Delete). This provides immediate visual feedback on button functionality and status (e.g., explaining why a category cannot be deleted).

### 2. Form Accessibility & UX
- **Semantic Labels**: Standardized the use of the `required` prop in `Label` components, ensuring the red asterisk is visible and correctly ignored by screen readers while the `aria-required` attribute provides the necessary context to assistive technologies.
- **Visual Feedback**: Added a `saving` state to the creation and edition flow, providing animated feedback via the `loading` prop of the `ModalBaseFooter` buttons.
- **Color Affordance**: Improved the color picker UX by adding a visual preview of the selected hex code, making it easier for administrators to manage visual categorization.

## Component Evolution
- `CategoriesClient`: Now follows the "Header + CrudAdmin" pattern with a clear separation of concerns between page actions and data presentation.
- `CategoryForm`: Serves as a reference for accessible catalog forms with grid layouts and semantic labels.
