---
name: ui-view-and-component
description: MUST be used BEFORE creating or modifying ANY view in /adm/* panel. Standardized design system for consistent admin interfaces. NO back buttons allowed.
---

# Admin Panel UI Standards

## View Structure (Always Follow)

Every admin view MUST use this exact structure:

```tsx
<div className="space-y-6">
  {/* 1. Header Component */}
  <Header title="..." description="..." primaryAction={{...}} />
  
  {/* 2. Optional Detail Cards */}
  <div className="grid gap-4 md:grid-cols-2"> {/* or grid-cols-1 or grid-cols-3 */}
    <Card>...</Card>
    <Card>...</Card>
  </div>
  
  {/* 3. Data Table */}
  <DataTable ... />
</div>
```

### Card Layout Rules
- 1 card: full width (default grid-cols-1)
- 2 cards: `md:grid-cols-2 gap-4`
- 3 cards: `md:grid-cols-3 gap-4`
- Always `gap-4` (1em) between cards

## Header Component (@/components/adm/Header)

**Required props:**
- `title`: Page name (h1)
- `description`: Context/subtitle
- `primaryAction`: Main CTA with icon

**NO `showBackButton`** - Never use back navigation buttons.

**Actions order (left to right):**
1. Secondary actions (outline variant): Delete, Archive, etc.
2. Primary action (slate-900 style): Create, Edit, Save

## DataTable Configuration

**Standard props:**
```tsx
import { Pencil, Trash2, Eye, Plus } from 'lucide-react';

<DataTable
  data={items}
  columns={columns}
  title="Table Subtitle"
  enableGlobalFilter={true}
  globalFilterPlaceholder="Buscar [entidad]..."
  headerActions={[
    {
      label: "[Entidad]",  // e.g., "OT", "Vehículo"
      onClick: handleCreate,
      icon: Plus,
    },
  ]}
  rowActions={(row) => (
    <div className="flex gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8" 
        title={`Editar ${entityName}`}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8" 
        title={`Eliminar ${entityName}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )}
/>
```

## Row Actions Standard

Always use Lucide icon buttons with descriptive titles:

| Action | Icon | Title Pattern |
|--------|------|---------------|
| Edit | `Pencil` | `Editar [entidad]` |
| Delete | `Trash2` | `Eliminar [entidad]` |
| View | `Eye` | `Ver [entidad]` |

**Example:**
```tsx
import { Pencil, Trash2 } from 'lucide-react';

rowActions={(vehicle) => (
  <>
    <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar vehículo">
      <Pencil className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon" className="h-8 w-8" title="Eliminar vehículo">
      <Trash2 className="h-4 w-4" />
    </Button>
  </>
)}
```

## CTA Button Labels

Use icon Plus + label "[Entidad]" format for creation actions:
- `Producto`
- `OT` (Orden de Trabajo)
- `Vehículo`
- `Cliente`

## Prohibited Patterns

- ❌ `showBackButton` in Header
- ❌ Manual `router.back()` buttons
- ❌ Text-only row actions ("Editar", "Eliminar")
- ❌ CTA inside CardHeader

## Modals, Dialogs, Alerts and Confirms

### 1. Alerts and Confirms (UIProvider)

**Use `useUI()` hook for all alerts and confirmations:**

```tsx
import { useUI } from '@/components/ui/UIProvider';

function MyComponent() {
  const { alert, confirm } = useUI();
  
  // Alert for error/success messages
  await alert({
    title: 'Error',
    description: 'Mensaje descriptivo del error',
    variant: 'error' | 'success' | 'warning' | 'info'
  });
  
  // Confirm for destructive actions
  const confirmed = await confirm({
    title: 'Desactivar Producto',
    description: `¿Estás seguro de desactivar "${product.name}"?`,
    confirmText: 'Desactivar',
    cancelText: 'Cancelar',
    variant: 'destructive'
  });
  
  if (confirmed) { /* proceed with action */ }
}
```

**Alert/Confirm Patterns:**

| Action | Title Pattern | Variant |
|--------|---------------|---------|
| Error | `"Error"` | `error` |
| Success | `"Éxito"` | `success` |
| Delete/Disable | `"[Acción] [Entidad]"` (e.g., "Desactivar Producto") | `destructive` |

### 2. Form Modals (ModalBase)

**Always use `ModalBase` + `ModalBaseFooter` for form dialogs:**

```tsx
import { ModalBase, ModalBaseFooter } from '@/components/ui/ModalBase';

<ModalBase
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title={editingEntity ? 'Editar [Entidad]' : 'Nueva [Entidad]'}
  description={editingEntity 
    ? 'Modifica los datos del [entidad] existente.' 
    : 'Completa los datos para crear un nuevo [entidad].'}
  maxWidth="md" | "lg"
  footer={
    <ModalBaseFooter
      onCancel={() => setIsOpen(false)}
      onSave={handleSave}
      saveText={editingEntity ? 'Guardar Cambios' : 'Crear [Entidad]'}
      isLoading={isLoading}
      disabled={!isValid}
    />
  }
>
  <EntityForm formData={formData} setFormData={setFormData} />
</ModalBase>
```

**Modal Title Patterns:**

| Operation | Title Pattern | Example |
|-----------|---------------|---------|
| Create | `"Nueva [Entidad]"` / `"Nuevo [Entidad]"` | "Nuevo Producto", "Nueva Categoría" |
| Edit | `"Editar [Entidad]"` | "Editar Producto", "Editar Cliente" |
| View | `"[Entidad]: [Name]"` | "Producto: LED Bar 20\"" |

**Description Patterns:**
- Create: `"Completa los datos para crear un nuevo [entidad]."`
- Edit: `"Modifica los datos del [entidad] existente."`

**Width Guidelines:**

| Form Complexity | maxWidth |
|-----------------|----------|
| Simple (2-4 fields) | `md` (448px) |
| Medium (5-8 fields) | `lg` (512px) |
| Complex (10+ fields, grid) | `xl` (576px) |

### 3. Footer CTA Guidelines

**Footer buttons in modals: TEXT ONLY (no icons)**

| Location | Icon Usage | Example |
|----------|------------|---------|
| **Modal Footer** | ❌ NO icons | `Cancelar`, `Guardar Cambios` |
| **Header Actions** | ✅ Icon + text | `<Plus /> Categoría` |
| **Row Actions** | ✅ Icon only | `<Pencil />`, `<Trash2 />` |

**Rationale:** Footer buttons are final action confirmations and need maximum text clarity. Icons in footers create visual noise and don't add value since the context is already established by the modal title.

**Standard ModalBaseFooter:**
```tsx
<ModalBaseFooter
  onCancel={onClose}
  onSave={handleSave}
  saveText="Guardar Cambios"  // Text only, NO icons
  cancelText="Cancelar"       // Text only, NO icons
/>
```

**Prohibited in footers:**
- ❌ `<Save className="h-4 w-4" /> Guardar` - Icono innecesario
- ❌ `<X /> Cancelar` - Icono innecesario
- ❌ Emojis en botones: `💾 Guardar`

### 4. Entity-Specific Dialog Components

**For reusable form modals, create `{Entity}Dialog` components:**

```
components/
├── products/
│   ├── ProductForm.tsx      # Form component only
│   └── ProductDialog.tsx    # Modal + Form wrapper
├── services/
│   ├── ServiceForm.tsx
│   └── ServiceDialog.tsx
└── users/
    ├── UserForm.tsx
    └── UserDialog.tsx
```

**Dialog Component Structure:**

```tsx
interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;  // null = create mode
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
  onSubmit: () => void;
  isValid: boolean;
  isLoading?: boolean;
}

export function ProductDialog({ ...props }: ProductDialogProps) {
  // Wraps ModalBase with form-specific configuration
}
```

### 4. Prohibited Patterns

- ❌ Using shadcn `Dialog` directly (use `ModalBase`)
- ❌ Hardcoded `maxWidth` values like `max-w-2xl`
- ❌ Inline forms without `ModalBaseFooter`
- ❌ Manual footer buttons instead of `ModalBaseFooter`
- ❌ Different naming patterns across entities

### 5. Migration Path

When refactoring existing dialogs:
1. Extract form to `{Entity}Form.tsx`
2. Create `{Entity}Dialog.tsx` using `ModalBase`
3. Replace inline `<Dialog>` with `<EntityDialog>`
4. Use `useUI()` for alerts/confirms instead of inline modals
