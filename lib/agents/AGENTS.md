# Arquitectura de Agentes - RPM

## Visión General

Nitro es el asistente virtual del staff de RPM. Esta arquitectura unificada permite componer el system prompt dinámicamente según el **rol del usuario** y la **ruta que está visitando**, sin duplicar lógica entre entry points.

## Estructura de Directorios

```
lib/agents/
├── AGENTS.md                  # Este archivo
├── unified-instructions.md    # Layer 2: tools, flujos, reglas (base prompt)
├── unified-tools.ts           # Tools disponibles para el agente
├── registry.ts                # Tools por rol + helpers
├── utils/
│   ├── promptComposer.ts      # Compositor del system prompt (4 capas)
│   ├── createAgent.ts         # Helper para crear agentes (Groq/Google)
│   ├── types.ts               # Re-exports de BotContext + BotToolInput
│   └── logger.ts              # Logger centralizado
├── orchestrator/
│   ├── index.ts               # Crea el agente con prompt + tools
│   ├── delegation.ts          # Tools de delegación a subagentes
│   └── composite.ts           # Tools compuestas (multi-step)
├── tools/                     # Tools individuales
│   ├── search-products-with-prices/
│   ├── compose-message/
│   └── process-purchase-invoice/
├── customers/                 # Subagente de clientes
├── finance/                   # Subagente de finanzas
├── inventory/                 # Subagente de inventario
├── work-orders/               # Subagente de OTs
└── simple/                    # Agente simple (legacy, solo createProduct)
```

## Arquitectura del System Prompt (4 Capas)

El system prompt se compone en `promptComposer.ts` mediante `composeSystemPrompt(context: BotContext)`:

```
┌─────────────────────────────────────────────────┐
│ Layer 1: IDENTITY                                │
│ Nombre, personalidad, principios, formato        │
│ (estático, definido en promptComposer.ts)        │
├─────────────────────────────────────────────────┤
│ Layer 2: BASE                                    │
│ Tools, flujos, reglas, asesor técnico            │
│ (leído de unified-instructions.md)               │
├─────────────────────────────────────────────────┤
│ Layer 3a: ROLE                                   │
│ Permisos y capacidades según UserRole            │
│ (ADMIN / STAFF / USER)                           │
├─────────────────────────────────────────────────┤
│ Layer 3b: ROUTE                                  │
│ Hints contextuales según la ruta actual          │
│ (/adm/products, /adm/work-orders, etc.)          │
├─────────────────────────────────────────────────┤
│ Layer 4: RUNTIME                                 │
│ chatId, current page, file attachments           │
│ (dinámico, por request)                          │
└─────────────────────────────────────────────────┘
```

### BotContext

```typescript
interface BotContext {
  role: UserRole;           // ADMIN | STAFF | USER (from lib/auth/roles)
  pathname?: string;        // Ruta actual del usuario (ej: /adm/products)
  userId?: string;          // ID del usuario autenticado
  userName?: string;        // Nombre del usuario (para personalizar respuestas)
  chatId: string;           // ID único del chat
  fileAttachments?: { url: string; mediaType: string }[];  // Archivos adjuntos
}
```

### Entry Points

Hay dos entry points que usan la misma arquitectura:

1. **`/api/bot/chat` (route.ts)** — Streaming con `streamText`, tools unificadas
2. **`orchestrator/index.ts`** — Creación de agente con `createAgent`, tools por rol

Ambos llaman a `composeSystemPrompt(context)` para obtener el prompt completo.

## Cómo Extender

### Agregar contexto de ruta nueva

En `promptComposer.ts`, agregar entrada al diccionario `routeContexts`:

```typescript
const routeContexts: Record<string, string> = {
  // ...
  '/adm/new-page': `## Contexto de Ruta: New Page
El usuario está en la página de X. Probablemente quiere:
- Acción 1
- Acción 2`,
};
```

El matching es exacto primero, luego prefix (longest first). No requiere changes en otros archivos.

### Agregar tools

1. Crear la tool en `lib/agents/tools/{tool-name}/index.ts`
2. Exportar desde `unified-tools.ts`
3. Si es por rol específico, agregar en `registry.ts` → `toolsByRole`

### Agregar subagente especialista

1. Crear directorio `lib/agents/{domain}/`
2. Crear `instructions.md` con el prompt del subagente
3. Crear `index.ts` usando `createAgent`
4. Crear tool de delegación en `orchestrator/delegation.ts`
5. Agregar al `registry.ts`

### Modificar identidad o personalidad

Editar `getIdentityPrompt()` en `promptComposer.ts` (Layer 1).

### Modificar tools, flujos o reglas

Editar `unified-instructions.md` (Layer 2).

## Roles

Los roles se definen en `lib/auth/roles.ts`:

- **ADMIN** — Acceso completo: configuración, precios, usuarios, reportes
- **STAFF** — Operativo: ventas, OTs, clientes, vehículos (sin config)
- **USER** — Limitado: consulta de productos y precios

Cada rol recibe un prompt de permisos diferente (Layer 3a) y potencialmente tools diferentes (`registry.ts`).

## Convenciones

- **Idioma:** Código en inglés, prompts en español argentino
- **Prompts base:** Archivos `.md`, no strings inline
- **Tools:** Usar `tool()` del AI SDK con `zod` para input schema
- **Logging:** Usar `logger` de `utils/logger.ts`, no `console.log`
- **Tipos:** `BotContext` se importa de `promptComposer.ts`, `UserRole` de `auth/roles.ts`
- **No duplicar:** La identidad y reglas viven en un solo lugar (promptComposer + unified-instructions.md)
