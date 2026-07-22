<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Política de Idioma

- **Español:** `AGENTS.md`, `specs/*.md`, títulos/descripción de PRs
- **Inglés:** Código fuente, variables, funciones, comentarios, tests, commits
- **Excepción:** Mensajes de error de negocio pueden estar en español

---

# Drizzle ORM

- **Versión:** Drizzle ORM 0.45.2 + Drizzle Kit 0.31.10
- **Prohibido reset de la base de datos**
- **Sharp:** Importación dinámica `await import('sharp')` con fallback (módulo nativo no bundlable)
- **Schema:** `db/schema/schema.ts` — definición de tablas
- **Relations:** `db/schema/relations.ts` — relaciones entre tablas
- **Client:** `lib/db.ts` — exporta `db` (Drizzle instance con node-postgres Pool)
- **Migraciones:** `db/migrations/` — usar `pnpm db:generate` para crear, `pnpm db:migrate` para aplicar
- **Timestamps:** Todas las columnas timestamp usan `mode: 'string'` — Drizzle devuelve strings, no Date objects

---

# Validar Cambios — Prohibido Asumir

NUNCA asumir que un cambio funciona. Validar con herramientas concretas antes de responder.

- **API:** `curl` · **UI:** Playwright/Puppeteer MCP · **DB:** `psql` o queries · **Auth:** cookies/tokens
- **Flujo:** Cambio → Validar → Confirmar → Responder

---

# Specs y Tests

*(aplica si existe `/specs/`)*

1. Leer specs relacionadas antes de programar
2. Actualizar specs y tests antes de implementar (TDD: 🔴 → 🟢)
3. Implementación nunca ocurre antes de actualización de specs y validación
4. Tests: misma carpeta del servicio, nomenclatura `xx.test.ts`, JSDoc inicial
5. Herramienta: Vitest
6. Cada spec debe tener semáforo en línea 1: 🟢 / 🟡 / 🔴

---

# Cache y Revalidation Selectiva

- **Nunca** remover completamente el cache de páginas con queries complejas a BD
- Usar `revalidate: 60` + `revalidatePath('/adm')` tras mutaciones relevantes
- Agregar revalidation en servicios que mutan datos (ventas, OTs, stock, notas de crédito, movimientos de caja)

---

# Arquitectura

## Servicios

- Lógica de negocio como **funciones puras** en `lib/services/`
- **Prohibido** lógica de negocio en API routes — solo orquestar params y llamar servicios
- Stateless, tipadas, JSDoc, sin duplicación
- Reutilizadas por API routes (`app/api/`) y agent tools (`lib/agents/tools/`)

## Componentes

- **Prohibido** componentes inline en páginas — separar en `components/[feature]/`
- UI: `components/ui/*.tsx` · Feature: `components/[feature]/*.tsx` · Page: `app/**/page.tsx`
- Límites: Page ≤150 líneas / ≤5 props / ≤3 hooks · Feature ≤300 líneas / ≤15 props / ≤8 hooks
- Extraer si: >20 líneas JSX, reutilizable, responsabilidad única

---

# Development Auth Bypass

- Env-var based: `RPM_DEV_BYPASS_AUTH=true pnpm dev` — sin cookies, sin endpoints, sin tokens
- `lib/dev-auth.ts` exporta `isDevBypassEnabled()` y `createDevSession()`
- Solo activa cuando `NODE_ENV === 'development' && RPM_DEV_BYPASS_AUTH === 'true'`
- En producción el bypass **literalmente no existe** en el código ejecutable

---

# Protección Contra Doble-Click en Formularios

Todo formulario de creación/edición debe implementar estado `isSubmitting`:

- `if (isSubmitting) return` al inicio del handler
- `setIsSubmitting(true)` antes del API call
- `setIsSubmitting(false)` en `finally`
- Pasar `isLoading={isSubmitting}` al Dialog/Footer

---

# Variables de Entorno

- NUNCA hardcodear credenciales — SIEMPRE usar env vars
- NUNCA commitear `.env` con datos reales — validar `.gitignore`

---

# UI/UX Rules

- **Primary CTA:** En el `Header`, no duplicado en tablas
- **Header Stats:** Entre `Header` y tabla usando `CrudStats`
- **Semantic Colors:** Tailwind (`text-emerald-700`, `text-red-700`) — peso 700 para contraste WCAG AA
- **Financial Colors:** `emerald-600` positivos/cuadrados · `red-600` deudas/egresos
- **Standardized List Row:** Contenedor `w-8 h-8 rounded-lg bg-primary/10 border border-primary/20` + icono Lucide `h-4 w-4` + `font-semibold tracking-tight`
- **Form UX:** Iconos contextuales absolutos con `pl-9` · `font-mono` para campos técnicos
- **Monedas:** `formatARS(amount, decimals)` con `font-mono font-semibold`
- **Empty States:** Iconos decorativos con `text-muted-foreground/20`
- **Dashboard Cards:** Iconos Lucide con `aria-hidden="true"` y `pointer-events-none`
- **Skeletons:** `loading.tsx` debe imitar proporciones reales de columnas
- **Settings Layout:** `max-w-3xl mx-auto` · tarjetas `overflow-hidden` · `CardHeader` con `bg-muted/20`
- **Interaction Feedback:** Estados `hover` visibles (`bg-primary/5`) con transiciones suaves

---

# Boy Scout Rule

Cada modificación deja el archivo en mejor estado: legibilidad, comentarios, nombres. Sin bugs, alcance razonable.
