🚦 Estado: � Parcialmente implementado (SDK integrado, Gemini configurado, multi-agente en progreso)

# NITRO - Asistente Multi-Agente (Bot)

## 1. Propósito / Alcance
Proveer un asistente inteligente ("Nitro") basado en IA que interactúa con el personal del taller y ventas a través de comandos naturales. El bot podrá consultar información del sistema, crear registros y asistir en tareas operativas reduciendo la fricción de la interfaz gráfica clásica.

## 2. Casos de Uso Principales (Flujos de éxito)
- **Consulta Rápida**: "Nitro, ¿cuánto stock hay de luces LED H4?" -> El bot consulta la base de datos y responde.
- **Acciones Operativas (Tools)**: "Nitro, la OT 105 está lista." -> El bot actualiza el estado de la OT a READY.
- **Roles Específicos**: El bot cambia su comportamiento y herramientas disponibles dependiendo de si el usuario logueado es SELLER, TECHNICIAN o ADMIN.
- **Crear Clientes**: "Nitro, crea un cliente con nombre Pedro Corbalán" -> El bot recopila datos, muestra resumen y pide confirmación antes de crear.
- **Crear Productos**: "Nitro, crea producto Barra LED 20 pulgadas" -> El bot recopila categoría, costos y stock, muestra resumen y pide confirmación.

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: El bot no atiende directamente a clientes finales en esta fase (solo uso interno).
- **RES-02**: El bot no puede ejecutar acciones destructivas (borrar usuarios, eliminar facturas). Toda acción de mutación pasa por validación de tool calling segura.
- **RES-03**: Confirmación obligatoria: Toda creación de registros (clientes, productos) requiere confirmación explícita del usuario antes de ejecutarse.

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1**: Si el bot no entiende un requerimiento, pide clarificación antes de ejecutar una tool.
- **Límite 2**: Gestión de permisos: El bot hereda los permisos del usuario logueado.
- **Validación 1**: Cada acción que el bot intenta realizar queda registrada en logs de auditoría.
- **Validación 2**: Para crear clientes/productos, el bot debe: (1) recopilar datos mínimos, (2) mostrar resumen, (3) pedir confirmación, (4) solo entonces ejecutar.

## 5. Arquitectura Multi-Agente

### Orquestador Principal
- Mantiene el contexto de la conversación, tono y URL actual.
- No ejecuta CRUD directamente.
- Delega a subagentes especializados por área.
- Máximo 10-15 tools por subagente para evitar alucinaciones.

### Subagentes Especializados
- **Customers Agent**: Maneja búsqueda, draft y creación de clientes.
- **Products Agent**: Maneja búsqueda, draft y creación de productos.
- **Stock Agent**: Consulta stock actual (ya implementado).

### Delegación
- El orquestador decide cuándo delegar según intención del usuario.
- Los subagentes tienen prompts específicos y tools acotadas.
- Cada subagente maneja su propio dominio de conocimiento.

## 6. Confirmación Obligatoria

Toda mutación (crear cliente, crear producto) debe seguir este flujo:

1. Usuario pide crear entidad.
2. Bot extrae campos disponibles.
3. Bot pregunta campos requeridos faltantes.
4. Bot muestra resumen.
5. Bot pide confirmación explícita.
6. Solo si el usuario confirma, ejecuta la tool final de creación.

Confirmaciones válidas: "sí", "confirmo", "dale", "crear", "guardar".
Cancelaciones válidas: "no", "cancelar", "descartar".

## 7. Sesión Conversacional

- **chatId**: Basado en `userId` para persistir durante navegación.
- **Historial**: In-memory por ahora (migrar a DB si se valida).
- **Pending Actions**: Estado in-memory por `chatId` para drafts pendientes de confirmación.
- **Contexto**: URL actual se inyecta en system prompt para entender intención.

## 8. Dependencias Técnicas Clave
- **SDK**: `ai` (Vercel AI SDK v6+)
- **Provider**: `@ai-sdk/google` (Google Gemini)
- **Modelo**: `gemini-2.5-flash` con `serviceTier: 'flex'` (50% más barato)
- **Servicios**: `customerService.ts` (pendiente), `productService.ts` (existente)
- **Integración**: Tools como wrappers sobre servicios existentes.
