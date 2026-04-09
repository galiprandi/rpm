# Component Development Guidelines

## 📋 Component Organization (OBLIGATORIO)

### Estructura de Carpetas

```
components/
├── ui/                 # Componentes base reutilizables (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   └── *.stories.tsx
├── adm/               # Componentes específicos del área admin
│   ├── layout/
│   ├── CrudAdmin.tsx
│   └── CrudStats.tsx
├── [feature]/         # Componentes por dominio/feature
│   ├── products/
│   ├── customers/
│   ├── work-orders/
│   └── *.stories.tsx
├── public/            # Componentes del sitio público
│   ├── layout/
│   └── sections/
└── AGENTS.md          # Este archivo
```

### Reglas de Ubicación

| Tipo | Ubicación | Ejemplo |
|------|-----------|---------|
| **UI Base** | `components/ui/*.tsx` | `Button`, `Card`, `Dialog` |
| **Admin Feature** | `components/adm/*.tsx` | `AdminSidebar`, `CrudAdmin` |
| **Domain Feature** | `components/[feature]/*.tsx` | `ProductDialog`, `PaymentDialog` |
| **Public Components** | `components/public/*.tsx` | `HeroSection`, `ProductCard` |

### ❌ PROHIBIDO: Mezclar dominios

- No poner componentes admin en `components/ui/`
- No poner componentes de productos en `components/adm/`
- No crear carpetas sin feature clara

---

## 🧪 Testing Strategy

### Pirámide de Testing (Simplificada)

```
        Storybook (70%)
        Visual + Docs
              ↑
    Vitest Unit Tests (30%)
    Lógica + Hooks
```

**No E2E automatizado** - Se realiza QA manual en releases.

---

### 1. Storybook (Visual + Documentación) - PRIMERO

**Obligatorio para TODO componente.**

```bash
pnpm storybook          # Desarrollo visual
pnpm build-storybook    # CI check
```

**Props a incluir en stories:**
- Default state
- Con datos
- Loading state
- Empty state
- Error state
- Edge cases relevantes

### 2. Vitest + React Testing Library - SEGUNDO

**Solo para lógica compleja.**

```bash
pnpm test               # Unit tests
pnpm test:watch         # Modo watch
```

**Qué testear:**
- Cálculos (precios, totales, márgenes)
- Validaciones de formularios
- Transformaciones de datos
- Hooks complejos

**NO testear:**
- Renderizado visual (Storybook lo cubre)
- CSS
- Callbacks simples
- Estructura del DOM

---

## 📖 Storybook Integration - MANDATORY

### Rule: Every Component Must Have a Story

**Every new component or modification to an existing component MUST include an updated Storybook story.**

### Checklist Obligatorio

- [ ] Crear `[ComponentName].stories.tsx` en MISMA carpeta que el componente
- [ ] Incluir todas las combinaciones significativas de props
- [ ] Agregar `tags: ['autodocs']` en el meta
- [ ] Usar data realista (no "test", "foo", "bar")
- [ ] Testear que funciona en Storybook antes de commit
- [ ] Verificar hot reload funciona

### Story File Template

```typescript
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'Category/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Props por defecto
  },
};

export const WithData: Story = {
  args: {
    // Props con datos reales
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
  },
};

export const Error: Story = {
  args: {
    error: new Error('Failed to load'),
  },
};
```

### Category Naming Convention

| Category | Components | Ubicación física |
|----------|------------|------------------|
| `UI/*` | Button, Input, Card | `components/ui/*.stories.tsx` |
| `Forms/*` | Form, Field, Label | `components/ui/`, `components/adm/` |
| `Layout/*` | Header, Sidebar, Footer | `components/layout/`, `components/adm/layout/` |
| `Data/*` | Table, List, DataGrid | `components/[feature]/*.stories.tsx` |
| `Feedback/*` | Alert, Toast, Modal | `components/ui/*.stories.tsx` |
| `Modals/*` | PaymentDialog, ConfirmDialog | `components/[feature]/*.stories.tsx` |

---

## 🔍 Common Mistakes to Avoid

❌ **Crear componente sin story**  
✅ Cada componente tiene story en creación

❌ **Modificar props sin actualizar stories**  
✅ Actualizar stories cuando cambian props

❌ **Data hardcoded irrealista**  
✅ Usar datos que parezcan reales

❌ **Faltar casos edge**  
✅ Incluir empty, loading, error states

❌ **Sin documentación**  
✅ Usar `autodocs` + JSDoc en componente

❌ **Mezclar componentes admin y public**  
✅ Separar por `components/adm/` y `components/public/`

❌ **Crear componentes inline en pages**  
✅ Extraer a `components/[feature]/`

---

## ✅ Enforcement

### Pre-commit Checklist

```bash
# Antes de cada commit, verificar:
1. pnpm storybook          # Funciona?
2. pnpm build-storybook    # Build pasa?
3. pnpm test               # Unit tests pasan?
```

### Code Review Requirements

1. **Story presente**: `[ComponentName].stories.tsx` existe
2. **Props actualizadas**: Stories reflejan cambios de props
3. **Categoría correcta**: Título sigue convención
4. **Documentación**: `autodocs` + JSDoc presente
5. **Ubicación correcta**: Componente en carpeta apropiada según specs

### CI/CD Gates

```yaml
# .github/workflows/ci.yml debe incluir:
- pnpm build-storybook    # Visual testing + documentation
- pnpm test               # Unit tests (Vitest)
- pnpm lint               # Code quality
- pnpm type-check         # Type safety
```

**Nota:** E2E testing se realiza manualmente en releases. Storybook + Vitest cubren 90% de regresiones.

---

## 📚 References

- `@[specs/ui-architecture.md]` - Índice de arquitectura UI
- `@[specs/ui-architecture-adm.md]` - Diseño de interfaz admin
- `@[specs/ui-architecture-public.md]` - Diseño de sitio público
- Storybook docs: https://storybook.js.org/docs

---

**Remember: A component without a story is incomplete. A component in the wrong folder creates technical debt.**
