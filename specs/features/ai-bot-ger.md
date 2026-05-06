🚦 Estado: 🔴 No iniciado (Fase de planificación y diseño de prompts)

# GER - Asistente Multi-Agente (Bot)

## 1. Propósito / Alcance
Proveer un asistente inteligente ("Ger") basado en IA que interactúa con el personal del taller y ventas a través de comandos naturales. El bot podrá consultar información del sistema, crear registros y asistir en tareas operativas reduciendo la fricción de la interfaz gráfica clásica.

## 2. Casos de Uso Principales (Flujos de éxito)
- **Consulta Rápida**: "Ger, ¿cuánto stock hay de luces LED H4?" -> El bot consulta la base de datos y responde.
- **Acciones Operativas (Tools)**: "Ger, la OT 105 está lista." -> El bot actualiza el estado de la OT a READY.
- **Roles Específicos**: El bot cambia su comportamiento y herramientas disponibles dependiendo de si el usuario logueado es SELLER, TECHNICIAN o ADMIN.

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: El bot no atiende directamente a clientes finales en esta fase (solo uso interno).
- **RES-02**: El bot no puede ejecutar acciones destructivas (borrar usuarios, eliminar facturas). Toda acción de mutación pasa por validación de tool calling segura.

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1**: Si el bot no entiende un requerimiento, pide clarificación antes de ejecutar una tool.
- **Límite 2**: Gestión de permisos: El bot hereda los permisos del usuario logueado.
- **Validación 1**: Cada acción que el bot intenta realizar queda registrada en logs de auditoría.

## 5. Dependencias Técnicas Clave
- **SDK**: `ai` (Vercel AI SDK - Pendiente instalación)
- **Modelos**: OpenAI (GPT-4o / GPT-4o-mini) o Anthropic.
- **Integración**: Requiere refactorización de lógica de negocio a servicios (`lib/services`) para ser consumidos como tools.
