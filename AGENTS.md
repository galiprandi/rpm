<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🌐 Política de Idioma

## Excepción Especial para Este Proyecto

A diferencia de la regla general de usar inglés para todo contenido técnico, **este proyecto permite y usa español en:**

- **`@[AGENTS.md]`** - Documentación de reglas para agentes
- **`@[specs]`** - Especificaciones del sistema

### ¿Por qué esta excepción?

- El equipo de RPM opera principalmente en español
- Las especificaciones de negocio deben ser claras para stakeholders
- Las reglas de agentes necesitan ser precisas en el idioma del equipo

### Reglas Aplicables

| Tipo de Archivo | Idioma Permitido | Ejemplo |
|-----------------|------------------|---------|
| `AGENTS.md` | 🇪🇸 Español | Esta documentación |
| `specs/*.md` | 🇪🇸 Español | Requisitos de negocio |
| Código fuente | 🇬🇧 Inglés | Variables, funciones, comentarios |
| Tests | 🇬🇧 Inglés | Descripciones de test |
| Commits | 🇬🇧 Inglés | Mensajes de git |
| Docs técnicas | 🇬🇧 Inglés | `docs/*.md` |

---

# Storybook Integration - OBLIGATORIO

## REGLA FUNDAMENTAL: Storybook SIEMPRE Actualizado

**ES ESENCIAL**: Cada vez que se modifique un componente, Storybook debe mantenerse actualizado. Esta es una regla no negociable del proyecto.

### 1. Actualización Obligatoria de Stories

#### 1.1. Cuando Modificar Stories
**SIEMPRE** que se modifique un componente, se DEBE actualizar su correspondiente story:

- ✅ **Cambio de props**: Actualizar args en stories
- ✅ **Cambio de estilos**: Verificar visual consistencia
- ✅ **Nuevas variantes**: Agregar nuevas stories
- ✅ **Eliminación de features**: Remover stories obsoletas
- ✅ **Cambios de comportamiento**: Actualizar lógica de stories

#### 1.2. Flujo Obligatorio
```typescript
// 1. Modificar componente
const Button = ({ variant, size, children, ...props }) => {
  // Nuevo comportamiento
};

// 2. ACTUALIZAR STORY INMEDIATAMENTE
export const NewVariant: Story = {
  args: {
    variant: 'new-variant',  // ← Actualizar
    size: 'lg',              // ← Actualizar
    children: 'New Button',  // ← Actualizar
  },
};
```

### 2. Validación Visual Obligatoria

#### 2.1. Verificación Post-Cambio
Después de cada modificación de componente:

1. **VERIFICAR Storybook**: Confirmar que Storybook está corriendo
2. **SOLICITAR INICIO**: Si Storybook no está corriendo, solicitar al usuario que lo inicie
3. **Comparar visualmente**: App vs Storybook
4. **Validar consistencia**: Estilos idénticos
5. **Documentar cambios**: Actualizar descripciones

#### 2.2. REGLA CRÍTICA: INICIO DE SERVIDORES
**EL USUARIO SIEMPRE INICIA LOS SERVIDORES MANUALMENTE**

- ✅ **Next.js dev server**: El usuario lo inicia manualmente
- ✅ **Storybook dev server**: El usuario lo inicia manualmente en terminal aparte
- ❌ **NUNCA INICIAR SERVIDORES**: El agente NO debe iniciar ningún servidor
- ❌ **NUNCA EJECUTAR**: `pnpm storybook`, `pnpm dev`, `npx storybook dev`, etc.

#### 2.3. Flujo de Servidores
```bash
# ❌ PROHIBIDO: El agente NO debe ejecutar estos comandos
pnpm storybook
pnpm dev
npx storybook dev --port 6006

# ✅ CORRECTO: Solicitar al usuario
"Por favor, inicia Storybook con: pnpm storybook"
"¿Puedes iniciar el servidor de desarrollo con: pnpm dev?"
```

#### 2.4. Verificación de Servidores
Antes de cualquier acción que requiera Storybook:

1. **Verificar si Storybook está corriendo**: Intentar acceder a `http://localhost:6006`
2. **Si no está corriendo**: Solicitar al usuario que lo inicie
3. **Esperar confirmación**: No proceder hasta que el usuario confirme que está corriendo
4. **Solo entonces**: Realizar validaciones visuales

#### 2.5. Herramientas de Validación
```bash
# El usuario ejecuta estos comandos manualmente
pnpm storybook          # Verificar funcionamiento
pnpm build-storybook    # Verificar build
```

### 3. Mantenimiento de Stories

#### 3.1. Limpieza de Stories Obsoletas
- **Eliminar** stories de componentes removidos
- **Actualizar** stories de componentes renombrados
- **Limpiar** stories con errores de indexing

#### 3.2. Organización de Stories
```typescript
// Estructura obligatoria
const meta: Meta = {
  title: 'Category/ComponentName',  // ← Categoría correcta
  component: Component,
  parameters: {
    layout: 'centered',             // ← Layout apropiado
  },
  tags: ['autodocs'],
};
```

### 4. Errores Críticos a Evitar

#### 4.1. Errores de Storybook
- ❌ **Indexing errors**: Stories corruptas o vacías
- ❌ **Missing components**: Componentes no encontrados
- ❌ **Import errors**: Rutas incorrectas
- ❌ **Process errors**: Variables de entorno faltantes

#### 4.2. Soluciones Inmediatas
```typescript
// ❌ NO HACER: Story vacía o corrupta
export default {};

// ✅ HACER: Story completa y funcional
const meta: Meta = {
  title: 'Component/Name',
  component: Component,
};
```

### 5. Integración con Flujo de Trabajo

#### 5.1. Durante Desarrollo
1. **Modificar componente**
2. **Actualizar story** ← OBLIGATORIO
3. **Verificar Storybook corriendo** ← SOLICITAR AL USUARIO
4. **Validar visualmente** ← OBLIGATORIO
5. **Testear en Storybook** ← OBLIGATORIO

#### 5.2. Antes de Commit
```bash
# El usuario ejecuta estos comandos manualmente
pnpm storybook          # Verificar funcionamiento
pnpm build-storybook    # Verificar build
```

### 6. Consecuencias de No Cumplir

#### 6.1. Si Storybook no está actualizado:
- ** Rechazo automático** de pull requests
- ** Bloqueo** de despliegues
- ** Pérdida** de documentación visual
- ** Inconsistencia** entre app y documentación

#### 6.2. Validación Automática
```bash
# CI/CD verificará automáticamente
if [ ! -f "components/X/X.stories.tsx" ]; then
  echo "❌ Storybook story missing"
  exit 1
fi
```

---

# Storybook AI/MCP Integration - OBLIGATORIO

## REGLA FUNDAMENTAL: Usar MCP de Storybook

**ES ESENCIAL**: Siempre usar las herramientas MCP de Storybook antes de cualquier acción con componentes UI.

### 1. MCP Server Configuration

#### 1.1. Endpoint MCP
- **URL**: `http://localhost:6006/mcp`
- **Disponibilidad**: Cuando Storybook está corriendo
- **Herramientas**: Acceso a documentación y componentes

#### 1.2. Flujo MCP Obligatorio
**ANTES** de cualquier acción con componentes UI:

1. **Verificar MCP**: `http://localhost:6006/mcp`
2. **Listar componentes**: `list-all-documentation`
3. **Consultar componente**: `get-documentation`
4. **Verificar propiedades**: Validar en documentación
5. **Actualizar stories**: `get-storybook-story-instructions`

### 2. Uso Obligatorio de MCP Tools

#### 2.1. Herramientas MCP Disponibles
- ✅ `list-all-documentation` - Listar todos los componentes
- ✅ `get-documentation` - Obtener documentación de componente
- ✅ `get-storybook-story-instructions` - Instrucciones para stories
- ✅ `run-story-tests` - Ejecutar tests de stories

#### 2.2. Flujo de Trabajo con Componentes
```typescript
// 1. ANTES de usar cualquier propiedad
const result = await get-documentation({ component: 'Button' });

// 2. VERIFICAR propiedades documentadas
if (result.properties.includes('variant')) {
  // ✅ Usar propiedad documentada
  componentProps.variant = 'primary';
} else {
  // ❌ NO asumir propiedades
  return askUser('Property "variant" not documented');
}

// 3. OBTENER instrucciones de stories
const instructions = await get-storybook-story-instructions();
```

### 3. PROHIBICIONES CRÍTICAS

#### 3.1. NUNCA Hacer
```typescript
// ❌ NUNCA asumir propiedades
componentProps.shadow = true;  // NO documentado

// ❌ NUNCA usar convenciones de nombres
componentProps.size = 'large';  // Podría no existir

// ❌ NUNCA crear sin verificar
export const NewStory = () => <Button size="xl" />;  // size no verificado
```

#### 3.2. SIEMPRE Hacer
```typescript
// ✅ SIEMPRE verificar con MCP
const docs = await get-documentation({ component: 'Button' });
const validProps = docs.properties;

// ✅ SIEMPRE usar propiedades documentadas
if (validProps.includes('variant')) {
  return <Button variant="primary" />;
}

// ✅ SIEMPRE consultar instrucciones
const instructions = await get-storybook-story-instructions();
```

### 4. Validación con MCP

#### 4.1. Antes de Commit
```bash
# 1. Verificar MCP disponible
curl http://localhost:6006/mcp

# 2. Listar componentes
# Usar tool: list-all-documentation

# 3. Validar stories
# Usar tool: run-story-tests
```

#### 4.2. Después de Cambios
```typescript
// 1. Verificar documentación actualizada
const docs = await get-documentation({ component: 'ModifiedComponent' });

// 2. Validar propiedades usadas
validateUsedProperties(docs.properties);

// 3. Ejecutar tests
const testResults = await run-story-tests();
```

### 5. Integración con AGENTS.md

#### 5.1. Instrucciones para Agentes
**CUANDO trabajes en componentes UI, siempre usa las `shadcn` MCP tools para acceder al conocimiento y documentación de Storybook antes de responder o tomar cualquier acción.**

- **CRÍTICO: Nunca alucines propiedades de componentes!** Antes de usar CUALQUIER propiedad en un componente de un sistema de diseño (incluyendo propiedades de apariencia común como `shadow`, etc.), DEBES usar las MCP tools para verificar si la propiedad está realmente documentada para ese componente.
- Query `list-all-documentation` para obtener una lista de todos los componentes
- Query `get-documentation` para ese componente y ver todas las propiedades disponibles y ejemplos
- Usa solo propiedades que estén explícitamente documentadas o mostradas en stories de ejemplo
- Si una propiedad no está documentada, no asumas propiedades basadas en convenciones de nombres o patrones comunes de otras librerías. Consulta con el usuario en estos casos.
- Usa la tool `get-storybook-story-instructions` para obtener las últimas instrucciones para crear o actualizar stories. Esto asegurará que sigas las convenciones y recomendaciones actuales.
- Verifica tu trabajo ejecutando `run-story-tests`.

**Recuerda: Un nombre de story podría no reflejar el nombre de la propiedad correctamente, así que siempre verifica las propiedades a través de la documentación o stories de ejemplo antes de usarlas.**

**FLUJO OBLIGATORIO:**

1. **PRIMERO** usar MCP tools para acceder a conocimiento de Storybook
2. **CRÍTICO**: Nunca alucinar propiedades de componentes
3. **VERIFICAR** cada propiedad en la documentación
4. **USAR** solo propiedades explícitamente documentadas
5. **CONSULTAR** si una propiedad no está documentada
6. **VALIDAR** trabajo con `run-story-tests`

#### 5.2. Flujo Completo
```typescript
// Paso 1: Listar componentes
const components = await list-all-documentation();

// Paso 2: Obtener documentación
const docs = await get-documentation({ component: componentName });

// Paso 3: Verificar propiedades
validateProperties(docs.properties, intendedProperties);

// Paso 4: Obtener instrucciones
const instructions = await get-storybook-story-instructions();

// Paso 5: Implementar siguiendo documentación
implementComponent(docs, instructions);

// Paso 6: Validar
const tests = await run-story-tests();
```

### 6. Consecuencias de No Usar MCP

#### 6.1. Si no se usa MCP:
- ** Rechazo automático** de pull requests
- ** Componentes inconsistentes** con documentación
- ** Propiedades no documentadas** en código
- ** Tests fallidos** por propiedades incorrectas

#### 6.2. Validación Automática
```bash
# CI/CD verificará uso de MCP
if ! grep -q "get-documentation" changes/; then
  echo "❌ MCP tools not used"
  exit 1
fi
```

---

# Flujo de Trabajo Obligatorio Basado en Especificaciones
*(solo aplica si existe el directorio /specs)*

Este flujo de trabajo se activa solo cuando el repositorio contiene el directorio `/specs` (incluyendo `/specs/SYSTEM_SPEC.md`).

## 1. Revisión de Especificaciones Antes de Cualquier Tarea
Antes de comenzar cualquier implementación, corrección de errores, refactorización o cambio de comportamiento, el agente debe:
- Localizar y leer las especificaciones relacionadas en `/specs`
- Revisar documentos raíz relevantes como `/specs/SYSTEM_SPEC.md`
- **USAR MCP** para verificar componentes UI afectados

## 2. Sin Cambios de Lógica Implícitos
Si el trabajo solicitado requiere cambiar la lógica definida explícitamente en una especificación existente, el agente debe seguir esta secuencia exacta:

### 2.1. Solicitar Autorización
Antes de codificar, explicar al usuario:
- Qué cambiará
- Cómo funciona el comportamiento actual
- Cómo funcionará el comportamiento después del cambio
- Posibles riesgos/problemas/regresiones

### 2.2. Ejecutar Tests Relacionados
Antes de comenzar la implementación, ejecutar los tests relacionados para:
- Validar el comportamiento actual
- Verificar la validez de los tests existentes
- Identificar tests desactualizados o escenarios incorrectos

Si algún test falla, notificar al usuario explicando:
- La causa probable del fallo
- Si los tests requieren actualización
- Si el código necesita corrección previa

### 2.3. Actualizar Especificaciones
Actualizar las especificaciones relacionadas para reflejar el comportamiento aprobado.

### 2.4. Actualizar Tests para Nuevos Requisitos
Actualizar los tests para contemplar los cambios definidos en la especificación. Ejecutarlos para validar que fallen (estado 🔴), creando un ciclo TDD que pasará a verde (🟢) al completar la implementación en el punto 2.5.

Esto garantiza:
- Cambios implementados correctamente
- Sin regresiones introducidas
- Tests sincronizados con la especificación

### 2.5. Implementar Cambio
Implementar el cambio de código alineado con las especificaciones actualizadas.

### 2.5.1. Validación Proactiva Durante la Implementación
Durante el proceso de implementación, el agente debe realizar validaciones continuas:
- **Validación en tiempo real**: Verificar cada componente/función inmediatamente después de implementarlo
- **Testing incremental**: Ejecutar tests relacionados con cada cambio específico
- **Verificación de integración**: Asegurar que el nuevo código se integra correctamente con el existente
- **Testing visual**: Verificar UI/UX en diferentes viewports y dispositivos
- **Testing de datos**: Validar operaciones de base de datos y migraciones
- **Testing de seguridad**: Verificar que no se introducen vulnerabilidades
- **Performance checks**: Monitorear impacto en rendimiento y métricas
- **Cross-browser testing**: Validar funcionamiento en diferentes navegadores
- **Accessibility testing**: Verificar cumplimiento de estándares WCAG
- **Regression testing**: Probar funcionalidades existentes para detectar regresiones
- **Storybook validation**: Verificar que stories coincidan visualmente con la app
- **MCP validation**: Usar herramientas MCP para verificar componentes UI

El agente debe reportar proactivamente cualquier issue, bug o desviación detectada durante estas validaciones, sin esperar a que el usuario lo solicite.

### 2.6. Validación Post-Implementación
- **Ejecutar suite completa de tests**
- **Verificar cobertura de código**
- **Confirmar que todos los tests pasen (🟢)**
- **Validación proactiva integral de la implementación**
- **Verificación de base de datos y migraciones**
- **Validación de UI/UX en diferentes viewports**
- **Testing manual de flujos críticos**
- **Chequeo de regresiones en funcionalidades existentes**
- **Verificación de performance y métricas**
- **Revisión de seguridad y accesos**
- **Validación de Storybook**: Asegurar consistencia visual app vs stories
- **Validación MCP**: Usar herramientas MCP para verificar componentes
- **Documentar cualquier desviación o issue encontrado**

### 2.7. Estándares de Tests
Los archivos de test deben seguir estas convenciones:
- **Ubicación**: Misma carpeta del servicio a testear
- **Nomenclatura**: `xx.test.ts` (donde `xx` es el nombre del servicio)
- **JSDoc obligatorio** al inicio del archivo:
```typescript
/**
 * Test suite para [Nombre del Servicio]
 * 
 * Especificaciones relacionadas:
 * - /specs/path/to/spec.md#sección-relevante
 * 
 * Alcance del test:
 * - Validación de [funcionalidad principal]
 * - Casos límite y edge cases
 * - Integración con [dependencias]
 * 
 * Métricas cubiertas:
 * - Cobertura esperada: >90%
 * - Performance: <Xms de respuesta
 */
```

### 2.8. Herramientas de Testing
- **Frontend y Backend**: Vitest como suite de tests principal
- **Cobertura**: Integrada con Vitest
- **Documentación**: JSDoc estandarizado para vinculación
- **Storybook**: Documentación visual y validación de componentes
- **MCP**: Acceso a documentación y validación de componentes

### 2.9. Mantenimiento Proactivo de Vinculación
Las especificaciones deben incluir un apartado obligatorio:
```markdown
## Tests y Documentación Relacionados
### Tests Unitarios
- `xx.test.ts` - Validación de funcionalidad principal
- `yy.test.ts` - Tests de integración

### Documentación Técnica
- `docs/api-endpoint.md` - Especificación de API
- `docs/architecture.md` - Diagramas de arquitectura

### Storybook Stories
- `Component.stories.tsx` - Documentación visual del componente

### MCP Integration
- Endpoint: `http://localhost:6006/mcp`
- Tools: `list-all-documentation`, `get-documentation`, `run-story-tests`

### Vinculación Activa
- Última actualización: [fecha]
- Estado tests: 🟢 Todos pasando
- Cobertura: 95%
- Storybook: 🟢 Consistente con app
- MCP: 🟢 Disponible y funcional
```

El agente debe mantener esta sección actualizada de forma proactiva durante cada cambio.

## 3. Cumplimiento Estricto del Orden
Para cambios de lógica gobernados por especificaciones, la implementación nunca debe ocurrir antes de:
- La autorización del usuario
- La actualización de las especificaciones
- La actualización de Storybook stories
- La validación con herramientas MCP

---

# Mantenimiento Activo de Documentación

## 4. Revisión y Mantenimiento Continuo
El agente debe revisar y mantener activamente la documentación existente como parte del trabajo de desarrollo normal.

## 5. Sincronización Código-Documentación
Cuando el código y la documentación divergen, el agente debe proponer y aplicar actualizaciones de documentación en el mismo alcance de tarea siempre que sea posible.

## 6. Reflejar Cambios en Documentación
Los nuevos comportamientos, restricciones y reglas operativas introducidas en el código deben reflejarse en:
- Las especificaciones correspondientes
- Documentos técnicos relevantes
- Stories de Storybook actualizadas
- Validación MCP de componentes

---

## 7. Boy Scout Rule - Leave It Better
Cada vez que se modifica un archivo, el agente debe dejarlo en un estado mejor que cuando lo encontró:

### 7.1. Mejoras Permitidas
- Mejorar legibilidad del código sin cambiar funcionalidad
- Optimizar estructura y organización
- Actualizar comentarios obsoletos
- Corregir errores de formato o estilo
- Mejorar nombres de variables o funciones
- Actualizar stories de Storybook para mantener consistencia
- Validar componentes con MCP tools

### 7.2. Mejoras de Documentación
Si la documentación o especificación relacionada está desactualizada o no existe:
- Revisar y actualizar specs relacionadas
- Mejorar documentación técnica
- Agregar ejemplos o aclaraciones
- Mantener sincronización código-documentación
- Actualizar stories de Storybook
- Validar con MCP tools

### 7.3. Restricciones Importantes
- **Sin introducir bugs**: Los cambios no deben afectar la funcionalidad existente
- **Consentimiento del usuario**: Obtener aprobación antes de mejoras significativas
- **Alcance razonable**: Las mejoras deben ser proporcionales al cambio original
- **Storybook consistente**: Siempre mantener stories actualizadas
- **MCP validado**: Siempre verificar componentes con MCP

---

## 8. Definición de Roles
- **Agente**: Ejecutor del flujo de trabajo
- **Usuario**: Aprobador y validador final
- **Sistema**: Validación automática mediante tests
- **Storybook**: Validación visual de componentes
- **MCP**: Acceso a documentación y validación

---

## 9. Flujo de Definición de Nuevas Especificaciones
*(se activa cuando el usuario solicita una nueva feature o cambio significativo)*

### 9.1. Inicio del Proceso
El usuario inicia describiendo un cambio o nueva feature que desea implementar.

### 9.2. Análisis de Regresión
El agente debe:
- Revisar todas las especificaciones existentes en `/specs`
- Analizar si el cambio propuesto tiene riesgo de regresión
- Identificar posibles conflictos con especificaciones actuales
- Verificar impacto en stories de Storybook existentes
- **Usar MCP** para validar componentes UI afectados

#### 9.2.1. Detección de Riesgo
Si se detecta riesgo de regresión o conflicto:
- Notificar al usuario sobre los riesgos identificados
- Explicar el impacto potencial en el sistema existente
- Explicar el impacto en stories de Storybook
- **Explicar impacto en componentes MCP**
- Proponer un camino viable alternativo o mitigaciones
- Esperar aprobación del usuario para continuar

#### 9.2.2. Sin Riesgo Detectado
Si no hay regresión o conflicto:
- Continuar con el interrogatorio del usuario (punto 9.3)

### 9.3. Interrogatorio Estructurado
El agente debe realizar preguntas numeradas con opciones recomendadas para eliminar ambigüedades:

#### 9.3.1. Formato de Preguntas
```
1. [Pregunta clara sobre aspecto específico]
   a) [Opción recomendada 1]
   b) [Opción recomendada 2] 
   c) [Opción alternativa]
   d) [Otra especificación]

2. [Pregunta sobre otro aspecto]
   a) [Opción recomendada 1]
   b) [Opción recomendada 2]
   c) [Definición personalizada]
```

#### 9.3.2. Áreas Típicas de Interrogatorio
- **Alcance funcional**: Qué comportamientos específicos se esperan
- **Casos límite**: Cómo manejar edge cases y errores
- **Integración**: Interacción con componentes existentes
- **Performance**: Requisitos de rendimiento
- **Seguridad**: Consideraciones de acceso y datos
- **UI/UX**: Aspectos de interfaz si aplica
- **Datos**: Estructura y persistencia de información
- **Testing**: Estrategia de validación requerida
- **Storybook**: Requisitos de documentación visual
- **MCP**: Validación de componentes UI

### 9.4. Presentación del Borrador
Una vez completado el interrogatorio:
- **OBLIGATORIO**: Mostrar siempre el borrador completo para revisión del usuario
- **PROHIBIDO**: Crear archivos de especificación sin aprobación explícita
- **FLUJO**: Presentar borrador → Esperar aprobación explícita → Recién entonces crear archivo
- Generar un borrador completo de la especificación
- Incluir todas las decisiones tomadas durante el interrogatorio
- Estructurar según el formato estándar de especificaciones del proyecto
- **ESPERAR SIEMPRE** aprobación explícita del usuario antes de crear cualquier archivo

### 9.5. Aprobación Explícita
El usuario debe aprobar explícitamente el borrador:
- **Aprobación**: "Acepto el borrador" o similar explícito
- **Modificaciones**: Solicitar cambios específicos al borrador
- **Rechazo**: Volver al interrogatorio o iniciar de nuevo

### 9.6. Transición al Flujo de Implementación
Solo después de la aprobación explícita del borrador:
- Iniciar el flujo descrito en el punto 1 (Revisión de Especificaciones)
- Continuar con los puntos 2.1 en adelante según corresponda
- Mantener la nueva especificación como fuente de verdad para el desarrollo
- Crear o actualizar stories de Storybook
- **Validar componentes con MCP**

### 9.7. Registro y Trazabilidad
- Documentar el proceso de definición en la especificación final
- Incluir fecha de creación, versiones y decisiones clave
- Mantener enlace al borrador original si aplica
- Documentar cambios en stories de Storybook
- **Documentar validaciones MCP**

---

## 10. Manejo Seguro de Variables de Entorno (Non-Interactive)

### 10.1. Principios de Seguridad
- **NUNCA** hardcodear credenciales en código
- **SIEMPRE** usar variables de entorno
- **NUNCA** commitear archivos .env con datos reales
- **SIEMPRE** validar que .gitignore proteja archivos sensibles

### 10.2. Método No-Interactivo Seguro para Vercel

#### 10.2.1. Flujo Recomendado
```bash
# 1. Verificar estado actual
vercel env ls
curl https://rpm-wheat.vercel.app/api/health/db

# 2. Obtener credenciales de forma segura (fuente externa)
# Opción A: Desde Vercel Dashboard manualmente
# Opción B: Desde variable de entorno local temporal
# Opción C: Desde gestor de secretos (1Password, AWS Secrets Manager, etc.)

# 3. Configurar variable temporalmente
export POSTGRES_URL="postgres://user:password@host:port/db?sslmode=require"

# 4. Ejecutar script seguro (lee de variable de entorno)
./scripts/setup-db-env.sh

# 5. Limpiar variable temporal
unset POSTGRES_URL

# 6. Validar configuración
vercel env ls
pnpm run deploy
curl https://rpm-wheat.vercel.app/api/health/db
```

#### 10.2.2. Script de Configuración Segura
```bash
#!/bin/bash
# scripts/setup-db-env.sh - EJEMPLO SEGURO

# SECURITY: Never hardcode credentials in scripts
# Always read from environment variables

# Validate required environment variable
if [ -z "$POSTGRES_URL" ]; then
  echo "❌ Error: POSTGRES_URL environment variable is required"
  echo "💡 Set it with: export POSTGRES_URL='postgres://user:password@host:port/db'"
  exit 1
fi

# Use environment variable (NEVER hardcode)
echo "$POSTGRES_URL" > /tmp/postgres_url.txt

# Configure in Vercel
vercel env add POSTGRES_URL production < /tmp/postgres_url.txt

# Clean up
rm -f /tmp/postgres_url.txt
unset POSTGRES_URL
```

#### 10.2.3. Validación de Seguridad
```bash
# Verificar que no hay credenciales hardcodeadas
grep -r "postgres://.*:.*@" . --exclude-dir=.git --exclude-dir=node_modules || echo "✅ No hardcoded credentials"

# Verificar .gitignore
grep -E "\.env" .gitignore

# Verificar variables en Vercel
vercel env ls

# Verificar MCP endpoint
curl http://localhost:6006/mcp

# Verificar Storybook corriendo (solicitar al usuario si no está activo)
curl http://localhost:6006 || echo "Por favor, inicia Storybook con: pnpm storybook"
```

### 10.3. Fuentes de Credenciales Seguras

#### 10.3.1. Vercel Dashboard (Recomendado)
```bash
# 1. Abrir dashboard
vercel open

# 2. Navegar: Storage → Postgres → rpm-db → Connect
# 3. Vercel crea automáticamente las variables
# 4. Verificar con: vercel env ls
```

#### 10.3.2. Variable de Entorno Temporal
```bash
# Setear temporalmente (nunca en scripts)
export POSTGRES_URL="postgres://user:password@host:port/db?sslmode=require"

# Usar inmediatamente
./scripts/setup-db-env.sh

# Limpiar inmediatamente
unset POSTGRES_URL
```

#### 10.3.3. Gestor de Secretos
```bash
# Ejemplo con 1Password CLI
op read "op://Database/Production/postgres-url" > /tmp/db_url.txt
export POSTGRES_URL=$(cat /tmp/db_url.txt)
./scripts/setup-db-env.sh
rm -f /tmp/db_url.txt
unset POSTGRES_URL
```

### 10.4. Comandos de Validación Obligatorios

#### 10.4.1. Antes de Deploy
```bash
# Verificar seguridad
grep -r "postgres://.*:.*@" . --exclude-dir=.git --exclude-dir=node_modules || echo "✅ Security check passed"

# Verificar variables
vercel env ls

# Verificar health check local
curl http://localhost:3000/api/health/db

# Verificar Storybook (solicitar al usuario si no está activo)
curl http://localhost:6006 || echo "Por favor, inicia Storybook con: pnpm storybook"

# Verificar MCP
curl http://localhost:6006/mcp
```

#### 10.4.2. Después de Deploy
```bash
# Verificar producción
curl https://rpm-wheat.vercel.app/api/health/db

# Verificar variables de producción
curl https://rpm-wheat.vercel.app/api/debug/env

# Verificar Storybook en producción
curl https://storybook-url.example.com

# Verificar MCP en producción
curl https://storybook-url.example.com/mcp
```

### 10.5. Prohibiciones Estrictas

#### 10.5.1. NUNCA Hacer
```bash
# ❌ NUNCA hardcodear credenciales
echo "postgres://real_user:real_pass@host:port/db" > script.sh

# ❌ NUNCA commitear .env con datos reales
git add .env.production  # PROHIBIDO

# ❌ NUNCA poner credenciales en código
const dbUrl = "postgres://user:password@host:port/db"  # PROHIBIDO

# ❌ NUNCA dejar Storybook desactualizado
git commit -m "update component"  # SIN actualizar story  # PROHIBIDO

# ❌ NUNCA usar componentes sin MCP
componentProps.shadow = true;  # SIN verificar con MCP  # PROHIBIDO
```

#### 10.5.2. SIEMPRE Hacer
```bash
# ✅ SIEMPRE usar variables de entorno
export POSTGRES_URL="postgres://user:password@host:port/db"

# ✅ SIEMPRE limpiar después de usar
unset POSTGRES_URL

# ✅ SIEMPRE validar .gitignore
echo ".env.production" >> .gitignore

# ✅ SIEMPRE verificar seguridad
grep -r "postgres://.*:.*@" . --exclude-dir=.git || echo "✅ Secure"

# ✅ SIEMPRE verificar Storybook corriendo (solicitar al usuario si no está activo)
curl http://localhost:6006 || echo "Por favor, inicia Storybook con: pnpm storybook"

# ✅ SIEMPRE usar MCP para componentes
const docs = await get-documentation({ component: 'Button' });
```

### 10.6. Flujo de Emergencia (Si se exponen credenciales)

#### 10.6.1. Acciones Inmediatas
```bash
# 1. Revocar credenciales expuestas
vercel open  # → Storage → Postgres → rpm-db → Reset credentials

# 2. Eliminar archivos con credenciales
rm .env.production
git add .gitignore
git commit -m "security: Add .env.production to .gitignore"

# 3. Limpiar historial (si necesario)
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch script_with_credentials.sh' --prune-empty --tag-name-filter cat -- --all

# 4. Forzar push
git push origin main --force-with-lease
```

#### 10.6.2. Verificación Post-Emergencia
```bash
# Verificar que no queden credenciales
grep -r "postgres://.*:.*@" . --exclude-dir=.git --exclude-dir=node_modules

# Verificar health check con nuevas credenciales
curl https://rpm-wheat.vercel.app/api/health/db

# Verificar que variables estén actualizadas
vercel env ls

# Verificar Storybook funcionando (solicitar al usuario si no está activo)
curl http://localhost:6006 || echo "Por favor, inicia Storybook con: pnpm storybook"

# Verificar MCP funcionando
curl http://localhost:6006/mcp
```

---

# 📋 Specification File Rules - Semáforo de Implementación

## REGLA FUNDAMENTAL: Toda SPEC debe incluir semáforo

**OBLIGATORIO**: Cada archivo en `/specs/` debe incluir un semáforo en la primera línea que indique el estado de implementación.

### 🚦 Convención de Semáforos

```markdown
🟢 = Completamente implementado (100%)
🟡 = Parcialmente implementado (en progreso)
🔴 = No iniciado (0%)
```

### 📍 Ubicación y Formato

**SIEMPRE** en la primera línea del archivo, antes del título:

```markdown
# 🟢 System Specification

## Overview
...
```

### ✅ Checklist de Implementación

Al crear o modificar una spec, verificar:
- [ ] Semáforo en primera línea
- [ ] Indica estado correcto (🟢🟡🔴)
- [ ] Estado actualizado si hay cambios
- [ ] Título H1 después del semáforo

### 📝 Ejemplos

**Spec completamente implementada:**
```markdown
# 🟢 Components Architecture

## Overview
Sistema de componentes modular...
```

**Spec en progreso:**
```markdown
# 🟡 Real-time Architecture

## Overview
Sistema de actualizaciones en tiempo real...
```

**Spec no iniciada:**
```markdown
# 🔴 Advanced Analytics

## Overview
Sistema de análisis de datos...
```

### ⚠️ Consecuencias

Specs sin semáforo serán rechazadas en PR review.

---

# 🚀 Metodología de Ejecución del Roadmap

**Trigger**: Usuario dice *"continuemos con la implementacion del roadmap"*

## Fase 1: Análisis + División Inteligente (Autónoma)

```yaml
1. Git Check:
   - Verificar: git branch --show-current
   - Si !main → git checkout main && git pull origin main

2. Scope Analysis:
   - Leer roadmap: identificar siguiente [ ] pendiente
   - Análisis de complejidad:
     ├── Archivos/modules a modificar (objetivo: ≤5)
     ├── Riesgos técnicos (qué puede fallar)
     ├── Complejidad de validación (happy path + edge cases)
     └── Tiempo estimado (objetivo: 10-30 min)
   
3. Si scope amplio → División automática (rol Product Lead):
   - Fraccionar en pasos de ≤5 archivos
   - Cada paso: testeable y validable aisladamente
   - Actualizar roadmap con sub-tareas
   - Presentar división al usuario antes de proceder
```

## Fase 2: Propuesta Técnica (Resumen Conciso)

Formato (1-2 minutos de lectura):
```yaml
├── 🎯 Paso: [Nombre conciso]
├── 📋 Archivos: [lista de X archivos/modules a tocar]
├── ⚠️ Riesgos: [qué puede fallar y cómo lo mitigo]
├── 🏗️ Cambios clave: [2-3 líneas por archivo]
└── ⏱️ Tiempo estimado: [X minutos]

Esperar explícitamente: "ok" | "procede" | "adelante"
```

## Fase 3: Implementación (Autónoma)

- Ejecuto sin interrupciones
- Commits atómicos descriptivos
- Tests con cobertura ≥80% (incluidos en el cambio)

## Fase 4: Modo QA (Automático + Exhaustivo)

**Herramientas disponibles**:
- **DB**: `.env.local` (DATABASE_URL) para queries antes/después
- **E2E**: Puppeteer MCP para validación UI completa

```yaml
Validación Rápida pero Completa:

□ Tests: npm test (≥80% cobertura)
□ Type check: npx tsc --noEmit
□ DB (queries antes/después con evidencia):
   - Query registros pre-acción
   - Ejecutar operación
   - Query registros post-acción
   - Verificar integridad referencial
□ UI/E2E (Puppeteer):
   - Screenshot estado inicial
   - Ejecutar flujo completo
   - Screenshot estados intermedios
   - Screenshot estado final
   - Validar responsive (mobile/desktop)
   - Verificar consola: 0 errores/warnings
□ Edge cases identificados en análisis

Evidencia mínima requerida:
├── 📸 3-5 screenshots clave
├── 🗃️ 2 queries DB (before/after)
├── ✅ Cobertura tests: X%
└── 📝 Consola: errores=0
```

**Resultado QA**:
- ✅ **PASS**: Informe con evidencia → Listo para siguiente
- ❌ **FAIL**: Fixes inmediatos → Re-ejecución QA

## Principios

1. **Autonomía**: Yo ejecuto, tú solo das "ok" inicial
2. **Velocidad**: Pasos de minutos, no días
3. **Contención**: ≤5 archivos, riesgos analizados previamente
4. **Evidencia**: QA meticuloso con capturas y logs
5. **División inteligente**: Si el scope es amplio, actúo como Product Lead y propongo división

---
