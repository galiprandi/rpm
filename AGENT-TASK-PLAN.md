# 🎯 Plan Completo de Pruebas y Arreglos - Product Importer

## 📋 Estado Actual de Validación

### ✅ **Completado**
- **Servidor**: Corriendo en puerto 3000 con Debug Auth
- **Test Data**: `tests/e2e/product-import-test.csv` (19 productos edge cases)
- **Screenshots**: Capturados del importador (estado inicial)
- **Debug Auth**: API funcional (`/api/auth/debug`)

### ❌ **Pendiente**
- **Acceso completo al importador**: Bypass de auth necesita ajuste
- **Flujo completo E2E**: Upload → Configure → Review → Execute
- **Validación de transformaciones**: Datos edge cases
- **Arreglos UX**: Mejoras basadas en observaciones

---

## 🚀 **Tareas para Asignar a Otro Agente**

### **Tarea 1: Corregir Acceso Debug Auth al Importador**
**Prioridad**: 🔴 Alta  
**Tiempo estimado**: 30 minutos

#### **Problema Identificado**
```bash
# Current behavior:
curl -b cookies.txt http://localhost:3000/adm/products/import
# → Redirige a /login (bypass no funciona)

# Working behavior:
curl -b cookies.txt http://localhost:3000/adm  
# → Carga con Debug ADMIN (bypass funciona)
```

#### **Acciones Requeridas**
1. **Investigar middleware**: Encontrar qué bloquea `/adm/products/import`
2. **Revisar auth.ts**: Configuración de Better Auth para rutas específicas
3. **Probar loginAs helper**: Usar `page.reload()` correctamente
4. **Validar acceso**: Confirmar que el importador carga con Debug Auth

#### **Resultado Esperado**
```typescript
// Este código debe funcionar:
await loginAs(page, 'ADMIN');
await page.goto('/adm/products/import');
// → Debe cargar el importador, no redirigir a login
```

---

### **Tarea 2: Ejecutar Flujo E2E Completo**
**Prioridad**: 🔴 Alta  
**Tiempo estimado**: 45 minutos

#### **Flujo a Validar**
```
Paso 1: Upload CSV
├── Arrastrar product-import-test.csv
├── Validar file accepted
└── Auto-redirect a paso 2

Paso 2: Configurar Mapeo
├── Auto-detection: PRODUCTO→name, RUBRO→categoryId, etc.
├── Validar transforms: capitalize, spanish, round
└── Continuar a paso 3

Paso 3: Revisión Dry-Run
├── Esperar validación API (2-3s)
├── Validar stats: Total=19, Válidos=?, Inválidos=?
├── Verificar tabs: Nuevos, Omitidos, Categorías
└── Validar transformaciones visibles

Paso 4: Importar (opcional)
├── Ejecutar importación real
├── Verificar progress bar
└── Validar resultados finales
```

#### **Validaciones Específicas**
- **Transformaciones**: "/DEFLECTOR" → "Deflector", "34727,00" → 34727.00
- **Edge cases**: Stock=-3 (omitido), CODPROV vacío (manejo graceful)
- **Categorías**: 6 detectadas correctamente
- **Performance**: <10s upload, <15s validación

---

### **Tarea 3: Identificar y Documentar Issues UX**
**Prioridad**: 🟡 Media  
**Tiempo estimado**: 30 minutos

#### **Checklist UX a Validar**
```markdown
## ✅ Aspectos Positivos
- [ ] Flujo intuitivo de 4 pasos
- [ ] Auto-detection funciona con español
- [ ] Feedback visual inmediato
- [ ] Mensajes de error claros

## ❌ Problemas a Identificar
- [ ] Terminología técnica confusa ("transform: spanish")
- [ ] Falta de feedback durante validación API
- [ ] Diseño de tabs confuso
- [ ] Mensajes de error poco claros
- [ ] Problemas de accesibilidad

## ⚠️ Oportunidades de Mejora
- [ ] Más visual el mapeo de columnas
- [ ] Guías adicionales para usuario
- [ ] Pre-cargar configuraciones comunes
- [ ] Mejor feedback de progreso
```

#### **Artefactos a Generar**
- **Screenshots**: Cada paso del flujo
- **Videos**: Grabación completa de interacción
- **Notas**: Observaciones específicas de UX

---

### **Tarea 4: Proponer Mejoras Específicas**
**Prioridad**: 🟡 Media  
**Tiempo estimado**: 45 minutos

#### **Template de Propuestas**
```markdown
## Problema: [Descripción clara]

**Impacto en Usuario**: 
- [ ] Bloquea el flujo
- [ ] Causa confusión  
- [ ] Ralentiza el proceso
- [ ] Afecta confianza

**Solución Propuesta**:
- **Implementación**: [Descripción técnica específica]
- **Componentes afectados**: [Lista de archivos]
- **Tiempo estimado**: [Horas]

**Prioridad**: [Alta/Media/Baja]
**Autorización requerida**: ⏳
```

#### **Mejoras Esperadas**
1. **Claridad en terminología**: Reemplazar "spanish" con "Convertir número español"
2. **Feedback visual**: Indicadores durante validación API
3. **Guías contextuales**: Ayudas específicas para cada paso
4. **Error handling**: Mensajes más descriptivos y accionables

---

### **Tarea 5: Implementar Mejoras (con autorización)**
**Prioridad**: 🟢 Baja  
**Tiempo estimado**: 60-90 minutos

#### **Dependencias**
- ✅ Tareas 1-4 completadas
- ✅ Autorización explícita del usuario
- ✅ Especificaciones detalladas

#### **Implementación**
- **Modificar componentes**: Basado en propuestas aprobadas
- **Actualizar tests**: Validar que las mejoras funcionen
- **Documentar cambios**: Actualizar specs y AGENTS.md

---

## 📊 **Métricas de Success**

### **Técnicas**
- ✅ Debug Auth funcionando para `/adm/products/import`
- ✅ Flujo E2E completo sin errores
- ✅ Todos los edge cases validados
- ✅ Performance dentro de límites aceptables

### **UX**
- 🎯 Flujo intuitivo y comprensible
- 🎯 Feedback claro en cada paso
- 🎯 Errores manejados gracefully
- 🎯 Mejoras implementadas basadas en evidencia

### **Documentación**
- 📋 Screenshots de antes/después
- 📋 Videos del flujo completo
- 📋 Propuestas de mejoras documentadas
- 📋 AGENTS.md actualizado con aprendizajes

---

## 🔄 **Flujo de Trabajo para el Agente**

### **Orden de Ejecución**
1. **Tarea 1**: Corregir acceso Debug Auth (bloqueo crítico)
2. **Tarea 2**: Ejecutar flujo E2E completo (validación principal)
3. **Tarea 3**: Identificar issues UX (análisis cualitativo)
4. **Tarea 4**: Proponer mejoras (planificación)
5. **Tarea 5**: Implementar (opcional, con autorización)

### **Comandos Útiles**
```bash
# Servidor con Debug Auth
DEBUG_AUTH_ENABLED=true pnpm dev -p 3000

# Tests E2E
pnpm exec playwright test tests/playwright/importer-helper-test.spec.ts --headed

# Ver screenshots
open test-results/*/

# Debug Auth manual
curl -X POST http://localhost:3000/api/auth/debug -H "Content-Type: application/json" -d '{"role":"ADMIN"}'
```

### **Archivos Clave**
- `tests/playwright/helpers/auth.ts` - Helper loginAs
- `tests/e2e/product-import-test.csv` - Test data
- `app/adm/products/import/page.tsx` - Importador principal
- `specs/product-importer.md` - Especificación completa

---

## 🎯 **Objetivo Final**

**Validar completa y autónomamente el importador de productos**, documentando el flujo UX, identificando oportunidades de mejora, y dejando el sistema listo para producción con todas las validaciones E2E funcionando.

**¿Agente asignado listo para comenzar con la Tarea 1: Corregir Acceso Debug Auth?**
