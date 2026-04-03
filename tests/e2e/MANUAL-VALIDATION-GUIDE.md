# Validación Manual del Importador de Productos - Guía Paso a Paso

## Estado Actual
✅ Servidor corriendo: `http://localhost:3333`  
✅ Test data listo: `tests/e2e/product-import-test.csv`  
✅ Tests E2E preparados: `tests/e2e/product-importer-dry-run.spec.ts`

---

## Guía de Validación Manual (Ejecuta en tu Browser)

### Paso 1: Login y Acceso
```
URL: http://localhost:3333/login
Acción: Login con credenciales de test
Validación: Redirección a /adm/products/import
```

### Paso 2: Página de Importador
```
URL: http://localhost:3333/adm/products/import
Elementos a verificar:
├── Título: "Importar Productos" ✅
├── Stepper: 4 pasos (Cargar CSV → Configurar → Revisar → Importar) ✅
├── Dropzone: "Arrastra un archivo CSV aquí" ✅
└── Botón: "Seleccionar Archivo" ✅
```

### Paso 3: Subida del CSV
```
Archivo: tests/e2e/product-import-test.csv
Acción: Drag & drop al dropzone
Validaciones:
├── ✅ File accepted (debe desaparecer el dropzone)
├── ✅ Auto-redirect a paso 2
├── ✅ Column detection: 11 columns detectadas
└── ✅ Preview: primeras filas del CSV
```

### Paso 4: Configuración de Mapeo
```
Auto-detection esperado:
├── PRODUCTO → name (transform: capitalize) ✅
├── RUBRO → categoryId (transform: capitalize) ✅
├── STOCK → stock (transform: round) ✅
├── MAYORISTA → salePrice (transform: spanish) ✅
├── PRECIO COMPRA → costPrice (transform: spanish) ✅
└── CODPROV → sku (transform: uppercase) ✅

Validaciones UX:
├── ✅ Mapeos pre-llenados
├── ✅ Opciones globales visibles
├── ✅ Botón "Continuar" habilitado
└── ✅ Validación: "Debes mapear al menos la columna de nombre"
```

### Paso 5: Revisión Dry-Run
```
Esperar: 2-3 segundos (API validation)
Validaciones:
├── Stats: Total=19, Válidos=?, Inválidos=?, Categorías=6 ✅
├── Tabs: Nuevos, Omitidos, Categorías ✅
├── Productos: Nombres capitalizados, precios convertidos ✅
└── Categorías: DEFLECTORES, ELECTRICIDAD, ACEITES, etc. ✅

Transformaciones a verificar:
├── "/DEFLECTOR P/VENTANILLA" → "Deflector P/Ventanilla" ✅
├── "34727,00" → 34727.00 ✅
├── Stock=-3 → Omitido (si skipStockLessThanOne=true) ✅
└── Empty CODPROV → Manejado gracefully ✅
```

---

## Checklist de Observación UX

### ✅ Aspectos Positivos a Documentar
- [ ] Flujo intuitivo de 4 pasos
- [ ] Auto-detection funciona con headers en español
- [ ] Feedback visual inmediato en cada paso
- [ ] Mensajes de error claros y útiles
- [ ] Responsive design funciona

### ❌ Problemas a Identificar
- [ ] ¿Confusión en terminología técnica? ("transform: spanish")
- [ ] ¿Falta de feedback durante validación API?
- [ ] ¿Diseño de tabs confuso?
- [ ] ¿Mensajes de error poco claros?
- [ ] ¿Problemas de accesibilidad?

### ⚠️ Oportunidades de Mejora
- [ ] ¿Podría ser más visual el mapeo?
- [ ] ¿Necesita más guías para el usuario?
- [ ] ¿Podría pre-cargar configuraciones comunes?
- [ ] ¿Necesita mejor feedback de progreso?

---

## Template de Documentación de Hallazgos

```
## [Paso X] - [Nombre del Paso]

### Observación
- ✅ **Bueno**: [Descripción]
- ❌ **Problema**: [Descripción]
- ⚠️ **Mejora**: [Descripción]

### Impacto en Usuario
- [ ] Bloquea el flujo
- [ ] Causa confusión
- [ ] Ralentiza el proceso
- [ ] Afecta confianza

### Propuesta de Mejora
**Problema**: [Descripción clara]
**Solución**: [Implementación específica]
**Prioridad**: [Alta/Media/Baja]
**Autorización requerida**: ⏳
```

---

## Tests Automatizados Disponibles

Para validar automáticamente después de mejoras manuales:

```bash
# Ejecutar todos los tests E2E
pnpm exec playwright test tests/e2e/product-importer-dry-run.spec.ts --headed

# Ejecutar solo un paso
pnpm exec playwright test tests/e2e/product-importer-dry-run.spec.ts --grep "Step 3"

# Debug mode
pnpm exec playwright test tests/e2e/product-importer-dry-run.spec.ts --debug
```

---

## Próximos Pasos

1. **Ejecuta la validación manual** siguiendo esta guía
2. **Documenta hallazgos** usando el template
3. **Identifica 3-5 problemas UX prioritarios**
4. **Propón soluciones específicas**
5. **Espero tu autorización** para implementar cada mejora

Este enfoque elimina la espera y permite iteración rápida centrada en la experiencia real del usuario.
