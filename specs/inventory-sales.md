# 📦 FASE 1: MVP Stock & Ventas

## Objetivo
**Reemplazar completamente el sistema actual de stock y ventas** en uso en RPM.
Entregar valor inmediato: control de inventario, facturación AFIP y cierre de caja.

## MVP Scope (Mínimo Viable)
Solo lo esencial para operar día a día.

---

## Módulos Incluidos

### 1. Gestión de Productos

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **CRUD Productos** | P0 | Alta, baja, edición con campos esenciales |
| **Categorías simples** | P0 | Iluminación, Estética, Tratamientos, Accesorios |
| **Control básico stock** | P0 | Cantidad actual, stock mínimo |
| **Alertas stock bajo** | P1 | Visual cuando stock ≤ mínimo |
| **Precios: costo y venta** | P0 | Costo, precio venta, margen calculado |

#### Campos Producto (MVP):

| Campo | Obligatorio | Descripción | Reglas UI |
|-------|-------------|-------------|-----------|
| **EAN/Barcode** | ✅ Sí | Código de barras principal | **Primer campo en formulario**, placeholder "1234567890123" |
| **Nombre** | ✅ Sí | Nombre descriptivo | Segundo campo, placeholder "Barra LED 20 pulgadas" |
| **SKU** | ❌ No | Código interno opcional | Placeholder "LED-001 (opcional)", sin required |
| **Proveedor** | ✅ Sí | Relación a tabla Supplier | Dropdown de proveedores, seed incluye "Sin especificar" |
| **Categoría** | ✅ Sí | Categoría asignada | Dropdown usa `position="popper"` para evitar solapamiento |
| **Precio Costo** | ✅ Sí | Precio de costo | - |
| **Precio Venta** | ✅ Sí | Precio de venta | - |
| **Stock** | ✅ Sí | Stock actual | - |
| **Stock Mínimo** | ✅ Sí | Stock mínimo para alerta | - |
| **Descripción** | ❌ No | Descripción opcional | - |
| **Ubicación** | ❌ No | Ubicación física | - |

**⚠️ REGLAS CRÍTICAS - NO REGRESAR:**
1. **EAN es el identificador principal**, no SKU
2. SKU es completamente opcional (sin asterisco, sin required)
3. Proveedor es obligatorio (relación a tabla `supplier`) - siempre tener "Sin especificar" en seed
4. Dropdown de categorías: usar `position="popper"` y `z-50` para evitar solapamiento en modal
5. Formulario orden: EAN → Nombre → SKU → Proveedor → Categoría → Precios → Stock → Descripción → Ubicación

```typescript
interface Product {
  id: string;              // UUID interno
  barcode: string;         // EAN/Barcode (OBLIGATORIO)
  name: string;            // Nombre descriptivo (OBLIGATORIO)
  sku?: string;            // SKU opcional
  supplierId?: string;      // FK a tabla Supplier (OBLIGATORIO)
  categoryId: string;      // Categoría (OBLIGATORIO)
  costPrice: number;       // Precio de costo (OBLIGATORIO)
  replacementCost: number;       // Costo de reposición (OBLIGATORIO)
  stock: number;           // Stock actual (OBLIGATORIO)
  minStock: number;        // Stock mínimo (OBLIGATORIO)
  description?: string;    // Descripción opcional
  location?: string;       // Ubicación opcional
  isActive: boolean;       // Activo/inactivo
}
```

**FUERA DE MVP**: Importación masiva, múltiples proveedores, variantes, fotos de producto.

### 2. Gestión de Categorías

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **CRUD Categorías** | P0 | Crear/editar categorías |
| **Margen por categoría** | P1 | Margen sugerido al crear producto |

Categorías iniciales sugeridas:
- Iluminación LED
- Estética (vinilos, polarizados)
- Tratamientos Cerámicos
- Accesorios Varios
- Limpieza Detallada

### 3. Facturación AFIP (Crítico)

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Factura B (CF)** | P0 | Consumidor final - 90% de ventas |
| **Factura A (RI)** | P1 | Responsables inscriptos |
| **Nota de Crédito** | P1 | Devoluciones |
| **Integración AFIP WS** | P0 | CAE automático |
| **Puntos de venta** | P0 | Configurar nro punto venta |
| **Cierre Z diario** | P1 | Cierre de jornada fiscal |

#### Flujo Facturación:
```
1. Seleccionar cliente (o consumidor final)
2. Agregar items (productos)
3. Calcular totales (subtotal + IVA)
4. Solicitar CAE a AFIP
5. Generar PDF/imprimir
6. Registrar en libro IVA
```

**FUERA DE MVP**: Notas de débito, factura electrónica por email, múltiples impresoras fiscales.

### 4. Cierre de Caja

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Apertura caja** | P0 | Monto inicial del día |
| **Registro ventas** | P0 | Automático desde facturas |
| **Registro gastos** | P0 | Gastos menores (envases, delivery, etc) |
| **Cierre caja** | P0 | Arqueo: ventas - gastos = efectivo |
| **Reporte simple** | P1 | PDF del cierre |

#### Métodos de Pago (MVP):
- Efectivo
- Transferencia
- Débito/Crédito (si hay POS)

**FUERA DE MVP**: Múltiples cajas, cajas por sucursal, anticipos, fiado.

### 5. Ventas Rápidas (Mostrador)

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Buscador productos** | P0 | Por nombre o SKU |
| **Carrito simple** | P0 | Agregar/quitar items |
| **Cálculo automático** | P0 | Subtotal, IVA, total |
| **Facturación directa** | P0 | Facturar al finalizar |
| **Ticket simple** | P1 | Impresión comanda |

#### UI Prioridad: Velocidad
- Pantalla táctil friendly
- Atajos de teclado
- Búsqueda predictiva

#### Estado de Implementación
- ✅ **Componente QuickSaleModal** implementado en `/components/dashboard/QuickSaleModal.tsx`
- ✅ **Acceso desde Dashboard**: Botón "Venta Rápida" en header del dashboard (`/adm`)
- ✅ **Acceso desde CRUD Productos**: Botón "Venta Rápida" en header del CRUD de productos (`/adm/products`)
- ✅ **Flujo completo**: Búsqueda → Selección → Carrito → Cliente → Pagos → Confirmación
- ✅ **Integración con Cash Movement**: Cada pago genera automáticamente un registro en `cash_movement`
- ✅ **Soporte para listas de precios**: Cálculo dinámico de precios según lista seleccionada

### 5. Auditoría de Stock (Traza)

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Historial movimientos** | P1 | Tabla con traza completa del producto |
| **Ajustes manuales con comentario** | P1 | Solo ADMIN puede ajustar, obligatorio motivo desde select |
| **Registro automático** | P0 | Ventas, recepciones y ajustes generan movimiento automático |
| **Filtros por fecha** | P2 | Rango de fechas, tipo de movimiento |
| **Exportar CSV** | P2 | Exportar historial del producto |

#### Vista: Traza de Producto

**Ubicación**: Lista de productos (`adm/products`) → Botón "📋 Historial" en cada fila → Modal/Drawer con tabla de movimientos.

**Formato de fila:**
```
25/03/2026 15:22 | Germán Aliprandi (avatar) | Salida | -2 | 15→13
```

**UI:**
- Botón `History` (icono reloj o lista) en columna Acciones de la tabla de productos
- Modal lateral (drawer) o Dialog centrado con:
  - Header: Nombre del producto + stock actual
  - Tabla con scroll infinito (paginado)
  - Filtros rápidos: "Todas" | "Entradas" | "Salidas" | "Ajustes"
  - Botón "Exportar CSV"

**Columnas:**
| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| **Fecha/Hora** | `DD/MM/YYYY HH:MM` | `25/03/2026 15:22` |
| **Usuario** | Nombre + avatar | `Germán Aliprandi` |
| **Tipo** | Badge color | `Entrada` / `Salida` / `Ajuste` |
| **Cantidad** | Número con signo | `+10` / `-2` |
| **Stock** | Antes → Después | `5→15` |
| **Motivo** | Razón del movimiento | `Venta #45` / `Recepción proveedor` |

**Tipos de movimiento:**
- `Entrada` (verde): Recepción de mercadería, devoluciones
- `Salida` (rojo): Ventas, mermas
- `Ajuste` (amarillo): Correcciones de inventario físico, carga inicial

**Motivos predefinidos (UI dropdown):**
```typescript
const MOVEMENT_REASONS = [
  { value: 'VENTA', label: 'Venta', editable: false },           // Auto
  { value: 'RECEPCION', label: 'Recepción proveedor' },
  { value: 'AJUSTE_INVENTARIO', label: 'Ajuste inventario físico' },
  { value: 'MERMA', label: 'Merma / Daño' },
  { value: 'DEVOLUCION', label: 'Devolución cliente' },
  { value: 'CARGA_INICIAL', label: 'Carga inicial' },
] as const;
```

**Reglas de negocio:**
- Todo cambio de stock debe generar un `StockMovement`
- Editar stock desde formulario de producto = ajuste automático con motivo `AJUSTE_INVENTARIO`
- Motivos `VENTA` solo generados automáticamente por el sistema
- Movimientos son **inmutables** (no editar/eliminar)

#### Permisos

| Acción | Roles | Notas |
|--------|-------|-------|
| Ver traza | SELLER, ADMIN | Solo lectura para ambos roles |
| Crear ajuste manual | ADMIN | Obligatorio motivo desde select |
| Editar/eliminar movimiento | Ninguno | Auditoría inmutable |

---

#### API Endpoint
```
GET /api/products/:id/movements
Response: {
  movements: [
    {
      id: string,
      date: "2026-03-25T15:22:00Z",
      user: { name: "Germán Aliprandi", avatar: "..." },
      type: "OUT" | "IN" | "ADJUSTMENT",
      quantity: -2,
      previousStock: 15,
      newStock: 13,
      reason: "Venta #45"
    }
  ]
}
```

---

### Flujo 1: Venta en Mostrador (caso más frecuente)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Vendedor   │───▶│  Búsqueda   │───▶│   Carrito   │───▶│  Facturar   │
│  inicia     │    │  producto   │    │  (items)    │    │  (CF/RI)    │
│  venta      │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                                 │
                            ┌────────────────────────────────────┘
                            ▼
                     ┌─────────────┐
                     │   Cierre    │
                     │   entrega   │
                     │   + cobro   │
                     └─────────────┘
```

Tiempo objetivo: < 2 minutos desde búsqueda hasta factura.

### Flujo 2: Control de Stock

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Admin      │───▶│ Vé productos│───▶│  Revisa     │
│  accede     │    │  bajo stock │    │  alertas    │
│  stock      │    │             │    │             │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                              │
                     ┌────────────────────────┘
                     ▼
              ┌─────────────┐
              │  Genera     │
              │  pedido a   │
              │  proveedor  │
              └─────────────┘
```

### Flujo 3: Cierre de Jornada

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Cajero/    │───▶│  Sistema    │───▶│  Ingresa    │───▶│  Genera     │
│  Admin      │    │  muestra    │    │  conteo     │    │  reporte    │
│  inicia     │    │  ventas del │    │  real       │    │  cierre     │
│  cierre     │    │  día        │    │  (arqueo)   │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Modelo de Datos MVP

> **NOTA**: Este diagrama es una representación conceptual del MVP. Para el esquema de base de datos actual y definitivo, consulte `prisma/schema.prisma`. La implementación real utiliza convención **snake_case** para todas las tablas (ej: `payment_method`, `direct_sale`, `cash_movement`, `invoice`). Ver sección "Estado de Implementación" al final de este documento.

### Entidades Core

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    PRODUCT      │       │    CATEGORY     │       │    INVOICE      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (SKU)        │◄──────┤ id              │       │ id              │
│ name            │       │ name            │       │ invoiceNumber   │
│ categoryId      │       │ defaultMargin%  │       │ type (A/B)      │
│ costPrice       │       │ isActive        │       │ customerName    │
│ replacementCost │       └─────────────────┘       │ customerDoc     │
│ stock           │       ┌─────────────────┐       │ date            │
│ minStock        │       │  INVOICE_ITEM   │       │ subtotal        │
│ supplierId      │       │                 │       │                 │
│ (FK a Supplier) │◄──────┤  invoiceId      │       │ caeCode         │
└─────────────────┘       │ productId       │◄──────┤ caeCode         │
                          │ quantity        │       │ caeExpiry       │
┌─────────────────┐       │ unitPrice       │       │ paymentMethod   │
│   CASH_REGISTER │       │ subtotal        │       │ status          │
├─────────────────┤       └─────────────────┘       └─────────────────┘
│ id              │
│ date            │       ┌─────────────────┐
│ openingAmount   │       │     USER        │
│ closingAmount   │       ├─────────────────┤
│ totalSales      │       │ id              │
│ totalExpenses   │       │ email           │
│ difference      │       │ name            │
│ status          │       │ role            │
│ userId          │◄──────┤ isActive        │
└─────────────────┘       └─────────────────┘
```

---

## API Endpoints Fase 1

### Productos
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/products` | GET | Listar productos con filtros | SELLER, ADMIN |
| `/api/products` | POST | Crear producto | ADMIN |
| `/api/products/:id` | GET | Obtener producto | SELLER, ADMIN |
| `/api/products/:id` | PUT | Actualizar producto | ADMIN |
| `/api/products/:id` | DELETE | Desactivar producto | ADMIN |
| `/api/products/low-stock` | GET | Productos bajo stock mínimo | SELLER, ADMIN |
| `/api/products/:id/movements` | GET | Historial de movimientos del producto | SELLER, ADMIN |
| `/api/products/obsoletes` | GET | Productos críticos sin ventas 90 días (para eliminar) | ADMIN |

### Categorías
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/categories` | GET | Listar categorías | Todos |
| `/api/categories` | POST | Crear categoría | ADMIN |
| `/api/categories/:id` | PUT | Actualizar categoría | ADMIN |
| `/api/categories/:id` | DELETE | Eliminar categoría | ADMIN |

### Facturación
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/invoices` | GET | Listar facturas | SELLER, ADMIN |
| `/api/invoices` | POST | Crear factura (AFIP) | SELLER, ADMIN |
| `/api/invoices/:id` | GET | Obtener factura | SELLER, ADMIN |
| `/api/invoices/:id/pdf` | GET | Descargar PDF | SELLER, ADMIN |
| `/api/invoices/last-number` | GET | Último número usado | SELLER, ADMIN |

### Cierre de Caja
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/cash-register` | GET | Estado caja actual | ADMIN |
| `/api/cash-register/open` | POST | Abrir caja | ADMIN |
| `/api/cash-register/close` | POST | Cerrar caja | ADMIN |
| `/api/cash-register/expenses` | POST | Registrar gasto | ADMIN |

### Ventas Rápidas
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/quick-sale/calculate` | POST | Calcular totales | SELLER, ADMIN |
| `/api/quick-sale/search` | GET | Buscar productos | SELLER, ADMIN |

---

## UI/UX Prioridades

### Pantallas Obligatorias

1. **Login** - Simple, rápido
2. **Dashboard** - Resumen del día: ventas, alertas stock, **productos obsoletos**

#### Card: Productos Obsoletos (Dashboard)

**Ubicación**: Dashboard ADMIN - Card destacada en color naranja/amarillo.

**Criterio**: Productos con:
- Stock actual > 0 (tienen inventario ocupando espacio)
- Stock actual ≤ stock mínimo (están en nivel crítico)
- Última venta hace > 90 días (no rotan)

**Formato card:**
```
┌─────────────────────────────────────────┐
│ ⚠️ Productos Obsoletos       [Ver →]    │
│                                         │
│ 12 productos sin ventas en 90 días      │
│ Ocupando $45,000 en stock crítico       │
└─────────────────────────────────────────┘
```

**Click en card → Vista tabla:**
| Producto | Stock | Stock Min | Última Venta | Valor Stock | Acción |
|----------|-------|-----------|--------------|-------------|--------|
| Barra LED 20" | 3 | 5 | 15/01/2026 | $45,000 | [Eliminar] |
| Polarizado 3M | 2 | 3 | 10/12/2025 | $32,000 | [Eliminar] |

**Acciones:**
- Eliminar producto (desactivar)
- Ver traza completa
- Exportar lista CSV

---

3. **Venta Rápida** - Buscador + carrito + facturación
4. **Productos** - Lista con filtros, edición inline
5. **Stock** - Vista de alertas, ajustes simples
6. **Facturas** - Historial, reimpresión
7. **Cierre Caja** - Flujo guiado paso a paso

### Principios de Diseño
- **Velocidad sobre belleza**: Cada click cuenta en el mostrador
- **Táctil-first**: Botones grandes, campos espaciados
- **Offline-tolerante**: Si se cae internet, guardar local y sincronizar
- **Errores prevenidos**: Validaciones antes de enviar a AFIP

---

## Criterios de Éxito FASE 1

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| **Tiempo venta** | < 2 minutos | Promedio de transacciones |
| **Error facturación** | < 1% | Facturas rechazadas / Total |
| **Stock actualizado** | 100% | Diferencias inventario = 0 |
| **Adopción equipo** | > 90% | Transacciones en sistema / Total |
| **Días sin sistema viejo** | 0 | Sistema anterior desactivado |

---

## Dependencias Externas

| Servicio | Uso | Alternativa |
|----------|-----|-------------|
| **AFIP WS** | Facturación electrónica | Factura manual (no recomendado) |
| **Impresora fiscal** | Tickets fiscales | PDF + impresora común (temporal) |

---

## Post-MVP: Quick Wins (Semanas 3-4)

Una vez estable el MVP, agregar:

1. **Importación Excel** de productos (para carga inicial masiva)
2. **Búsqueda por código de barras** (con lector o cámara)
3. **Historial de precios** (quién cambió qué y cuándo)
4. **Reporte simple IVA** mensual
5. **Clientes frecuentes** con datos guardados

## Estado de Implementación (2026-04-06)

### Tablas de Soporte Implementadas

**cash_movement (Movimientos de Caja):** ✅
- Registra automáticamente ingresos cuando se crean pagos en ventas
- Soporta movimientos manuales (apertura, cierre, gastos)
- Servicio: `lib/services/cashMovementService.ts`
- API: `/api/cash-movements` (GET, POST), `/api/cash-movements/summary` (GET)

**invoice (Comprobantes):** ✅
- Tabla lista para integración AFIP
- Numeración automática por tipo de comprobante
- Servicio: `lib/services/invoiceService.ts`
- API: `/api/invoices` (GET, POST), `/api/invoices/[id]` (GET, PATCH)

### Integración con Ventas

**Direct Sales (Ventas Rápidas):**
- ✅ Al crear un pago → se crea automáticamente un `cash_movement` de tipo INCOME
- ⏳ Pendiente: Opción para crear `invoice` al finalizar venta
- ⏳ Pendiente: Integración AFIP para facturación fiscal

**Work Orders (Ventas desde Taller):**
- ✅ Pagos crean `cash_movement` automáticamente
- ✅ Sistema de pagos múltiples implementado
- ⏳ Pendiente: Opción para crear `invoice` al cerrar OT

### Flujo Actual (2026-04-06)

```
Venta → Pago → cash_movement (INCOME) → Caja actualizada
          ↓
      (pendiente) invoice (DRAFT) → AFIP → invoice (ISSUED)
```

### Pendientes Críticos

1. **Cierre de Caja (UI)**: Implementar interfaz que usa `/api/cash-movements/summary`
   - Backend listo (`cashMovementService.ts`)
   - Falta UI de arqueo en `/app/adm`

2. **Facturación AFIP**: Integrar creación de invoice en flujo de ventas
   - Modelo listo
   - Falta: Instalar afip.js, configurar certificados, implementar servicio CAE

3. **Ventas Rápidas (Carrito)**: Mejorar flujo actual
   - ✅ Modal básico implementado
   - ⏳ Pendiente: Carrito persistente, checkout completo

### Implementado

- ✅ Productos CRUD completo
- ✅ Categorías CRUD completo
- ✅ Proveedores CRUD completo
- ✅ Ventas rápidas (modal básico)
- ✅ Auditoría de stock (StockMovement)
- ✅ Listas de precios dinámicas
- ✅ Actualización masiva de costos
- ✅ Movimientos de caja (backend)

---
