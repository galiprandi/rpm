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
- `VehicleDetailPage`: Reinforces the "Metadata Pill" pattern and structural Skeletons for detail views.

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
- `CategoriesClient`, `PaymentMethodsClient`: Now follow the "Header + CrudAdmin" pattern with a clear separation of concerns between page actions and data presentation.
- `CategoryForm`, `PaymentMethodForm`: Serve as references for accessible catalog forms with grid layouts and semantic labels.

# Design Decisions: Price Lists Module Refinement

## Context
The Price Lists module is essential for the store's commercial strategy. This refinement focuses on unifying the navigation experience, improving the scannability of price exceptions, and standardizing the interface with the rest of the administrative panel.

## Applied Patterns

### 1. Header Integration & Stat Consolidation
- **Unified Header**: Both the main list and the detail view now use the standard `Header` component.
- **Stat Strip**: Replaced bulky stat cards in the detail view with the `CrudStats` strip integrated into the header. This pattern provides immediate context without pushing the main content (the table) too far down the page.
- **Action Hierarchy**: Moved "Nueva Lista" and "Agregar Excepción" to the `primaryAction` slot of the `Header`. Secondary tools like "Actualizar Costos" or "Historial" are now cleanly organized as `secondaryActions`.

### 2. Table UX & Navigation
- **Actionable Links**: Price list names in the main table are now active links (`Link` from Next.js), following the pattern used in Customers or Work Orders.
- **Contextual Tooltips**: Added `Tooltip` components to all row actions, ensuring the "Why" and "What" are clear even for icon-only buttons.
- **Semantic Badges**: Standardized the use of badges for visibility (Public/Private) and status (Active/Inactive), and implemented `orange-500` for margin warnings to align with the "Urgency" visual language.

### 3. Structural Modal Consistency
- **ModalBase Migration**: Converted the add/edit dialogs and the exceptions modal to use `ModalBase`. This ensures consistent header/footer styling and standardized loading/saving states.
- **Searchable Select**: Replaced the native `<select>` in the "Add Exception" modal with the `SearchableSelect` component, significantly improving the experience of finding products in large catalogs.

## Component Evolution
- `PriceListsClient`: Now uses the "Header + CrudAdmin" pattern with `hideCreateAction={true}`.
- `PriceListDetailClient`: Establishes the pattern of using `CrudStats` within the `Header` for detail views.
- `PriceListForm`: Standardized accessibility attributes (`aria-required`) and visual requirement indicators.

# Design Decisions: Catalog Modules Refinement (Customers, Suppliers, Services)

## Context
The Customers, Suppliers, and Services modules are core catalogs of the application. This refinement focuses on unifiying the administrative pattern across all list views to maximize vertical space and consistency.

## Applied Patterns

### 1. Unified Header & Stat Consolidation
- **Pattern Adoption**: Migrated Customers, Suppliers, and Services to the "Header + CrudAdmin" pattern.
- **Stat Integration**: High-level metrics (Total counts, active states, financial summaries) are now integrated into the `Header` via `CrudStats`. This provides immediate business context while keeping the data table as the protagonist.
- **Action Hierarchy**: Moved all primary creation actions ("Nuevo Cliente", "Nuevo Proveedor", "Nuevo Servicio") to the `Header`'s `primaryAction`. Secondary filters or actions (e.g., "Filtrar con Saldo") are placed in `secondaryActions` within the header.

### 2. Interaction & Accessibility
- **Action Tooltips**: Standardized the use of `Tooltip` for all table row actions, ensuring clear feedback for icon-only buttons (Edit, View, Delete/Deactivate).
- **Semantic Colors**: Standardized color usage for financial and status indicators. Debt is shown in `text-red-600`, credit in `text-green-600`, and warnings (like suppliers without products or inactive states) use appropriate semantic shades.
- **ARIA Compliance**: Added explicit `aria-label` attributes to all action buttons to ensure a smooth experience for screen reader users.

## Component Evolution
- `CustomersClient`, `SuppliersClient`, `ServicesClient`: Now follow the exact same architectural structure, making the codebase easier to maintain and the UI predictable for the user.

# Design Decisions: Purchase Vouchers & Cash Management Refinement

## Context
Purchase vouchers and cash management are critical for financial control. This refinement focuses on unifiying the administrative pattern, improving visual feedback for discrepancies, and standardizing the interface with the rest of the administrative panel.

## Applied Patterns

### 1. Unified Header & Financial Metadata
- **Standardized Header**: Both modules now use the standard `Header` component with integrated status badges and primary actions.
- **Metadata Pills**: The Voucher Detail view uses pill-style badges for Date, Payment Method, and Total Amount, providing a quick scannable overview of the document's header info.
- **Live Status Indicators**: Cash management features a live "Pulse" indicator in the header badge to clearly distinguish an open jornada from a closed one.

### 2. Operational Feedback & UI Components
- **Searchable Selection**: Replaced native `<select>` in Voucher Detail with `SearchableSelect`, making product entry faster and more professional.
- **Standardized Stats**: Both modules utilize `CrudStats` for high-level summaries (Drafts vs. Finalized, Total Accumulated, Cash Summary), ensuring vertical space is used efficiently.
- **Contextual Tooltips**: Added `Tooltip` components to all row actions in the Purchase Vouchers list, clarifying intent for "Play" (continue draft), "Eye" (preview/view), and "Trash" (delete).

### 3. Financial Scannability
- **Semantic Colors**: Standardized the use of `emerald-600` for balanced/positive amounts and `red-600` for expenses or shortages.
- **Discrepancy Highlighting**: Differences in cash counting or voucher loading are highlighted with `orange-50` or `red-50` backgrounds and explicit icons to ensure users notice operational gaps.
- **Enhanced Tables**: History and detail tables now include icons (Clock, User, Package) to improve scannability and accessibility.

## Component Evolution
- `PurchaseVouchersClient`: Serves as a reference for handling complex multi-step workflows (Draft -> Items -> Finalize) within a list view.
- `VoucherDetailClient`: Reinforces the "Metadata Pill" and "Financial Sidebar" patterns.
- `CashClient`: Demonstrates the "Header Status Badge" and "Standardized Summary Cards" pattern for operational dashboards.
