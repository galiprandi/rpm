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
```typescript
interface Product {
  id: string;              // SKU único
  name: string;            // Nombre descriptivo
  category: Category;      // Categoría asignada
  costPrice: number;       // Precio de costo
  salePrice: number;       // Precio de venta
  stock: number;           // Stock actual
  minStock: number;        // Stock mínimo para alerta
  supplier?: string;       // Proveedor (opcional MVP)
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

---

## Flujos de Usuario MVP

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

### Entidades Core

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    PRODUCT      │       │    CATEGORY     │       │    INVOICE      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (SKU)        │◄──────┤ id              │       │ id              │
│ name            │       │ name            │       │ invoiceNumber   │
│ categoryId      │       │ defaultMargin%  │       │ type (A/B)      │
│ costPrice       │       │ isActive        │       │ customerName    │
│ salePrice       │       └─────────────────┘       │ customerDoc     │
│ stock           │       ┌─────────────────┐       │ date            │
│ minStock        │       │  INVOICE_ITEM   │       │ subtotal        │
│ supplier        │       ├─────────────────┤       │ taxAmount       │
│ isActive        │◄──────┤  invoiceId      │       │ total           │
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
2. **Dashboard** - Resumen del día: ventas, alertas stock
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
