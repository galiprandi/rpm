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
```

**Validaciones**:
- Selectores de categoría y proveedor funcionan
- Campos numéricos (stock, precios) correctos
- Modal de movimientos con fondo correcto

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

## Entregables

1. **Reporte de regresión** con todos los issues encontrados
2. **Fixes aplicados** con archivos modificados
3. **Screenshots de validación** (antes/después)
4. **Checklist firmada** de todos los puntos verificados

## Tiempo Estimado

- Fases 1-2: 15 minutos
- Fases 3-4: 20 minutos
- Fase 5: 15 minutos
- Fases 6-7: 15 minutos
- Documentación: 10 minutos

**Total**: ~75 minutos
