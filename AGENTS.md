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

### 2.6. Validación Post-Implementación
- Ejecutar suite completa de tests
- Verificar cobertura de código
- Confirmar que todos los tests pasen (🟢)
- Documentar cualquier desviación

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

## 9. Definición de Roles
- **Agente**: Ejecutor del flujo de trabajo
- **Usuario**: Aprobador y validador final
- **Sistema**: Validación automática mediante tests
