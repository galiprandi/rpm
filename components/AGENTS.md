# Component Development Guidelines

## 📋 Component Organization (OBLIGATORIO)

### Estructura de Carpetas

```
components/
├── ui/                 # Componentes base reutilizables (shadcn/ui)
│   ├── button.tsx
│   └── card.tsx
├── adm/               # Componentes específicos del área admin
│   ├── layout/
│   ├── CrudAdmin.tsx
│   └── CrudStats.tsx
├── [feature]/         # Componentes por dominio/feature
│   ├── products/
│   ├── customers/
│   └── work-orders/
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
    Vitest Unit Tests (100%)
    Lógica + Hooks + UI
```

**No E2E automatizado** - Se realiza QA manual en releases.

### Vitest + React Testing Library

**Obligatorio para lógica compleja.**

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
- CSS
- Callbacks simples
- Estructura del DOM

---

## 🔍 Common Mistakes to Avoid

❌ **Mezclar componentes admin y public**  
✅ Separar por `components/adm/` y `components/public/`

❌ **Crear componentes inline en pages**  
✅ Extraer a `components/[feature]/`

---

## ✅ Enforcement

### Pre-commit Checklist

```bash
# Antes de cada commit, verificar:
1. pnpm test               # Unit tests pasan?
```

### Code Review Requirements

1. **Ubicación correcta**: Componente en carpeta apropiada según specs

### CI/CD Gates

```yaml
# .github/workflows/ci.yml debe incluir:
- pnpm test               # Unit tests (Vitest)
- pnpm lint               # Code quality
- pnpm type-check         # Type safety
```

**Nota:** E2E testing se realiza manualmente en releases. Vitest cubre 90% de regresiones.

---

## 📚 References

- `@[specs/ui-architecture.md]` - Índice de arquitectura UI
- `@[specs/ui-architecture-adm.md]` - Diseño de interfaz admin
- `@[specs/ui-architecture-public.md]` - Diseño de sitio público

---

**Remember: A component in the wrong folder creates technical debt.**
