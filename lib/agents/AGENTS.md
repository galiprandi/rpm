# Arquitectura de Agentes - RPM

## Visión General

Este directorio contiene la arquitectura de agentes para el sistema de RPM Tucumán. Los agentes están organizados en una estructura modular que permite separar la lógica de dominio de la lógica de interacción con el usuario.

## Estructura de Directorios

```
lib/agents/
├── utils/                    # Utilitarios compartidos
│   ├── createAgent.ts       # Helper centralizado para crear agentes
│   ├── promptComposer.ts    # Composición de prompts contextuales
│   ├── toolsByRole.ts       # Herramientas disponibles por rol
│   ├── chatHistory.ts       # Gestión de historial de conversación
│   └── types.ts             # Tipos compartidos
├── tools/                    # Herramientas reutilizables
│   └── get-product/         # Tool de búsqueda de productos
│       ├── index.ts         # Definición de la tool
│       ├── execute.ts       # Lógica de ejecución
│       └── parser.ts        # Formato de salida
├── stock/                    # Subagente especialista en stock
│   ├── index.ts             # Definición del stockAgent
│   ├── instructions.md      # Prompt del agente
│   └── consultarStock.ts    # Tool de delegación
└── orchestrator/             # Agente principal (orchestrator)
    ├── index.ts             # Definición del orchestrator
    └── instructions.md      # Prompt del agente
```

## Conceptos Clave

### Agentes vs Subagentes

**Agentes (Orchestrator):**
- Reciben mensajes directos del usuario
- Delegan tareas a subagentes especializados
- Mantienen el contexto de la conversación
- Aplican prompts contextuales según rol y URL

**Subagentes (Stock):**
- Especialistas en un dominio específico
- Solo ejecutan una tarea bien definida
- No tienen conocimiento del contexto de conversación
- Se comunican a través de tools de delegación

### Helper createAgent

`lib/agents/utils/createAgent.ts` centraliza la creación de agentes:

```typescript
createAgent({
  instructions: string | './path/to/instructions.md',  // Prompt (string o archivo .md)
  tools: Record<string, any>,                            // Herramientas del agente
  model?: string,                                         // Modelo opcional
})
```

**Características:**
- Lee prompts desde archivos `.md` si se proporciona una ruta
- Fallback al string original si falla la lectura del archivo
- Configura automáticamente el modelo OpenAI
- Retorna un `ToolLoopAgent` configurado

### Sistema de Prompts Contextuales

Los prompts se componen en tres niveles:

1. **Base (archivo .md):** Instrucciones fundamentales del agente
2. **Contextual (promptComposer):** Información según rol y URL actual
3. **Conversación (chatHistory):** Historial de mensajes previos

Ejemplo en orchestrator:
```typescript
const baseInstructions = './instructions.md';
const contextInstructions = composeSystemPrompt(context);
const fullPrompt = `${baseInstructions}\n\n${contextInstructions}`;
```

### Tools por Rol

`lib/agents/utils/toolsByRole.ts` define qué herramientas están disponibles para cada rol:

```typescript
toolsByRole: Record<UserRole, Record<string, Tool>> = {
  ADMIN: { consultarStock },
  SELLER: { consultarStock },
  TECHNICIAN: {},
  STAFF: { consultarStock },
}
```

**Convención:** Usar tools de delegación (ej: `consultarStock`) en lugar de tools directos (ej: `get_product`).

## Convenciones

### Creación de Nuevos Subagentes

1. **Crear directorio:** `lib/agents/{domain}/`
2. **Crear instructions.md:** Prompt del agente en español
3. **Crear index.ts:** Definir el agente usando `createAgent`
4. **Crear tool de delegación:** En el mismo directorio o en `tools/`

Ejemplo:
```typescript
// lib/agents/sales/index.ts
import { createAgent } from '../utils/createAgent';
import { someTool } from '../tools/some-tool';

export const salesAgent = createAgent({
  instructions: './instructions.md',
  tools: { someTool },
});
```

### Creación de Nuevas Tools

1. **Crear directorio:** `lib/agents/tools/{tool-name}/`
2. **Crear index.ts:** Definir la tool usando `tool()` del AI SDK
3. **Crear execute.ts:** Lógica de ejecución
4. **Crear parser.ts (opcional):** Formato de salida

Ejemplo:
```typescript
// lib/agents/tools/my-tool/index.ts
import { tool } from 'ai';
import { z } from 'zod';

export const myTool = tool({
  description: 'Descripción de la tool',
  inputSchema: z.object({
    param: z.string(),
  }),
  execute: async ({ param }) => {
    // Lógica aquí
  },
});
```

### Separación de Responsabilidades

**No mezclar:**
- Lógica de dominio con lógica de interacción
- Prompts del agente con prompts contextuales
- Tools directas con tools de delegación

**Sí separar:**
- Cada subagente en su propio directorio
- Prompts base en archivos `.md`
- Lógica de ejecución en `execute.ts`

## Ejemplos de Uso

### Crear un nuevo subagente

```typescript
// lib/agents/custom/index.ts
import { createAgent } from '../utils/createAgent';
import { customTool } from '../tools/custom-tool';

export const customAgent = createAgent({
  instructions: './instructions.md',
  tools: { customTool },
});
```

### Agregar tool al orchestrator

```typescript
// lib/agents/utils/toolsByRole.ts
export const toolsByRole: Record<UserRole, Record<string, any>> = {
  ADMIN: {
    consultarStock,
    customTool,  // ← Agregar aquí
  },
  // ...
};
```

### Crear tool de delegación

```typescript
// lib/agents/custom/delegation.ts
import { tool } from 'ai';
import { z } from 'zod';
import { customAgent } from './index';

export const customTool = tool({
  description: 'Delega al subagente custom',
  inputSchema: z.object({
    task: z.string(),
  }),
  execute: async ({ task }) => {
    const result = await customAgent.generate({ prompt: task });
    return result.text;
  },
});
```

## Testing

### Estrategia de Testing

Cada componente debe tener tests específicos:

#### 1. Helper createAgent

**Archivo:** `lib/agents/utils/createAgent.test.ts`

**Qué testear:**
- Creación de agente con string de instructions
- Creación de agente leyendo desde archivo `.md`
- Fallback a string si falla lectura de archivo
- Parámetro opcional de modelo

**Ejemplo:**
```typescript
describe('createAgent', () => {
  it('should create agent with string instructions', () => {
    const agent = createAgent({
      instructions: 'You are a test agent',
      tools: { testTool },
    });
    expect(agent).toBeDefined();
  });

  it('should read instructions from .md file', () => {
    writeFileSync('test-instructions.md', '# Test');
    const agent = createAgent({
      instructions: './test-instructions.md',
      tools: { testTool },
    });
    expect(agent).toBeDefined();
    unlinkSync('test-instructions.md');
  });
});
```

#### 2. Tools de Delegación

**Archivo:** `lib/agents/{domain}/{tool}.test.ts`

**Qué testear:**
- Descripción correcta de la tool
- InputSchema definido
- Función `execute` existe
- (Opcional) Llamada a la función de ejecución subyacente

**Ejemplo:**
```typescript
describe('consultarStock tool', () => {
  it('should have correct description', () => {
    expect(consultarStockTool.description).toContain('consultar disponibilidad');
  });

  it('should have inputSchema with consulta field', () => {
    const schema = consultarStockTool.inputSchema;
    expect(schema).toBeDefined();
  });

  it('should have execute function', () => {
    expect(consultarStockTool.execute).toBeDefined();
    expect(typeof consultarStockTool.execute).toBe('function');
  });
});
```

#### 3. Subagentes

**Archivo:** `lib/agents/{domain}/index.test.ts`

**Qué testear:**
- El agente se crea correctamente
- Tiene las tools correctas
- El prompt se carga desde archivo `.md` (si aplica)

**Ejemplo:**
```typescript
describe('stockAgent', () => {
  it('should create agent with correct tools', () => {
    expect(stockAgent).toBeDefined();
  });

  it('should have get_product tool', () => {
    // Verificar que el agente tiene la tool correcta
  });
});
```

#### 4. E2E - Delegación

**Archivo:** `lib/agents/{feature}.e2e.test.ts`

**Qué testear:**
- Tools de delegación están en `toolsByRole` por rol
- Tools directas están reemplazadas por delegación
- Estructura de tools es correcta

**Ejemplo:**
```typescript
describe('Subagent Delegation E2E', () => {
  it('should have consultarStock in role tools', () => {
    const adminTools = getToolsForRole('ADMIN');
    expect(adminTools).toHaveProperty('consultarStock');
  });

  it('should not have get_product in role tools', () => {
    const adminTools = getToolsForRole('ADMIN');
    expect(adminTools).not.toHaveProperty('get_product');
  });
});
```

#### 5. Tools de Dominio (ej: get-product)

**Archivo:** `lib/agents/tools/{tool}/parser.test.ts`, `execute.test.ts`

**Qué testear:**
- Parser: formato de salida correcto por rol
- Execute: lógica de negocio correcta
- Manejo de casos edge

### Ejecutar Tests

**Todos los tests de agentes:**
```bash
pnpm vitest run lib/agents/
```

**Tests específicos:**
```bash
# Solo helper
pnpm vitest run lib/agents/utils/createAgent.test.ts

# Solo tools
pnpm vitest run lib/agents/tools/

# Solo e2e
pnpm vitest run lib/agents/*.e2e.test.ts
```

**Modo watch (desarrollo):**
```bash
pnpm vitest lib/agents/
```

### Validación Manual

Además de tests automatizados, validar con `curl`:

```bash
# Test básico de delegación
curl -X POST 'http://localhost:3000/api/bot/chat' \
  -H 'Content-Type: application/json' \
  -b 'rpm_debug_auth=admin' \
  --data-raw '{
    "message": {"parts": [{"type":"text","text":"hay aceite?"}], "id":"msg1", "role":"user"},
    "context": {"role":"ADMIN", "userId":"test"}
  }'
```

Verificar:
- La tool `consultarStock` se llama (no `get_product`)
- La respuesta es correcta
- El contexto de conversación se mantiene

## Logging

### Logger Centralizado

Usar `logger` de `lib/agents/utils/logger.ts` en lugar de `console.log`:

```typescript
import logger from './logger';

// Debug level (solo en modo debug)
logger.debug({ chatId, messageCount }, 'Saving chat history');

// Error level (siempre visible)
logger.error({ error }, 'Operation failed');
```

### Habilitar Modo Debug

Para ver logs de debug en desarrollo:

```bash
# Método 1: Variable de entorno DEBUG
DEBUG=true pnpm dev

# Método 2: Variable específica para agentes
DEBUG_AGENTS=true pnpm dev
```

### Convenciones de Logging

- **`logger.debug()`**: Para información de desarrollo (cargas, guardados, etc.)
- **`logger.info()`**: Para eventos importantes del sistema
- **`logger.error()`**: Para errores y excepciones
- **Estructurar datos**: Usar objetos como primer parámetro para contexto estructurado

## Notas Importantes

- **Idioma:** Todo el código en inglés, prompts en español
- **Tipos:** Usar `any` temporalmente para tools si hay errores complejos
- **Streaming:** Actualmente usando llamadas directas a `execute` por problemas con ToolLoopAgent
- **Contexto:** El orchestrator maneja el contexto, los subagentes son stateless
- **Validación:** Validar con `curl` después de cambios críticos
- **Logging:** Usar `logger` en lugar de `console.log` para mejor estructura y control
