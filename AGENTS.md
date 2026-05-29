<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🌐 Política de Idioma

**Este proyecto permite español en:**
- `AGENTS.md` - Reglas para agentes
- `specs/*.md` - Especificaciones del sistema

**Código fuente en INGLÉS:**
- Variables, funciones, comentarios, JSDoc
- Tests, commits, docs técnicas

**Excepción:** Mensajes de error de negocio pueden estar en español.

---

# ⚠️ Prisma v6 (NO v7)

**Este proyecto usa Prisma v6.19.3** - NO actualizar a v7 (incompatible con Next.js 16 por módulos nativos).

**Configuración:**
```typescript
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

**Sharp:** Importación dinámica con fallback (módulo nativo no bundlable por Next.js).

---

# ⚠️ REGLA CRÍTICA: Validar Cambios - Prohibido Asumir

**NUNCA asumir que un cambio funciona sin validarlo explícitamente.**

**Herramientas de validación:**
- **API Backend**: `curl`
- **UI/Frontend**: Playwright MCP / Puppeteer MCP
- **Base de Datos**: `psql` o queries directas
- **Auth/Session**: Verificar cookies/tokens

**Flujo:** Hacer cambio → VALIDAR → Confirmar → Responder

**❌ PROHIBIDO:** "Debería funcionar", "Probablemente funcione", asumir sin verificar

**✅ OBLIGATORIO:** Validar con herramientas concretas antes de responder

---

# Flujo de Trabajo Basado en Especificaciones
*(solo aplica si existe el directorio /specs)*

**Antes de CUALQUIER tarea:**
1. Leer especificaciones relacionadas en `/specs`
2. Revisar `/specs/SYSTEM_SPEC.md`

**Para cambios de lógica:**
1. Solicitar autorización del usuario (explicar cambios, riesgos, regresiones)
2. Ejecutar tests relacionados antes de implementar
3. Actualizar especificaciones
4. Actualizar tests para nuevos requisitos (TDD: 🔴 → 🟢)
5. Implementar cambio
6. Validación proactiva durante implementación
7. Validación post-implementación (suite completa, cobertura)

**Orden estricto**: Implementación nunca ocurre antes de autorización, actualización de specs y validación.

**Estándares de tests:**
- Ubicación: Misma carpeta del servicio
- Nomenclatura: `xx.test.ts`
- JSDoc obligatorio al inicio con specs relacionadas, alcance y métricas

**Herramientas**: Vitest (frontend/backend)

---

# ⚠️ REGLA CRÍTICA: Cache y Revalidation Selectiva en Next.js

**NUNCA remover completamente el cache de páginas que hacen queries complejas a la base de datos.**

**Estrategia correcta:** Cache con `revalidate: 60` + invalidación selectiva con `revalidatePath('/adm')` cuando ocurren cambios relevantes.

**Lugares donde agregar revalidation:**
- `creditNoteService.ts` - Después de createCreditNote/cancelCreditNote
- `directSaleService.ts` - Después de createDirectSale
- `app/api/cash-movements/route.ts` - Después de POST
- `workOrderService.ts` - Después de crear OT
- `productService.ts` - Si afecta dashboard

**❌ PROHIBIDO:** Remover cache completamente o usar cache muy largo sin revalidation

**✅ OBLIGATORIO:** Mantener cache + revalidation selectiva

---

# Tips para Validación E2E con Playwright MCP

**Debugging de stock movements:**
- Crear endpoints de debug temporales
- Validar con curl antes/después
- Logs estratégicos en servicios
- Validar UI con snapshots

**Errores comunes:**
- Stock no se actualiza: Verificar productId en items
- Dashboard no muestra cambios: Verificar cache y revalidation

---

# Mantenimiento Activo de Documentación

- Revisar y mantener documentación existente
- Sincronizar código con documentación
- Reflejar cambios en specs y MCP

---

# Boy Scout Rule - Leave It Better

Cada modificación debe dejar el archivo en mejor estado:
- Mejorar legibilidad sin cambiar funcionalidad
- Actualizar comentarios obsoletos
- Mejorar nombres de variables
- Validar con MCP tools

**Restricciones:** Sin bugs, consentimiento del usuario, alcance razonable

## UI/UX Specific Rules (Croma/Carol)
- **Primary CTA**: El botón principal de creación debe estar en el `Header` de la página, no duplicado en el componente de tabla si ya existe en el header.
- **Header Stats**: Las estadísticas de alto nivel en una vista de listado o detalle deben integrarse en el `Header` usando `CrudStats` para maximizar el espacio vertical y mantener consistencia. El `CrudAdmin` debe configurarse con `hideCreateAction={true}` si el botón de creación ya está en el Header.
- **Semantic Colors**: Usar colores de Tailwind (ej: `text-orange-500`) en lugar de hexadecimales hardcodeados para iconos de estado.
- **Interaction Feedback**: Los contenedores interactivos (drag & drop, upload) deben tener estados de `hover` visibles (`bg-primary/5`) y transiciones suaves.

---

# Definición de Roles

- **Agente (Carol/Croma)**: Diseñador/Ingeniero UI/UX enfocado en consistencia, accesibilidad y refinamiento estético.
- **Usuario**: Aprobador y validador final
- **Sistema**: Validación automática mediante tests

---

# Flujo de Definición de Nuevas Especificaciones

**Activación:** Usuario solicita nueva feature o cambio significativo

**Proceso:**
1. Análisis de regresión (revisar specs)
2. Interrogatorio estructurado con opciones recomendadas
3. Presentar borrador completo para revisión
4. Esperar aprobación explícita del usuario
5. Transicionar a flujo de implementación
6. Documentar proceso y trazabilidad

**Áreas de interrogatorio:** Alcance funcional, casos límite, integración, performance, seguridad, UI/UX, datos, testing

---

# Manejo Seguro de Variables de Entorno

**Principios de seguridad:**
- NUNCA hardcodear credenciales
- SIEMPRE usar variables de entorno
- NUNCA commitear .env con datos reales
- SIEMPRE validar .gitignore

**Fuentes seguras:** Vercel Dashboard, variable temporal, gestor de secretos

**Validación obligatoria:** Verificar no hay credenciales hardcodeadas, verificar variables, health checks

**Flujo de emergencia:** Revocar credenciales, eliminar archivos, limpiar historial, forzar push

---

# 📋 Specification File Rules - Semáforo de Implementación

**OBLIGATORIO**: Cada archivo en `/specs/` debe incluir un semáforo en la primera línea.

**🚦 Convención:**
- 🟢 = Completamente implementado (100%)
- 🟡 = Parcialmente implementado (en progreso)
- 🔴 = No iniciado (0%)

**Ubicación:** Primera línea del archivo, antes del título

**Consecuencias:** Specs sin semáforo serán rechazadas en PR review.

---

# 🚀 Metodología de Ejecución del Roadmap

**Trigger:** Usuario dice *"continuemos con la implementacion del roadmap"*

**Fase 1: Análisis + División Inteligente**
- Git check: Verificar branch, si !main → checkout main + pull
- Scope analysis: Identificar siguiente [ ] pendiente, analizar complejidad (objetivo ≤5 archivos, 10-30 min)
- Si scope amplio → División automática en pasos de ≤5 archivos, presentar división al usuario

**Fase 2: Propuesta Técnica**
- Formato conciso: Paso, Archivos, Riesgos, Cambios clave, Tiempo estimado
- Esperar aprobación explícita: "ok" | "procede" | "adelante"

**Fase 3: Implementación**
- Crear feature branch
- Implementar cambios con commits atómicos
- Tests con cobertura ≥80%
- Verificar: npm test, npx tsc --noEmit
- Merge a main y push

**Fase 4: Modo QA**
- Tests: npm test (≥80% cobertura)
- Type check: npx tsc --noEmit
- DB: Queries antes/después con evidencia
- UI/E2E: Screenshots, flujo completo, responsive, consola 0 errores
- Evidencia mínima: 3-5 screenshots, 2 queries DB, cobertura tests, consola limpia

**Principios:** Autonomía, velocidad, contención ≤5 archivos, evidencia meticulosa, división inteligente

---

# 🏗️ Arquitectura de Servicios

**REGLA FUNDAMENTAL:** Servicios como funciones puras reutilizables en `lib/services/`, diseñadas para API y Agent Tools.

**❌ PROHIBIDO:** Lógica de negocio directamente en API routes o controllers

**✅ OBLIGATORIO:**
- Funciones puras con params y output tipados
- Servicios en `lib/services/`
- Sin acoplamiento a HTTP (Request/Response)
- Sin estado (stateless)
- Documentación JSDoc
- Sin duplicación de lógica

**Estructura:**
```
lib/
├── services/        # Funciones puras reutilizables
├── agent-tools/     # Tools para LLM que reutilizan servicios
└── api/controllers/ # Usan los mismos servicios
```

---

# 📚 Especificaciones del Sistema

**Flujo obligatorio antes de CUALQUIER modificación:**
1. Identificar tipo de cambio
2. Consultar tabla para encontrar spec relevante
3. LEER spec completa ANTES de escribir código
4. Seguir reglas documentadas
5. Actualizar spec si introduces nuevos patrones

**🚨 PROHIBIDO implementar sin leer specs**

**✅ OBLIGATORIO:** Identificar → Consultar tabla → Leer spec → Implementar → Actualizar spec

---

# 🧩 Arquitectura de Componentes

**Principio:** Separación para testabilidad

**❌ PROHIBIDO:** Componentes inline en páginas (no testeable unitariamente)

**✅ OBLIGATORIO:** Componentes separados en `components/[feature]/`

**Reglas de organización:**
- UI Components: `components/ui/*.tsx` → Unit tests
- Feature Components: `components/[feature]/*.tsx` → Unit + Integration
- Page Components: `app/**/page.tsx` → Integration/E2E
- Layout Components: `components/layout/*.tsx` → Visual regression

**Criterios para extraer:** Testabilidad, >20 líneas JSX, reutilización, responsabilidad única

**Límites de complejidad:**
- Page: ≤150 líneas, ≤5 props, ≤3 hooks
- Feature: ≤300 líneas, ≤15 props, ≤8 hooks

**Documentación:** Decisiones de diseño UI en specs correspondientes (adm.md, public.md, ui-architecture.md)

---

# Debug Mode

**Permite validar UI sin autenticación para QA automatizado.**

**Activación:** Variable de entorno `DEBUG_AUTH="true"` en `.env.local` (NUNCA query parameters)

**Implementación:** `proxy.ts` - bypass auth cuando `process.env.DEBUG_AUTH === 'true'`

**⚠️ Seguridad:** Solo local/desarrollo, NUNCA en producción

**Flujo QA:**
1. `DEBUG_AUTH="true" pnpm dev`
2. Validar con Puppeteer MCP
3. Desactivar: `unset DEBUG_AUTH`

---
