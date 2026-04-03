# 🎭 Live Testing Guide - Product Importer

## 📱 Abre Chrome y Navega a: `http://localhost:3333/adm/products/import`

### Paso 1: Login con Debug Auth
```
URL: http://localhost:3333/login
Acción: Deberías ver el login automático con Debug Auth
Validación: Redirección automática a /adm/products/import
```

### Paso 2: Página del Importador
```
Elementos que deberías ver:
├── 📄 Título: "Importar Productos"
├── 📊 Stepper: 4 pasos visibles
│   ├── ✅ Paso 1: Cargar CSV
│   ├── ⏳ Paso 2: Configurar
│   ├── ⏳ Paso 3: Revisar
│   └── ⏳ Paso 4: Importar
├── 📤 Dropzone: "Arrastra un archivo CSV aquí"
└── 🔘 Botón: "Seleccionar Archivo"
```

### Paso 3: Subida del CSV
```
Archivo a usar: tests/e2e/product-import-test.csv
Acción: Arrastra el archivo al dropzone O haz clic en "Seleccionar Archivo"

Lo que debería pasar:
✅ File accepted (dropzone desaparece)
✅ Loading indicator aparece
✅ Auto-redirect a Paso 2
✅ Column detection: 11 columns
✅ Preview: primeras filas del CSV
```

### Paso 4: Configuración de Mapeo
```
Auto-detection que deberías ver:
├── PRODUCTO → name (transform: capitalize)
├── RUBRO → categoryId (transform: capitalize)  
├── STOCK → stock (transform: round)
├── MAYORISTA → salePrice (transform: spanish)
├── PRECIO COMPRA → costPrice (transform: spanish)
└── CODPROV → sku (transform: uppercase)

Validaciones UX:
✅ Mapeos pre-llenados automáticamente
✅ Opciones globales visibles
✅ Botón "Continuar" habilitado
✅ Mensajes claros si falta algo
```

### Paso 5: Revisión Dry-Run
```
Esperar: 2-3 segundos (API validation)

Lo que deberías ver:
├── 📊 Estadísticas: Total=19, Válidos=?, Inválidos=?, Categorías=6
├── 📑 Tabs: Nuevos, Omitidos, Categorías
├── 📋 Productos: Nombres capitalizados, precios convertidos
└── 🏷️ Categorías: DEFLECTORES, ELECTRICIDAD, ACEITES, etc.

Transformaciones a verificar:
✅ "/DEFLECTOR P/VENTANILLA" → "Deflector P/Ventanilla"
✅ "34727,00" → 34727.00  
✅ Stock=-3 → Omitido (si skipStockLessThanOne=true)
✅ Empty CODPROV → Manejado gracefully
```

---

## 🔍 Checklist de Observación UX

### ✅ Aspectos Positivos (Documenta lo que funciona bien)
- [ ] Flujo intuitivo de 4 pasos
- [ ] Auto-detection funciona con headers en español
- [ ] Feedback visual inmediato
- [ ] Mensajes de error claros
- [ ] Diseño responsive

### ❌ Problemas a Identificar (Documenta issues)
- [ ] ¿Confusión en terminología técnica? ("transform: spanish")
- [ ] ¿Falta de feedback durante validación API?
- [ ] ¿Diseño de tabs confuso?
- [ ] ¿Mensajes de error poco claros?
- [ ] ¿Problemas de accesibilidad?

### ⚠️ Oportunidades de Mejora (Sugiere mejoras)
- [ ] ¿Podría ser más visual el mapeo?
- [ ] ¿Necesita más guías para el usuario?
- [ ] ¿Podría pre-cargar configuraciones comunes?
- [ ] ¿Necesita mejor feedback de progreso?

---

## 📝 Template de Documentación (Usa esto para registrar)

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

### Captura de Pantalla
[Describe lo que ves en la pantalla]

### Propuesta de Mejora
**Problema**: [Descripción clara]
**Solución**: [Implementación específica]
**Prioridad**: [Alta/Media/Baja]
```

---

## 🚀 Ejecución en Tiempo Real

### Ahora Mismo:
1. **Chrome está abierto** en `http://localhost:3333/adm/products/import`
2. **Navega el flujo** paso a paso
3. **Documenta** tus observaciones usando el template
4. **Captura screenshots** de puntos clave
5. **Identifica** 3-5 mejoras UX prioritarias

### Yo te ayudo:
- ✅ **Test data listo**: `tests/e2e/product-import-test.csv`
- ✅ **Servidor corriendo**: `http://localhost:3333`
- ✅ **Debug Auth activo**: Login automático
- ✅ **Documentación preparada**: Templates y checklists

**¿Listo para navegar y documentar el flujo en tiempo real?**
