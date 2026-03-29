# Plan de Regresión Completa - RPM Accesorios

## Objetivo
Realizar una regresión profunda del sistema verificando flujos completos de creación de entidades (categorías, proveedores, productos), cambio de temas y consistencia UI.

## Herramientas Utilizadas

### 1. Playwright MCP (Automatización)
- **Navegación**: `mcp9_browser_navigate`, `mcp9_browser_click`
- **Inspección**: `mcp9_browser_evaluate`, `mcp9_browser_snapshot`
- **Validación visual**: `mcp9_browser_take_screenshot`
- **Esperas**: `mcp9_browser_wait_for`

### 2. Inspección de Código
- Búsquedas con `grep_search` para encontrar componentes
- Lectura de archivos con `read_file`
- Verificación de estilos CSS y clases Tailwind

### 3. Validación de Datos
- Verificación de API responses
- Inspección de consola para errores
- Check de estilos computados

## Flujo de Regresión Detallado

### Fase 1: Setup y Verificación Inicial
```
1. Verificar servidor corriendo en localhost:3000
2. Confirmar tema actual (document.documentElement.className)
3. Capturar baseline screenshot de estado inicial
```

### Fase 2: CRUD Categorías
**Herramienta**: Playwright MCP
```
1. Navegar a /adm/categories
2. Click "Nueva Categoría"
3. Validar modal:
   - Fondo debe ser blanco (tema claro) o gris oscuro (tema oscuro)
   - Inputs deben ser visibles y consistentes
   - No debe haber fondo gris en tema claro
4. Crear categoría de prueba
5. Verificar en lista
6. Editar categoría
7. Eliminar categoría (si es posible)
```

**Validaciones**:
- Screenshot del modal
- `getComputedStyle(modal).backgroundColor` debe ser `rgb(255,255,255)` (claro)
- Verificar clases: no debe tener `bg-muted` en elementos principales

### Fase 3: CRUD Proveedores
**Herramienta**: Playwright MCP
```
1. Navegar a /adm/suppliers
2. Click "Nuevo Proveedor"
3. Validar modal (igual que categorías)
4. Crear proveedor de prueba
5. Verificar en lista
6. Editar proveedor
7. Validar campos: nombre, contacto, teléfono, email, dirección
```

**Validaciones**:
- Consistencia de estilos con categorías
- Campos de formulario alineados
- Botones con estilos correctos

### Fase 4: CRUD Productos
**Herramienta**: Playwright MCP
```
1. Navegar a /adm/products
2. Click "Nuevo Producto"
3. Validar modal completo (más campos que categorías/proveedores)
4. Crear producto vinculado a categoría y proveedor creados
5. Verificar en lista
6. Ver historial de movimientos (modal ya reparado)
7. Editar producto
8. MODIFICAR STOCK: Cambiar stock del producto
9. Verificar que el registro de cambio de stock se agrega al historial
```

**Validaciones**:
- Selectores de categoría y proveedor funcionan
- Campos numéricos (stock, precios) correctos
- Modal de movimientos con fondo correcto
- **NUEVO**: Cambio de stock genera registro en historial con:
  - Tipo de movimiento (entrada/salida/ajuste)
  - Cantidad modificada
  - Fecha y hora del registro
  - Usuario que realizó el cambio

### Fase 5: Cambio de Tema Claro/Oscuro
**Herramienta**: Playwright MCP + Evaluación JavaScript
```
1. Ir a /adm/settings
2. Cambiar tema a "Oscuro"
3. Verificar clase "dark" en html
4. Capturar screenshots de:
   - Sidebar
   - Tablas
   - Modales (abrir y cerrar)
5. Cambiar tema a "Claro"
6. Verificar clase "light" en html
7. Repetir screenshots
8. Validar consistencia:
   - No fondos grises en tema claro
   - Texto legible en ambos temas
   - Inputs con bordes visibles
```

**Comandos de validación**:
```javascript
// Ver tema actual
document.documentElement.className

// Ver color de fondo de cualquier elemento
getComputedStyle(element).backgroundColor

// Ver color de texto
getComputedStyle(element).color
```

### Fase 6: Verificación Sidebar y Layout
**Herramienta**: Inspección visual + Playwright
```
1. Verificar items del sidebar:
   - No deben tener fondo gris/grisáceo en tema claro
   - Hover effects correctos
   - Estado activo visible
2. Verificar menú de usuario:
   - Avatar visible
   - Dropdown funciona
   - Fondo correcto
3. Verificar responsive (colapsar/expandir sidebar)
```

**Archivos a revisar**:
- `/components/adm/layout/AppSidebar.tsx`
- `/components/adm/layout/AdminClientLayout.tsx`
- `/components/ui/sidebar.tsx`

### Fase 7: Validación de Modales Globales
```
1. ProductMovementsModal (ya reparado)
2. ProductDialog (crear/editar producto)
3. CategoryForm
4. SupplierForm
5. ConfirmDialog (eliminar)

Validar todos con:
- Fondo correcto según tema
- No transparencias inesperadas
- Layout consistente
```

## Checklist de Errores Comunes a Detectar

### Errores de Tema
- [ ] Modal transparente o sin fondo
- [ ] Fondo gris en tema claro
- [ ] Texto invisible por contraste
- [ ] Inputs sin bordes
- [ ] Botones con colores incorrectos

### Errores de Layout
- [ ] Sidebar items con fondo incorrecto
- [ ] Desbordamiento de texto
- [ ] Scroll no funciona en modales largos
- [ ] Z-index incorrecto (elementos tapados)

### Errores de Funcionalidad
- [ ] Selectores no cargan opciones
- [ ] Formularios no envían datos
- [ ] Errores en consola (404, 500)
- [ ] Validaciones de campos no funcionan

## Formato de Reporte de Issues

Para cada issue encontrado:

```markdown
### Issue #X: [Título descriptivo]
**Severidad**: Alta/Media/Baja
**Ubicación**: [Componente/Página]
**Descripción**: [Qué está mal]

**Evidencia**:
- Screenshot: [ruta]
- Código afectado: [ruta archivo:linea]
- Comportamiento esperado: [descripción]

**Fix aplicado**:
- Archivo: [ruta]
- Cambio: [antes → después]
```

## Comandos de Validación Reproducibles

### Verificar color de fondo de modal:
```javascript
const modal = document.querySelector('[data-slot="dialog-content"]');
console.log(getComputedStyle(modal).backgroundColor);
// Debe ser: rgb(255, 255, 255) en tema claro
// Debe ser: rgb(2.55, 11.5, 25.5) aprox en tema oscuro
```

### Verificar tema actual:
```javascript
document.documentElement.classList.contains('light'); // true/false
document.documentElement.classList.contains('dark');  // true/false
```

### Verificar clases de elemento:
```javascript
document.querySelector('[elemento]').className;
```

### Verificar registro en historial de stock:
```javascript
// Después de modificar stock, abrir modal de historial y verificar
const historyRows = document.querySelectorAll('[data-testid="movement-history-row"]');
const lastMovement = historyRows[historyRows.length - 1];
console.log('Último movimiento:', {
  type: lastMovement.querySelector('[data-testid="movement-type"]')?.textContent,
  quantity: lastMovement.querySelector('[data-testid="movement-quantity"]')?.textContent,
  date: lastMovement.querySelector('[data-testid="movement-date"]')?.textContent,
  user: lastMovement.querySelector('[data-testid="movement-user"]')?.textContent
});
```

## Issues Encontrados y Fixes Aplicados

### Issue #1: Items del sidebar tenían fondo gris innecesario
**Severidad**: Media
**Ubicación**: `/components/ui/sidebar.tsx`
**Descripción**: Los items del sidebar (`SidebarMenuButton`) tenían un fondo gris (`rgb(219, 230, 240)` en tema claro, `rgb(30, 41, 59)` en tema oscuro) aplicado por defecto, cuando solo deberían tener fondo en hover o cuando están activos.

**Causa raíz**: 
1. La clase `active:bg-sidebar-accent` aplicaba fondo cuando el elemento estaba siendo presionado (pseudo-estado CSS :active)
2. El atributo `data-active` se estaba aplicando como string `"false"` en lugar de no aplicarse, y la clase `data-active:bg-sidebar-accent` se activaba por la presencia del atributo (sin importar su valor)

**Fix aplicado**:
- Archivo: `/components/ui/sidebar.tsx`
- Cambios:
  1. Remover `active:bg-sidebar-accent active:text-sidebar-accent-foreground` de la clase base (línea 468)
  2. Cambiar `data-active={isActive}` a `data-active={isActive || undefined}` (línea 510) para que el atributo solo exista cuando es true

**Validación**:
- ✅ Tema claro: items tienen fondo transparente `rgba(0, 0, 0, 0)`
- ✅ Tema oscuro: items tienen fondo transparente `rgba(0, 0, 0, 0)`
- ✅ Solo el item activo muestra el fondo de acento

---

## Resumen de Regresión

### Resultados por Fase

| Fase | Estado | Notas |
|------|--------|-------|
| Tema Claro - Categorías | ✅ PASS | Modal fondo blanco correcto |
| Tema Claro - Proveedores | ✅ PASS | Modal fondo blanco correcto |
| Tema Claro - Productos | ✅ PASS | Modal fondo blanco correcto |
| Tema Oscuro - Categorías | ✅ PASS | Modal fondo oscuro correcto |
| Tema Oscuro - Proveedores | ✅ PASS | Modal fondo oscuro correcto |
| Tema Oscuro - Productos | ✅ PASS | Modal fondo oscuro correcto |
| Sidebar - Fondos | ✅ FIXED | Items ahora transparentes |

### Archivos Modificados
1. `/components/ui/sidebar.tsx` - Fix de fondos en items del sidebar
2. `/app/globals.css` - Reorden de CSS para Tailwind v4 (previo a esta sesión)

### Screenshots de Validación
- Ver directorio de screenshots de Playwright para evidencia visual
