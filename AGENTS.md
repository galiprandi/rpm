<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Flujo de Trabajo Obligatorio Basado en Especificaciones
*(solo aplica si existe el directorio /specs)*

Este flujo de trabajo se activa solo cuando el repositorio contiene el directorio `/specs` (incluyendo `/specs/SYSTEM_SPEC.md`).

## 1. Revisión de Especificaciones Antes de Cualquier Tarea
Antes de comenzar cualquier implementación, corrección de errores, refactorización o cambio de comportamiento, el agente debe:
- Localizar y leer las especificaciones relacionadas en `/specs`
- Revisar documentos raíz relevantes como `/specs/SYSTEM_SPEC.md`

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

### Vinculación Activa
- Última actualización: [fecha]
- Estado tests: 🟢 Todos pasando
- Cobertura: 95%
```

El agente debe mantener esta sección actualizada de forma proactiva durante cada cambio.

## 3. Cumplimiento Estricto del Orden
Para cambios de lógica gobernados por especificaciones, la implementación nunca debe ocurrir antes de:
- La autorización del usuario
- La actualización de las especificaciones

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

---

## 7. Boy Scout Rule - Leave It Better
Cada vez que se modifica un archivo, el agente debe dejarlo en un estado mejor que cuando lo encontró:

### 7.1. Mejoras Permitidas
- Mejorar legibilidad del código sin cambiar funcionalidad
- Optimizar estructura y organización
- Actualizar comentarios obsoletos
- Corregir errores de formato o estilo
- Mejorar nombres de variables o funciones

### 7.2. Mejoras de Documentación
Si la documentación o especificación relacionada está desactualizada o no existe:
- Revisar y actualizar specs relacionadas
- Mejorar documentación técnica
- Agregar ejemplos o aclaraciones
- Mantener sincronización código-documentación

### 7.3. Restricciones Importantes
- **Sin introducir bugs**: Los cambios no deben afectar la funcionalidad existente
- **Consentimiento del usuario**: Obtener aprobación antes de mejoras significativas
- **Alcance razonable**: Las mejoras deben ser proporcionales al cambio original

---

## 8. Estándar de Idioma - Inglés Obligatorio
Todo el contenido técnico debe estar en inglés:

### 8.1. Código y Comentarios
- Variables, funciones, clases en inglés
- Comentarios de código en inglés
- Nombres de archivos en inglés
- Mensajes de error y logs en inglés

### 8.2. Comunicación Técnica
- Mensajes de commit en inglés
- Nombres de ramas en inglés
- Pull requests y revisiones en inglés
- Documentación técnica en inglés

### 8.3. Excepciones
- Documentación para usuarios finales (idioma del público objetivo)
- Comentarios internos del equipo cuando sea justificado

---

## 9. Definición de Roles
- **Agente**: Ejecutor del flujo de trabajo
- **Usuario**: Aprobador y validador final
- **Sistema**: Validación automática mediante tests

---

## 10. Flujo de Definición de Nuevas Especificaciones
*(se activa cuando el usuario solicita una nueva feature o cambio significativo)*

### 10.1. Inicio del Proceso
El usuario inicia describiendo un cambio o nueva feature que desea implementar.

### 10.2. Análisis de Regresión
El agente debe:
- Revisar todas las especificaciones existentes en `/specs`
- Analizar si el cambio propuesto tiene riesgo de regresión
- Identificar posibles conflictos con especificaciones actuales

#### 10.2.1. Detección de Riesgo
Si se detecta riesgo de regresión o conflicto:
- Notificar al usuario sobre los riesgos identificados
- Explicar el impacto potencial en el sistema existente
- Proponer un camino viable alternativo o mitigaciones
- Esperar aprobación del usuario para continuar

#### 10.2.2. Sin Riesgo Detectado
Si no hay regresión o conflicto:
- Continuar con el interrogatorio del usuario (punto 10.3)

### 10.3. Interrogatorio Estructurado
El agente debe realizar preguntas numeradas con opciones recomendadas para eliminar ambigüedades:

#### 10.3.1. Formato de Preguntas
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

#### 10.3.2. Áreas Típicas de Interrogatorio
- **Alcance funcional**: Qué comportamientos específicos se esperan
- **Casos límite**: Cómo manejar edge cases y errores
- **Integración**: Interacción con componentes existentes
- **Performance**: Requisitos de rendimiento
- **Seguridad**: Consideraciones de acceso y datos
- **UI/UX**: Aspectos de interfaz si aplica
- **Datos**: Estructura y persistencia de información
- **Testing**: Estrategia de validación requerida

### 10.4. Presentación del Borrador
Una vez completado el interrogatorio:
- **OBLIGATORIO**: Mostrar siempre el borrador completo para revisión del usuario
- **PROHIBIDO**: Crear archivos de especificación sin aprobación explícita
- **FLUJO**: Presentar borrador → Esperar aprobación explícita → Recién entonces crear archivo
- Generar un borrador completo de la especificación
- Incluir todas las decisiones tomadas durante el interrogatorio
- Estructurar según el formato estándar de especificaciones del proyecto
- **ESPERAR SIEMPRE** aprobación explícita del usuario antes de crear cualquier archivo

### 10.5. Aprobación Explícita
El usuario debe aprobar explícitamente el borrador:
- **Aprobación**: "Acepto el borrador" o similar explícito
- **Modificaciones**: Solicitar cambios específicos al borrador
- **Rechazo**: Volver al interrogatorio o iniciar de nuevo

### 10.6. Transición al Flujo de Implementación
Solo después de la aprobación explícita del borrador:
- Iniciar el flujo descrito en el punto 1 (Revisión de Especificaciones)
- Continuar con los puntos 2.1 en adelante según corresponda
- Mantener la nueva especificación como fuente de verdad para el desarrollo

### 10.7. Registro y Trazabilidad
- Documentar el proceso de definición en la especificación final
- Incluir fecha de creación, versiones y decisiones clave
- Mantener enlace al borrador original si aplica
