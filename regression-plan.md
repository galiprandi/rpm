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

---

## FASE 8: Módulo Taller (Workshop) - CORE MODULE ⭐

**Importancia**: Este módulo es CORE para el negocio. Validación exhaustiva requerida.

### Fase 8.1: CRUD Clientes - NUEVA UI CON HEADER REUSABLE
**Herramienta**: Playwright MCP
```
1. Navegar a /adm/customers
2. Verificar que "Clientes" aparece segundo en el menú sidebar
3. Verificar Header estándar en lista:
   - Título "Clientes" (text-3xl font-bold)
   - Descripción "Gestiona tus clientes"
   - Botón "Nuevo Cliente" con estilo bg-slate-900
4. Click "Nuevo Cliente"
5. Validar formulario completo:
   - **Nombre** (requerido) - campo unificado para PF/PJ
   - Teléfono principal (requerido)
   - Teléfono alternativo (WhatsApp)
   - Email
   - Dirección
   - Notas
   - **Datos de facturación opcional** (sección colapsable):
     - CUIT (para factura A/B)
     - Tipo de factura (A, B, C, M)
6. Crear cliente de prueba (sin documento requerido)
7. Verificar en lista con conteo de vehículos y OTs
8. Click "Ver" para ir a ficha de cliente
9. Validar VISTA DE DETALLE con Header reusable:
   - Título: Nombre del cliente (no UUID)
   - Subtítulo: "Cliente desde [fecha]"
   - Contactos accionables: teléfono (clickable), email (clickable)
   - Botón "Volver" (ghost)
   - CTA "Crear Vehículo" (bg-slate-900)
10. Validar tabs: Vehículos e Historial OTs
11. Editar cliente
12. Volver a lista y verificar cambios
```

**Validaciones**:
- Header component reusable funciona correctamente
- Screenshot del formulario de cliente
- Búsqueda funciona (por nombre, teléfono, documento)
- Conteo de vehículos y OTs correcto
- **NUEVO**: CTA cambiado de "Nueva OT" a "Crear Vehículo" en vista de cliente
- **NUEVO**: Contactos son clickeables (tel: y mailto:)
- **NUEVO**: No se muestran UUIDs en el header

### Fase 8.2: CRUD Vehículos/Activos - NUEVO HEADER
**Herramienta**: Playwright MCP
```
1. Desde ficha de cliente, click "Crear Vehículo" (CTA principal)
2. Validar selector de categorías:
   - Auto/Camioneta 🚗
   - SUV/4x4 🚙
   - Pickup 🛻
   - Camión 🚚
   - Moto 🏍️
   - Trailer/Acoplado 🚛
   - Equipo de Audio 🔊
   - Monopatín Eléctrico 🛴
   - Otro Equipo 📦
3. Probar flujo VEHÍCULO:
   - Seleccionar "Auto/Camioneta"
   - Campos: Patente, Marca, Modelo, Año, Color
   - Guardar
4. Probar flujo EQUIPO:
   - Seleccionar "Equipo de Audio"
   - Campos: Código/Serie, Nombre del Equipo, Tipo, Descripción
   - Guardar
5. Verificar en lista de vehículos del cliente
6. Click "Ver" en vehículo para ir a ficha de vehículo
7. Validar VISTA DE DETALLE de vehículo:
   - Header con patente/código como título
   - Descripción con categoría
   - Botón "Volver"
   - CTA "Nueva OT" (bg-slate-900)
8. Buscar vehículo por identificador (patente/código)
```

**Validaciones**:
- Campos condicionales según categoría
- Normalización de marcas/modelos
- Identificador único por cliente
- **NUEVO**: Header reutilizable en vista de vehículo
- **NUEVO**: CTA "Nueva OT" disponible desde vehículo
- **NUEVO**: Contactos del propietario accionables en header

### Fase 8.3: Creación de Órdenes de Trabajo (OT) - NUEVO FLUJO POR PATENTE ⭐
**Herramienta**: Playwright MCP
```
1. Navegar a /adm/work-orders
2. Verificar menú "Órdenes de Trabajo" en sidebar
3. Verificar vista Kanban con 7 columnas:
   - Confirmada, En Espera, En Proceso, Control QC, Listo, Pagada, Entregada
4. Validar HEADER del Kanban:
   - Título "Órdenes de Trabajo"
   - Botón "Nueva OT" (bg-slate-900)
   - Toggle Kanban/Lista
5. Click "Nueva OT"
6. **PASO 1 - Buscar Vehículo por Patente (NUEVO FLUJO):**
   - Input: "Ingrese patente..." (ej: ABC123 o AB123CD)
   - Click "Buscar"
   - **SI ENCUENTRA vehículo:**
     - Card verde con: Patente, Categoría, Marca/Modelo/Año
     - Datos del dueño: Nombre, Teléfono
     - Botón "Confirmar y Continuar"
     - Botón "Buscar Otro" (por si es otro vehículo)
   - **SI NO ENCUENTRA vehículo:**
     - Mensaje: "No se encontró vehículo con patente X"
     - Formulario de creación de vehículo:
       - Categoría (select con iconos)
       - Patente/Identificador
       - Marca/Modelo/Año/Color (si es vehículo)
       - Nombre/Tipo de equipo (si es equipo)
     - Sección "Seleccionar Dueño":
       - Buscar cliente existente por nombre/teléfono
       - O "Crear Nuevo Cliente" inline (nombre, teléfono, email)
       - Mostrar "Cliente seleccionado" en verde
     - Botón "Continuar" (disabled hasta tener vehículo + cliente)
7. **PASO 2 - Servicios/Productos:**
   - Mostrar resumen: Patente + Nombre del cliente
   - Botón "Cambiar" (volver a paso 1)
   - Agregar servicios del catálogo
   - Agregar productos
   - Verificar cálculo de totales
   - Modificar cantidades
   - Eliminar items
8. **PASO 3 - Checklist y Finalizar:**
   - Mostrar resumen: Patente + Cliente + N° items
   - Checklist de ingreso (checkboxes)
   - Fecha agendada opcional
   - Notas
   - Verificar total estimado
   - **Campo source automático: 'IN_PERSON'**
   - Crear OT
```

**Validaciones**:
- **NUEVO**: Wizard de 3 pasos (no 4) - flujo invertido por patente
- **NUEVO**: Búsqueda por patente como entrada principal
- **NUEVO**: Card de vehículo con datos del dueño
- **NUEVO**: Creación inline de vehículo + cliente si no existe
- **NUEVO**: Campo `source` en WorkOrder ('IN_PERSON' | 'WEB')
- Totales calculados en tiempo real
- Checklist de ingreso guardado

### Fase 8.4: Kanban de OTs y Detalle - NUEVA UI
**Herramienta**: Playwright MCP
```
1. En /adm/work-orders, verificar vista Kanban:
   - 7 columnas visibles
   - Cards rediseñados con info: Cliente, Vehículo, Total, Delay warning
   - OTs mostradas en columnas correctas
2. Cambiar a vista Lista (toggle)
3. Verificar lista ordenada por fecha
4. Abrir OT creada en paso anterior
5. Verificar DETALLE DE OT rediseñado:
   - Header con info VEHÍCULO prioritaria:
     - Patente/Identificador como título
     - Marca/Modelo/Año
     - Info del cliente secundaria (nombre, contactos accionables)
     - **Badge de origen: 'Presencial' o 'Web'**
   - Botón "Volver" (ghost)
   - Selector "Cambiar Estado" visible
6. Verificar TABS:
   - Checklists (ingreso y calidad)
   - Items/Servicios con tabla
   - Fotos (entry/exit)
   - Timeline de eventos
7. Cambiar estado de OT:
   - Usar selector "Cambiar Estado"
   - Probar flujo: En Espera → En Proceso → Listo
   - Verificar timestamps automáticos (startedAt, completedAt)
8. Verificar DataTable de items:
   - Columnas: Servicio/Producto, Cantidad, Precio, Total
   - Totales al pie
```

**Validaciones**:
- Kanban responsive (scroll horizontal si es necesario)
- Cards con nuevo diseño (delay warnings visibles)
- **NUEVO**: Header prioriza info del vehículo sobre cliente
- **NUEVO**: Badge de origen OT (Presencial/Web) visible
- **NUEVO**: Tabs organizados correctamente
- **NUEVO**: DataTable para items
- Cambio de estado persiste
- Timestamps registrados correctamente
- Timeline muestra eventos en orden cronológico

### Fase 8.5: UI Architecture - Header Component ✅ NUEVO
**Herramienta**: Inspección de código + Playwright
```
1. Verificar Header component en todas las vistas admin:
   - /adm/customers - Header con título, desc, CTA
   - /adm/customers/[id] - Header con contactos, botón volver
   - /adm/vehicles/[id] - Header con patente, info propietario
   - /adm/work-orders - Header Kanban con toggle
   - /adm/work-orders/[id] - Header con info vehículo
   - /adm/products - Header con stats

2. Validar anatomía estándar:
   - Título (text-3xl font-bold text-foreground)
   - Descripción (text-muted-foreground)
   - Botón Volver (ghost, cuando showBackButton=true)
   - CTA Principal (bg-slate-900 text-white)
   - Contactos accionables (tel:, mailto:, maps)

3. Verificar imports correctos:
   - import { Header } from '@/components/adm/Header'
```

**Validaciones**:
- Header reusable usado en todas las vistas de detalle
- Consistencia visual en todas las páginas
- No hay stats cards en vistas de detalle (solo en listados)
- Contactos son clickeables en headers de detalle

### Fase 8.6: Búsqueda y Filtrado
**Herramienta**: Playwright MCP + API
```
1. Probar búsqueda de clientes:
   - GET /api/customers?search=[nombre]
   - GET /api/customers?search=[teléfono]
   - Ya no se busca por documento (eliminado del modelo)
2. Probar búsqueda de vehículos:
   - GET /api/vehicles/by-identifier/[patente]
3. Probar filtros de OTs:
   - GET /api/work-orders?status=IN_PROGRESS
   - GET /api/work-orders?customerId=[id]
4. Verificar respuestas JSON correctas
```

### Fase 8.7: Tests E2E Automatizados - Work Orders ⭐ NUEVO
**Herramienta**: Playwright Test Suite (`tests/playwright/work-orders.spec.ts`)
**Propósito**: Ejecución automatizada de regresión completa del flujo de OTs

```
1. Ejecutar suite completa:
   pnpm exec playwright test tests/playwright/work-orders.spec.ts

2. Tests incluidos:
   
   TC-WO-001: Listado de Órdenes de Trabajo
   - Verificar redirección a login sin autenticación
   - Validar protección de rutas /adm/*
   
   TC-WO-002: Creación de OT - Flujo Completo
   - Paso 1: Búsqueda de vehículo por patente
   - Paso 2: Agregar servicios/productos
   - Paso 3: Checklist y finalización
   
   TC-WO-003: APIs de Work Orders
   - GET /api/work-orders - debe retornar 401 sin auth
   - POST /api/work-orders - debe retornar 401 sin auth
   - GET /api/vehicles/by-identifier/:id - debe retornar 401 sin auth
   
   TC-WO-004: Validaciones y Edge Cases
   - Búsqueda de vehículo con patente vacía
   - Creación de OT sin items (debe ser bloqueada)
   - Creación de OT sin cliente (debe ser bloqueada)

3. Validar resultados:
   - Todos los tests deben pasar (✅)
   - No debe haber errores de conexión
   - Screenshots generados en caso de fallo
```

**Validaciones E2E**:
- Flujo completo de creación de OT en < 30 segundos
- Todos los pasos del wizard funcionan correctamente
- Validaciones de formulario en tiempo real
- Manejo de errores consistente (useUI hook)
- Redirecciones correctas después de crear OT

**Archivo de Tests**: `tests/playwright/work-orders.spec.ts`

## Checklist de Errores Workshop Comunes a Detectar

### Errores de Tema
- [ ] Modal transparente o sin fondo
- [ ] Fondo gris en tema claro
- [ ] Texto invisible por contraste
- [ ] Inputs sin bordes
- [ ] Botones con colores incorrectos

### Errores de Layout - NUEVOS
- [ ] Sidebar items con fondo incorrecto
- [ ] Desbordamiento de texto
- [ ] Scroll no funciona en modales largos
- [ ] Z-index incorrecto (elementos tapados)
- [ ] **Header no usa componente reusable**
- [ ] **Stats cards en vista de detalle (debe estar solo en listados)**
- [ ] **UUIDs visibles en headers**
- [ ] **Contactos no clickeables**

### Errores de Funcionalidad
- [ ] Selectores no cargan opciones
- [ ] Formularios no envían datos
- [ ] Errores en consola (404, 500)
- [ ] Validaciones de campos no funcionan
- [ ] **Botón "Volver" no funciona**
- [ ] **CTA principal no navega correctamente**
- [ ] **Toggle Kanban/Lista no funciona**
- [ ] **Datos de facturación no se muestran/colapsan correctamente**
- [ ] **Búsqueda por patente no funciona**
- [ ] **Flujo de creación vehículo+cliente inline falla**
- [ ] **Cálculo incorrecto de OTs atrasadas (usando createdAt en vez de startedAt)**
- [ ] **Alert nativo en lugar de useUI hook**
- [ ] **Step 2 permite continuar sin items seleccionados**
- [ ] **Validación inconsistente para equipos no motorizados**

## Formato de Reporte de QA Profesional

Al finalizar la regresión, generar informe con el siguiente formato:

```markdown
# 📊 INFORME QA - [Módulo/Flujo Testeado]

## Resumen Ejecutivo
**Estado General**: 🟢 Funcional / 🟡 Funcional con mejoras / 🔴 Crítico
**Tests E2E**: [Cantidad] creados/ejecutados
**Bugs Críticos**: [Número]
**Mejoras Recomendadas**: [Número]

## 🐛 BUGS ENCONTRADOS

### BUG-00X: [Título descriptivo] ([Severidad])
**Ubicación**: `@/ruta/archivo:linea`

Código problemático:
```typescript
// Código con el bug
```

**Problema**: [Descripción del problema]

**Fix**: [Descripción de la solución]
```typescript
// Código fixeado
```

## 🔧 MEJORAS RECOMENDADAS

### MEJ-00X: [Título]
**Descripción**: [Explicación de la mejora]

## ✅ TESTS E2E CREADOS/EJECUTADOS

**Archivo**: `tests/playwright/[archivo].spec.ts`

- ✅ TC-XXX: [Nombre del test case]
- ✅ TC-XXX: [Nombre del test case]

## 📁 Archivos Modificados
- `@/ruta/archivo` - [Descripción del cambio]

## 📝 Notas para el Equipo
[Instrucciones adicionales]
```

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

### Verificar Header component:
```javascript
// Verificar que se usa el Header component
const header = document.querySelector('h1').closest('.flex.justify-between');
console.log('Header estructura:', header?.innerHTML?.includes('text-3xl font-bold'));

// Verificar contactos accionables
const phoneLink = document.querySelector('a[href^="tel:"]');
console.log('Teléfono clickeable:', phoneLink !== null);
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
