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

---

## 11. Manejo Seguro de Variables de Entorno (Non-Interactive)

### 11.1. Principios de Seguridad
- **NUNCA** hardcodear credenciales en código
- **SIEMPRE** usar variables de entorno
- **NUNCA** commitear archivos .env con datos reales
- **SIEMPRE** validar que .gitignore proteja archivos sensibles

### 11.2. Método No-Interactivo Seguro para Vercel

#### 11.2.1. Flujo Recomendado
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

#### 11.2.2. Script de Configuración Segura
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

#### 11.2.3. Validación de Seguridad
```bash
# Verificar que no hay credenciales hardcodeadas
grep -r "postgres://.*:.*@" . --exclude-dir=.git --exclude-dir=node_modules || echo "✅ No hardcoded credentials"

# Verificar .gitignore
grep -E "\.env" .gitignore

# Verificar variables en Vercel
vercel env ls
```

### 11.3. Fuentes de Credenciales Seguras

#### 11.3.1. Vercel Dashboard (Recomendado)
```bash
# 1. Abrir dashboard
vercel open

# 2. Navegar: Storage → Postgres → rpm-db → Connect
# 3. Vercel crea automáticamente las variables
# 4. Verificar con: vercel env ls
```

#### 11.3.2. Variable de Entorno Temporal
```bash
# Setear temporalmente (nunca en scripts)
export POSTGRES_URL="postgres://user:password@host:port/db?sslmode=require"

# Usar inmediatamente
./scripts/setup-db-env.sh

# Limpiar inmediatamente
unset POSTGRES_URL
```

#### 11.3.3. Gestor de Secretos
```bash
# Ejemplo con 1Password CLI
op read "op://Database/Production/postgres-url" > /tmp/db_url.txt
export POSTGRES_URL=$(cat /tmp/db_url.txt)
./scripts/setup-db-env.sh
rm -f /tmp/db_url.txt
unset POSTGRES_URL
```

### 11.4. Comandos de Validación Obligatorios

#### 11.4.1. Antes de Deploy
```bash
# Verificar seguridad
grep -r "postgres://.*:.*@" . --exclude-dir=.git --exclude-dir=node_modules || echo "✅ Security check passed"

# Verificar variables
vercel env ls

# Verificar health check local
curl http://localhost:3000/api/health/db
```

#### 11.4.2. Después de Deploy
```bash
# Verificar producción
curl https://rpm-wheat.vercel.app/api/health/db

# Verificar variables de producción
curl https://rpm-wheat.vercel.app/api/debug/env
```

### 11.5. Prohibiciones Estrictas

#### 11.5.1. NUNCA Hacer
```bash
# ❌ NUNCA hardcodear credenciales
echo "postgres://real_user:real_pass@host:port/db" > script.sh

# ❌ NUNCA commitear .env con datos reales
git add .env.production  # PROHIBIDO

# ❌ NUNCA poner credenciales en código
const dbUrl = "postgres://user:password@host:port/db"  # PROHIBIDO
```

#### 11.5.2. SIEMPRE Hacer
```bash
# ✅ SIEMPRE usar variables de entorno
export POSTGRES_URL="postgres://user:password@host:port/db"

# ✅ SIEMPRE limpiar después de usar
unset POSTGRES_URL

# ✅ SIEMPRE validar .gitignore
echo ".env.production" >> .gitignore

# ✅ SIEMPRE verificar seguridad
grep -r "postgres://.*:.*@" . --exclude-dir=.git || echo "✅ Secure"
```

### 11.6. Flujo de Emergencia (Si se exponen credenciales)

#### 11.6.1. Acciones Inmediatas
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

#### 11.6.2. Verificación Post-Emergencia
```bash
# Verificar que no queden credenciales
grep -r "postgres://.*:.*@" . --exclude-dir=.git --exclude-dir=node_modules

# Verificar health check con nuevas credenciales
curl https://rpm-wheat.vercel.app/api/health/db

# Verificar que variables estén actualizadas
vercel env ls
```
