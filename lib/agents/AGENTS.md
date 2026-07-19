# Arquitectura de Agentes - RPM

## Visión General

Nitro es el asistente virtual del staff de RPM. Arquitectura de **agente único** con system prompt compuesto dinámicamente según el **rol del usuario** y la **ruta que está visitando**.

## Estructura de Directorios

```
lib/agents/
├── AGENTS.md                  # Este archivo
├── unified-instructions.md    # Layer 2: tools, flujos, reglas (base prompt)
├── unified-tools.ts           # Tools disponibles para el agente
├── tools/                     # Tools individuales (una por carpeta)
│   ├── compose-message/
│   ├── process-purchase-invoice/
│   ├── register-customer-with-vehicle/
│   └── search-products-with-prices/
├── work-orders/tools.ts       # Tools de órdenes de trabajo
├── finance/tools.ts           # Tools de finanzas/caja
└── utils/
    ├── promptComposer.ts      # Compositor del system prompt (4 capas)
    ├── createTool.ts          # Factory para eliminar boilerplate de tools
    ├── pendingActions.ts      # Acciones pendientes (confirmación de tools)
    ├── extract-document.ts    # Extracción de datos de documentos (vision AI)
    └── logger.ts              # Logger centralizado
```

> **Nota:** Las tools de clientes, productos y vehículos viven en `lib/services/{customer,product,vehicle}/` y se importan en `unified-tools.ts`. Las tools de work-orders y finanzas viven en `lib/agents/{work-orders,finance}/tools.ts` porque son específicas del bot.

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
│ chatId, userName, current page, page content,    │
│ modal content, file attachments                  │
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
  pageContent?: string;     // Texto extraído del <main> (lo que el usuario ve en pantalla)
  modalContent?: string;    // Texto extraído de un [role="dialog"] abierto
  fileAttachments?: { url: string; mediaType: string }[];  // Archivos adjuntos
}
```

### Page Content (visión del bot)

El bot recibe `pageContent` y `modalContent` extraídos del DOM client-side en `ChatFloating.tsx`:

- **`pageContent`**: `document.querySelector('main').innerText` limpiado y truncado a 1200 chars
- **`modalContent`**: `document.querySelector('[role="dialog"]:not([hidden])').innerText` truncado a 500 chars
- Se extraen al enviar cada mensaje (no en cada render) para garantizar frescura
- Si el contenido es menor a 50 chars, no se envía (evita ruido)
- El bot sabe que es una representación textual, no datos definitivos — debe usar tools para datos precisos

### Entry Point

**`/api/bot/chat` (route.ts)** — Streaming con `streamText` y `unifiedTools`. Llama a `composeSystemPrompt(context)` para obtener el prompt completo.

## Mantenimiento Obligatorio

### routeContexts — Debe mantenerse actualizado

El diccionario `routeContexts` en `promptComposer.ts` **debe** mantenerse sincronizado con las rutas reales de `app/adm/`. 

**Reglas:**

- **Cada nueva ruta bajo `/adm/`** debe tener su entrada en `routeContexts`
- **Rutas eliminadas** deben removerse de `routeContexts`
- **Cambios de nombre de ruta** deben reflejarse en `routeContexts`
- El matching es exacto primero, luego prefix (longest first) — las rutas más largas tienen prioridad
- No requiere changes en otros archivos

**Cómo agregar una ruta nueva:**

```typescript
const routeContexts: Record<string, string> = {
  // ...
  '/adm/new-page': `## Contexto de Ruta
El usuario se encuentra en la sección **New Page** y posiblemente te haga consultas relacionadas con X, Y y Z.`,
};
```

**Verificación:** Al agregar o mover una ruta en `app/adm/`, verificar que `routeContexts` tenga cobertura. Una ruta sin entrada cae en fallback (sin contexto de ruta), lo que degrada la calidad de las respuestas del bot.

### getRolePrompt — Mantener sincronizado con roles.ts

Si se agrega un nuevo `UserRole` en `lib/auth/roles.ts`, agregar su entrada en `getRolePrompt()` dentro de `promptComposer.ts`.

### getIdentityPrompt — Mantener sincronizado con Page Content

Si se agregan nuevos campos dinámicos al runtime (además de `pageContent`, `modalContent`), documentarlos en la sección "Conocimiento del Usuario" de `getIdentityPrompt()` para que el bot sepa cómo usarlos.

### Agregar tools

1. Crear la tool en `lib/agents/tools/{tool-name}/index.ts` + `tool.ts`
2. Exportar desde `unified-tools.ts`
3. Documentar en `unified-instructions.md` (sección "Tools Disponibles")
4. Agregar labels visuales (`toolLabels` y `completedLabels`) en `components/bot/ChatFloating.tsx`

### Modificar identidad o personalidad

Editar `getIdentityPrompt()` en `promptComposer.ts` (Layer 1).

### Modificar tools, flujos o reglas

Editar `unified-instructions.md` (Layer 2).

## Roles

Los roles se definen en `lib/auth/roles.ts`:

- **ADMIN** — Acceso completo: configuración, precios, usuarios, reportes
- **STAFF** — Operativo: ventas, OTs, clientes, vehículos (sin config)
- **USER** — Limitado: consulta de productos y precios

Cada rol recibe un prompt de permisos diferente (Layer 3a). Las tools son las mismas para todos los roles — el control de acceso se hace por prompt, no por tools selectivas.

## Convenciones

- **Idioma:** Código en inglés, prompts en español argentino
- **Prompts base:** Archivos `.md`, no strings inline
- **Tools:** Usar `tool()` del AI SDK con `zod` para input schema
- **Logging:** Usar `logger` de `utils/logger.ts`, no `console.log`
- **Tipos:** `BotContext` se importa de `promptComposer.ts`, `UserRole` de `auth/roles.ts`
- **No duplicar:** La identidad y reglas viven en un solo lugar (promptComposer + unified-instructions.md)
