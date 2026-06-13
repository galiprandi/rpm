# E2E Testing Strategy: Debug y Validación UX-Centric

## Enfoque Autónomo y Eficiente

### Problema del Enfoque Tradicional
❌ **Esperar por Playwright**: 120s timeout, webServer conflicts  
❌ **Tests lentos**: Setup/teardown overhead  
❌ **No interactivo**: No puedes ver el flujo en tiempo real  

### Nuevo Enfoque: Navegación Directa + Documentación
✅ **Navegación inmediata**: Browser MCP tools  
✅ **Captura en tiempo real**: Screenshots + observaciones  
✅ **Validación UX**: Testeo como usuario real  
✅ **Iteración rápida**: Corregir y re-probar al instante  

---

## Estrategia de Testing E2E para Validación UX

### 1. Preparación Rápida (15s)
```bash
# Servidor corriendo
RPM_DEV_BYPASS_AUTH=true pnpm dev -p 3333

# Test data listo
tests/e2e/product-import-test.csv ✅
```

### 2. Flujo de Navegación Manual con Captura

#### Paso 1: Login (30s)
- **URL**: `http://localhost:3333/login`
- **Validación**: Formulario visible, autenticación funcional
- **Captura**: Screenshot de login + observaciones UX

#### Paso 2: Acceso a Importador (30s)
- **URL**: `http://localhost:3333/adm/products/import`
- **Validación**: Título "Importar Productos", stepper visible
- **Captura**: Screenshot del estado inicial

#### Paso 3: Subida CSV (45s)
- **Acción**: Drag & drop de `product-import-test.csv`
- **Validación**: 
  - File accepted
  - Column detection: 11 columns
  - Preview: primeras 5 filas
- **Captura**: Screenshot post-upload + console logs

#### Paso 4: Configuración (60s)
- **Validación**: Auto-mapping detectado
  - PRODUCTO → name ✅
  - RUBRO → categoryId ✅  
  - STOCK → stock ✅
  - MAYORISTA → salePrice ✅
- **Captura**: Screenshot de mapeo + observaciones de UI

#### Paso 5: Revisión Dry-Run (90s)
- **Esperar**: Validación API (2-3s)
- **Validación**:
  - Stats: Total 19, Válidos ?, Inválidos ?
  - Tabs: Nuevos, Omitidos, Categorías
  - Transformaciones: precios ES→EN, nombres capitalizados
- **Captura**: Screenshots de cada tab + datos transformados

---

## Checklist de Validación UX

### ✅ Usabilidad General
- [ ] Flujo intuitivo (4 pasos claros)
- [ ] Feedback visual inmediato
- [ ] Mensajes de error claros
- [ ] Responsivo en diferentes viewports

### ✅ Paso 1: Upload
- [ ] Dropzone visible y accesible
- [ ] Drag & drop funciona
- [ ] File picker backup funciona
- [ ] Preview de datos útil
- [ ] Error handling (archivos inválidos)

### ✅ Paso 2: Configuración
- [ ] Auto-detection funciona (headers en español)
- [ ] Interface de mapeo clara
- [ ] Opciones globales comprensibles
- [ ] Validación de required fields

### ✅ Paso 3: Revisión
- [ ] Estadísticas claras y comprensibles
- [ ] Tabs funcionales e informativos
- [ ] Datos transformados visibles
- [ ] Categorías detectadas correctamente
- [ ] Opción de continuar/borrar

---

## Documentación de Hallazgos UX

### Template de Registro

```
## [Paso X] - [Nombre del Paso]

### Observaciones UX
- ✅ **Bueno**: [Aspecto positivo]
- ❌ **Problema**: [Issue encontrado]
- ⚠️ **Mejora**: [Sugerencia]

### Capturas
- `step-x-initial.png` - Estado inicial
- `step-x-interaction.png` - Durante interacción
- `step-x-result.png` - Estado final

### Recomendación de Mejora
**Problema**: [Descripción clara]
**Impacto**: [Usuario afectado, frecuencia]
**Solución**: [Implementación propuesta]
**Prioridad**: [Alta/Media/Baja]
```

---

## Implementación de Mejoras (Con Autorización)

### Flujo de Trabajo
1. **Identificar** problema UX durante navegación
2. **Documentar** con screenshots y observaciones
3. **Proponer** solución específica
4. **Esperar autorización** explícita del usuario
5. **Implementar** solo con aprobación
6. **Validar** mejora inmediatamente

### Ejemplo de Propuesta

```
## Problema: Confusión en paso de mapeo

**Observación**: Los usuarios no entienden qué significa "transform: spanish"
**Impacto**: Alto - bloquea paso 2 para usuarios no técnicos
**Solución**: Reemplazar "spanish" con "Convertir número español (1,23 → 1.23)"
**Implementación**: Actualizar labels en ColumnMapper.tsx
**Prioridad**: Alta
```

---

## Tools para Validación Eficiente

### Browser Automation (Rápido)
- Chrome DevTools MCP
- Screenshots automáticos
- Console logs capture
- Network requests monitoring

### Manual Testing (Flexibilidad)
- Navegación directa
- Testeo real de UX
- Captura inmediata de issues
- Iteración rápida

### Documentation (Persistencia)
- Screenshots con contexto
- Observaciones estructuradas
- Propuestas de mejora
- Historial de cambios

---

## Próximos Pasos

1. **Ejecutar navegación manual** con captura en tiempo real
2. **Documentar hallazgos UX** usando el template
3. **Proponer mejoras** específicas y accionables
4. **Esperar tu autorización** para cada implementación
5. **Validar cada mejora** inmediatamente

Este enfoque elimina la espera y permite iteración rápida centrada en la experiencia real del usuario.
