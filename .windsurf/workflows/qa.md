---
description: Workflow de QA riguroso para validar funcionalidades usando Playwright MCP
---

# Workflow de QA Riguroso

Este workflow automatiza el proceso de validación end-to-end de funcionalidades del sistema, siguiendo un proceso estructurado y riguroso.

## Invocación

```
/qa [funcionalidad a probar]
```

Ejemplos:
- `/qa comprobantes`
- `/qa dashboard`
- `/qa productos`

## Pasos del Workflow

### 1. Verificación de Precondiciones

**Objetivo:** Asegurar que el entorno de prueba está listo.

**Acciones:**
- Verificar que el servidor de desarrollo esté corriendo en el puerto 3000
- Verificar que Playwright MCP esté disponible y accesible
- Si el servidor no está corriendo, solicitar al usuario que inicie `pnpm dev`
- Si Playwright MCP no está disponible, solicitar al usuario que lo habilite

**Validación:**
- `curl http://localhost:3000` debe responder
- MCP tools de Playwright deben estar disponibles

---

### 2. Análisis de Especificaciones

**Objetivo:** Identificar todas las specs relacionadas con la funcionalidad a probar.

**Acciones:**
- Leer todas las especificaciones en `/specs/`
- Identificar specs relacionadas con la funcionalidad especificada
- Leer `SYSTEM_SPEC.md` para contexto general del sistema
- Identificar specs de componentes UI relevantes en `/specs/components/`

**Criterios de relación:**
- Specs que mencionan explícitamente la funcionalidad
- Specs de entidades relacionadas (ej: productos → categorías)
- Specs de flujos de negocio que involucren la funcionalidad
- Specs de arquitectura de componentes UI afectados

**Salida:** Lista de specs relevantes con sus paths y resumen de puntos clave.

---

### 3. Planificación de Pruebas

**Objetivo:** Crear un plan de pruebas exhaustivo que cubra todos los escenarios posibles.

**Acciones:**
- Analizar los requisitos de las specs identificadas
- Identificar flujos principales (happy paths)
- Identificar flujos alternativos y edge cases
- Identificar casos de error y validación
- Identificar casos de integración con otras entidades
- Identificar casos de seguridad y permisos

**Categorías de pruebas:**
1. **Happy Paths:** Flujos principales exitosos
2. **Edge Cases:** Valores límite, datos inusuales
3. **Error Cases:** Validaciones, mensajes de error
4. **Integration:** Interacción con otras entidades
5. **Security:** Permisos, roles, acceso
6. **Performance:** Tiempos de respuesta, carga
7. **Usability:** Experiencia de usuario, claridad

**Formato del plan:**
```
## Escenario [X]: [Nombre del escenario]
**Tipo:** [Happy Path | Edge Case | Error Case | Integration | Security | Performance | Usability]
**Spec relacionada:** [path a spec]
**Descripción:** [Descripción detallada]
**Precondiciones:** [Estado requerido del sistema]
**Pasos:**
  1. [Paso 1]
  2. [Paso 2]
  ...
**Resultado esperado:** [Qué debe ocurrir]
**Recursos necesarios:** [Productos, clientes, etc.]
```

**Salida:** Plan de pruebas completo presentado al usuario para aprobación.

---

### 4. Ejecución de Validaciones con Playwright MCP

**Objetivo:** Ejecutar el plan de pruebas usando Playwright MCP.

#### 4.1. Pruebas de Flujos Principales (Happy Paths)

**Orden de ejecución:** Primero los flujos principales y happy paths.

**Acciones:**
- Navegar a la URL de la funcionalidad
- Tomar snapshot inicial de la página
- Ejecutar cada paso del escenario
- Verificar resultados esperados
- Tomar screenshots en puntos clave
- Capturar console logs para errores

**Herramientas Playwright MCP:**
- `browser_navigate` - Navegar a URLs
- `browser_snapshot` - Capturar estado accesible
- `browser_take_screenshot` - Capturar screenshots
- `browser_click` - Interactuar con elementos
- `browser_type` - Llenar formularios
- `browser_console_messages` - Capturar logs

#### 4.2. Análisis de Usabilidad y Estética

**Objetivo:** Analizar cada vista para detectar mejoras.

**Criterios de análisis:**
- **Claridad:** ¿Es obvio qué hacer en la vista?
- **Consistencia:** ¿Sigue los patrones de diseño del sistema?
- **Feedback:** ¿Hay feedback claro de acciones?
- **Jerarquía visual:** ¿Los elementos importantes destacan?
- **Estética:** ¿Hay detalles que mejoren la apariencia sin cambios mayores?
- **Accesibilidad:** ¿Los elementos son accesibles y etiquetados?
- **Responsive:** ¿Funciona en diferentes tamaños de pantalla?

**Acciones:**
- Capturar snapshot de cada vista
- Analizar layout y espaciado
- Revisar consistencia de colores y tipografía
- Verificar alineación de elementos
- Identificar oportunidades de mejora

**Formato de reporte de usabilidad:**
```
## Análisis de Usabilidad: [Nombre de vista]
### Fortalezas
- [Fortaleza 1]
- [Fortaleza 2]

### Oportunidades de Mejora
- **[Mejora 1]:** Descripción detallada con sugerencia específica
- **[Mejora 2]:** Descripción detallada con sugerencia específica

### Detalles Estéticos
- **[Detalle 1]:** Sugerencia de mejora visual
- **[Detalle 2]:** Sugerencia de mejora visual
```

#### 4.3. Creación de Recursos vía UI

**Regla:** Los recursos necesarios para las pruebas deben crearse usando la UI.

**Recursos típicos:**
- Productos
- Clientes
- Vehículos
- Órdenes de Trabajo (OTs)
- Categorías
- Proveedores

**Acciones:**
- Navegar a la página de creación del recurso
- Llenar el formulario con datos de prueba
- Verificar que el recurso se crea exitosamente
- Capturar screenshot del recurso creado
- Guardar el ID/identificador del recurso para uso posterior

**Validación:**
- Verificar que el recurso aparece en la lista
- Verificar que los datos son correctos
- Verificar que no hay errores en consola

#### 4.4. Reutilización de Recursos vía API

**Regla:** Si un recurso ya fue validado vía UI, puede recrearse usando la API para probar otros paths.

**Condiciones:**
- El recurso ya fue creado y validado exitosamente vía UI
- Se necesita recrear el mismo recurso para probar un path diferente
- La creación del recurso vía UI ya fue probada y validada

**Acciones:**
- Usar `curl` o herramienta similar para llamar al endpoint de API
- Verificar respuesta exitosa
- Validar que el recurso se creó correctamente
- Continuar con el flujo de prueba

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Producto Test", "price": 100}'
```

---

### 5. Reporte de Resultados

**Objetivo:** Presentar un resumen detallado de las pruebas ejecutadas.

#### 5.1. Resumen de Paths Validados

**Formato:**
```
## 📊 Resumen de Validación

### Escenarios Probados: [X]/[Y]
- ✅ Happy Paths: [A]/[B]
- ✅ Edge Cases: [C]/[D]
- ✅ Error Cases: [E]/[F]
- ⏳ Integration: [G]/[H]
- ⏳ Security: [I]/[J]
- ⏳ Performance: [K]/[L]
- ⏳ Usability: [M]/[N]

### Estado General
- 🟢 Funcionalidad estable
- 🟡 Funcionalidad con mejoras sugeridas
- 🔴 Funcionalidad con errores críticos
```

#### 5.2. Detalle de Errores Encontrados

**Formato:**
```
## 🐛 Errores Críticos

### Error [X]: [Título del error]
**Severidad:** [Crítica | Alta | Media | Baja]
**Escenario:** [Nombre del escenario donde ocurrió]
**Pasos para reproducir:**
1. [Paso 1]
2. [Paso 2]
...
**Comportamiento observado:** [Qué ocurrió]
**Comportamiento esperado:** [Qué debería ocurrir]
**Evidencia:**
- Screenshot: [path a screenshot]
- Console log: [extracto de log]
- URL: [URL donde ocurrió]
**Sugerencia de fix:** [Descripción de cómo solucionar]
```

#### 5.3. Mejoras Propuestas

**Formato:**
```
## 💡 Mejoras Propuestas

### Mejora [X]: [Título de la mejora]
**Categoría:** [Usabilidad | Estética | Performance | Seguridad]
**Prioridad:** [Alta | Media | Baja]
**Descripción:** [Descripción detallada]
**Beneficio:** [Qué mejora esta propuesta]
**Implementación sugerida:** [Cómo implementar]
**Espec relacionada:** [path a spec si aplica]
```

#### 5.4. Recursos Creados

**Formato:**
```
## 📦 Recursos Creados Durante Pruebas

| Tipo | Nombre/ID | Método de creación | Estado |
|------|-----------|-------------------|--------|
| Producto | Producto Test 1 | UI | ✅ Validado |
| Cliente | Cliente Test 1 | UI | ✅ Validado |
| ... | ... | ... | ... |
```

---

## Ejemplo de Ejecución Completa

### Invocación
```
/qa productos
```

### Salida esperada

1. **Verificación de precondiciones:**
   - ✅ Servidor corriendo en puerto 3000
   - ✅ Playwright MCP disponible

2. **Análisis de specs:**
   - Specs encontradas:
     - `/specs/products.md`
     - `/specs/components/product-form.md`
     - `/specs/inventory.md`

3. **Plan de pruebas:**
   ```
   ## Escenario 1: Creación de producto (Happy Path)
   **Tipo:** Happy Path
   **Spec relacionada:** /specs/products.md
   **Descripción:** Crear un producto con datos válidos
   **Precondiciones:** Usuario autenticado con rol admin
   **Pasos:**
     1. Navegar a /adm/products
     2. Clic en "Nuevo Producto"
     3. Llenar formulario con datos válidos
     4. Clic en "Guardar"
   **Resultado esperado:** Producto creado y visible en lista
   **Recursos necesarios:** Categoría existente
   ```

4. **Ejecución:**
   - [Screenshots y logs capturados]
   - [Recursos creados vía UI]

5. **Reporte final:**
   - [Resumen detallado con errores y mejoras]

---

## Notas Importantes

- **Orden de ejecución:** Siempre probar happy paths primero
- **Creación de recursos:** Priorizar UI sobre API para primera creación
- **Screenshots:** Capturar en cada paso clave
- **Console logs:** Revisar siempre para errores silenciosos
- **Reproducibilidad:** Documentar pasos para reproducir errores
- **Mejoras:** Ser específico y accionable en sugerencias
