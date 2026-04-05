# 🏢 Dominio de Negocio: RPM Accesorios y Equipamiento

## 1. Resumen del Negocio

| Atributo | Descripción |
|----------|-------------|
| **Razón Social** | RPM Accesorios y Equipamiento |
| **Antigüedad** | Más de 15 años de experiencia |
| **Tipo de Comercio** | Centro de instalación de accesorios vehiculares + Venta de productos |
| **Modelo de Negocio** | B2C (Business to Consumer) - Atención directa al público |
| **Rubro** | Accesorios y modificación de vehículos automotores |
| **Ubicación** | San Lorenzo 1462, San Miguel de Tucumán, Argentina |
| **Contacto** | +54 381 319-9647 / +54 9 381 319-9647 |
| **Alcance Inicial** | Sucursal única con capacidad de escalado |
| **Horario** | Lunes a viernes partido, sábados por la mañana |
| **Delivery** | Sí - Servicio de entrega a domicilio disponible |

## 2. Servicios Principales

### 2.1 Líneas de Negocio Core

| Categoría | Servicios/Productos | Margen Típico |
|-----------|---------------------|---------------|
| **Iluminación** | Luces Cree LED, faros antiniebla, barras LED, tiras LED | 40-60% |
| **Estética Vehicular** | Vinilos decorativos, vinilos de protección PPF, polarizados | 50-70% |
| **Tratamientos Cerámicos** | "Vidrio líquido" (selladores cerámicos/acrílicos) | 60-80% |
| **Limpieza Detallada** | Limpieza de ópticas, limpieza de motor, detailing | 50-60% |
| **Accesorios Varios** | Equipamientos off-road, snorkels, fenders, sobreperfiles | 30-50% |

### 2.2 Modelo de Servicio

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE ATENCIÓN RPM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CONSULTA/VENTA DIRECTA        2. INSTALACIÓN AGENDADA       │
│     ┌─────────────┐                  ┌─────────────┐           │
│     │ Cliente     │                  │ Cliente     │             │
│     │ llega o     │                  │ agenda      │             │
│     │ contacta    │                  │ turno       │             │
│     └──────┬──────┘                  └──────┬──────┘             │
│            │                                 │                  │
│            ▼                                 ▼                  │
│     ┌─────────────┐                  ┌─────────────┐           │
│     │ Asesoría    │                  │ Recepción   │             │
│     │ de producto │                  │ vehículo    │             │
│     │ (mostrador) │                  │ checklist   │             │
│     └──────┬──────┘                  └──────┬──────┘             │
│            │                                 │                  │
│            ▼                                 ▼                  │
│  ┌─────────────────┐                ┌─────────────────┐         │
│  │ VENTA INMEDIATA │                │ INSTALACIÓN     │         │
│  │ - Producto      │                │ - Trabajo       │         │
│  │ - Delivery      │                │   programado    │         │
│  │ - O retira      │                │ - Consumo       │         │
│  │                 │                │   stock           │         │
│  └────────┬────────┘                └────────┬────────┘         │
│           │                                 │                  │
│           └─────────────┬───────────────────┘                  │
│                         ▼                                      │
│                   ┌─────────────┐                              │
│                   │ FACTURACIÓN │                              │
│                   │ - AFIP      │                              │
│                   │ - Pago      │                              │
│                   └─────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Lógica de Negocio Central

### 3.1 Diferencia Clave: RPM vs Taller Mecánico Tradicional

| Aspecto | Taller Mecánico Tradicional | RPM (Centro de Accesorios) |
|---------|----------------------------|---------------------------|
| **Trabajo** | Reparaciones, mecánica, diagnóstico | Instalación de accesorios, estética |
| **Vehículo** | Puede quedar días desarmado | Generalmente trabajo en horas/same-day |
| **Productos** | Repuestos mecánicos, lubricantes | Accesorios, iluminación, estética |
| **Mano obra** | Compleja, por hora | Estandarizada por tipo de instalación |
| **Garantía** | Sobre reparación mecánica | Sobre producto Y sobre instalación |

### 3.2 Entidades Core del Negocio

| Entidad | Descripción | Reglas de Negocio |
|---------|-------------|-------------------|
| **Cliente** | Persona que compra/contrata | Puede tener múltiples vehículos. Datos fiscales según tipo factura |
| **Vehículo** | Automóvil/camioneta que recibe el servicio | Identificado por patente. Clasificación por tipo (auto/SUV/camioneta) |
| **Producto** | Accesorio físico en stock | SKU único. Control de stock con mínimos. Compatible con modelos |
| **Servicio** | Trabajo de instalación configurable | Lista de tareas + tiempo estimado + costo base. Puede incluir productos |
| **Orden de Trabajo (OT)** | Documento operativo del trabajo | Estados definidos. Vincula cliente, vehículo, productos y servicios |
| **Instalación** | Instancia específica de un servicio | Tipo de vehículo puede afectar dificultad/tiempo |
| **Presupuesto** | Propuesta antes de trabajar | Válido por X días. Aprobación explícita requerida |
| **Factura** | Comprobante fiscal AFIP | Tipos A (responsables inscriptos) y B (consumidor final) |

## 4. Clasificación de Vehículos (para Estimación de Trabajo)

| Tipo | Ejemplos | Factor Dificultad | Factor Tiempo |
|------|----------|-------------------|---------------|
| **Compacto** | Gol, Corsa, 208, Fiesta | 1.0x (base) | 1.0x |
| **Sedán/Mediano** | Vento, Cruze, Corolla | 1.1x | 1.1x |
| **SUV** | Kicks, HR-V, Tracker | 1.2x | 1.2x |
| **Pick-up Chica** | Strada, Saveiro, Oroch | 1.3x | 1.2x |
| **Pick-up Grande** | Hilux, Amarok, Ranger | 1.5x | 1.5x |
| **Camioneta/4x4** | SW4, Everest, Trailblazer | 1.6x | 1.6x |

> El factor afecta el tiempo estimado y puede impactar el costo de mano de obra

## 5. Flujo de Estados - Orden de Trabajo

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│PRESUPUE-│───▶│PRESUPUE-│───▶│  OT     │───▶│ TRABAJO │───▶│CONTROL  │
│STADO   │    │STADO   │    │CONFIRM-│    │EN CURSO │    │CALIDAD  │
│PENDIENTE│    │APROBADO │    │ADA     │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┬────┘
                                                                  │
    ┌─────────────────────────────────────────────────────────────┘
    ▼
┌─────────┐    ┌─────────┐
│ LISTO   │───▶│ENTREGADO│
│         │    │         │
└─────────┘    └─────────┘
```

### Estados y Reglas:

| Estado | Descripción | Próximos Estados | Permisos |
|--------|-------------|------------------|----------|
| **Presupuesto Pendiente** | Aguardando aprobación del cliente | Aprobado, Cancelado | Vendedor/Admin |
| **Presupuesto Aprobado** | Cliente confirmó, listo para trabajar | OT Confirmada | Vendedor/Admin |
| **OT Confirmada** | Trabajo agendado, esperando vehículo | En Curso | Técnico/Admin |
| **Trabajo en Curso** | Instalación en progreso | Control Calidad | Técnico |
| **Control de Calidad** | Verificación post-trabajo | Listo, Volver a Curso | Técnico/Admin |
| **Listo** | Trabajo terminado, aguardando pago/entrega | Entregado | Admin |
| **Entregado** | Vehículo devuelto, factura emitida | (final) | Admin |
| **Cancelado** | Presupuesto rechazado o anulado | (final) | Admin |

## 6. Cálculo de Precios

### 6.1 Fórmula: Precio de Venta de Productos

```
Precio Venta = Costo × (1 + Margen%)
```

- Margen configurable por producto y por categoría
- Alerta cuando margen real cae debajo del mínimo configurado (ej: 30%)
- Precios pueden tener promociones por período

### 6.2 Fórmula: Servicio de Instalación

```
Costo Servicio = Costo Base × Factor Vehículo
```

- Costo base definido por tipo de servicio (ej: instalación de barras LED)
- Factor según clasificación del vehículo
- Servicios pueden incluir productos automáticamente (kit)

### 6.3 Fórmula: Orden de Trabajo Completa

```
Total OT = Σ(Productos) + Σ(Servicios) + Descuentos + Impuestos
```

## 7. Stock y Reposición

### 7.1 Niveles de Alerta

| Estado | Condición | Acción | Color |
|--------|-----------|--------|-------|
| **Normal** | Stock disponible > Mínimo | Ninguna | 🟢 |
| **Comprometido** | Parte del stock en OTs activas | Mostrar disponible real | 🟡 |
| **Bajo** | Stock ≤ Mínimo | Alerta visual + reporte reposición | 🟠 |
| **Crítico** | Stock = 0 | Bloqueo de venta (con override admin) | 🔴 |

### 7.2 Tipos de Movimiento de Stock

| Tipo | Descripción | Impacto Stock |
|------|-------------|---------------|
| **Compra Proveedor** | Entrada de mercadería | +Stock |
| **Consumo OT** | Producto usado en instalación | -Stock |
| **Venta Directa** | Producto vendido sin instalación | -Stock |
| **Ajuste** | Corrección inventario | ±Stock |
| **Devolución Cliente** | Producto devuelto (garantía) | +Stock (opcional) |
| **Transferencia** | Entre sucursales (futuro) | ±Stock según origen/destino |

## 8. Garantías y Post-Venta

### 8.1 Tipos de Garantía

| Tipo | Cobertura | Plazo Típico | Registro |
|------|-----------|--------------|----------|
| **Producto** | Defecto de fábrica | Según fabricante | En OT |
| **Instalación** | Error en montaje | 30-90 días | En OT |
| **Tratamiento Cerámico** | Durabilidad prometida | 6-12 meses | En OT + foto |

### 8.2 Flujo de Garantía

```
Reclamo → Evaluación → (Aprobado → Re-trabajo/Cambio) o (Rechazado → Cierre)
           ↓
      Nota de Crédito (si aplica)
```

## 9. Integración Fiscal (AFIP)

### 9.1 Tipos de Comprobantes

| Tipo | Uso | Requisitos Emisor | Límite Fact B |
|------|-----|-------------------|---------------|
| **Factura A** | Responsables inscriptos | CUIT, Razón social | - |
| **Factura B** | Consumidor final | DNI (opcional) | $X por resol. AFIP |
| **Factura M** | Monotributistas | - | Según categoría |
| **Nota Crédito** | Devoluciones/rechazos | Factura original asociada | - |
| **Nota Débito** | Ajustes en aumento | Factura original asociada | - |

### 9.2 Datos Obligatorios por Comprobante

- CAE (Código de Autorización Electrónica)
- Vencimiento CAE
- Número de comprobante
- Punto de venta electrónico
- QR AFIP

## 10. KPIs de Negocio (Métricas Clave)

| KPI | Fórmula | Objetivo | Frecuencia |
|-----|---------|----------|------------|
| **Ticket Promedio** | Total facturado / Cantidad transacciones | >$XX.XXX | Diario/Mensual |
| **Conversión Presupuestos** | OTs confirmadas / Presupuestos emitidos | >60% | Mensual |
| **Rotación de Stock** | Costo vendido / Stock promedio | >4 por año | Trimestral |
| **Tiempo Promedio OT** | Horas totales OT / Cantidad OTs | <4 horas | Semanal |
| **Margen Promedio** | (Venta - Costo) / Venta | >40% | Mensual |
| **Tasa de Re-trabajos** | OTs con garantía ejercida / Total OTs | <5% | Mensual |
| **Ocupación Técnica** | Horas trabajadas / Horas disponibles | >75% | Semanal |

## 11. Roles y Permisos de Negocio

| Rol | Funciones | Restricciones |
|-----|-----------|---------------|
| **Administrador** | Configuración, precios, reportes, cancelaciones | Ninguna |
| **Vendedor** | Atención al público, presupuestos, ventas directas, turnos | No modifica stock físico, no factura |
| **Técnico Instalador** | Recibe vehículo, realiza instalaciones, QC | No precios, no facturación |
| **Cajero** (futuro) | Facturación, cobros, cierre de caja | No stock, no técnicos |
| **Depósito** (futuro) | Recepción mercadería, ajustes stock, picking | No ventas, no clientes |

## 12. Escalabilidad Futura

### 12.1 Multi-sucursal

- Cada transacción vinculada a sucursal origen
- Stock puede ser:
  - **Independiente**: Cada sucursal gestiona su propio inventario
  - **Compartido**: Stock central con reservas por sucursal

### 12.2 E-commerce Básico

- Catálogo público de productos
- Carrito con opción de "instalación en sucursal"
- No venta online con envío (modelo consultado en mostrador)

### 12.3 App para Técnicos

- Ver OTs asignadas
- Cambiar estados
- Fotos antes/después
- Consumo de stock por escaneo

## 13. Términos y Glosario

| Término | Significado |
|---------|-------------|
| **OT** | Orden de Trabajo - documento operativo central |
| **Presupuesto** | Propuesta de trabajo con precios estimados |
| **SKU** | Código único de producto (Stock Keeping Unit) |
| **PPF** | Paint Protection Film - vinilo de protección de pintura |
| **Cree LED** | Tecnología de iluminación LED de alta potencia |
| **Vidrio líquido** | Sellador cerámico/acrílico para pintura |
| **CAE** | Código de Autorización Electrónica (AFIP) |
| **QC / Control Calidad** | Verificación post-trabajo antes de entrega |
| **Factor vehículo** | Multiplicador de dificultad según tipo de vehículo |

## 14. Diferenciadores Competitivos Detectados

| Aspecto | Situación Actual | Oportunidad con Sistema |
|---------|------------------|-------------------------|
| **Atención al cliente** | Críticas sobre trato | CRM con historial permite atención personalizada |
| **Seguimiento** | Sin visibilidad del proceso | Tracking de OT en tiempo real |
| **Garantías** | Conflictos post-venta | Registro estructurado con fotos y términos claros |
| **Profesionalismo** | Percepción de informalidad | Presupuestos digitales, facturación ágil |
| **Tiempos** | Espera sin información | Agenda de turnos con estimaciones precisas |

## 15. Importador de Productos - Nuevo Módulo

### 15.1 Contexto del Negocio
RPM maneja un catálogo de **2000+ productos** accesorios vehiculares con actualizaciones periódicas:
- **Proveedores**: 15-20 proveedores principales con catálos en CSV/Excel
- **Frecuencia**: Actualizaciones de precios y productos cada 2-3 meses
- **Problema actual**: Carga manual de productos es lenta y propensa a errores

### 15.2 Flujo de Importación Implementado

```
┌─────────────────────────────────────────────────────────────┐
│                IMPORTADOR DE PRODUCTOS RPM                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Paso 1: Cargar CSV    Paso 2: Mapear    Paso 3: Revisar   │
│  ┌─────────────┐      ┌─────────────┐    ┌─────────────┐    │
│  │ Dropzone    │      │ Columnas    │    │ Validación │    │
│  │ Auto-detect│  →   │ ↔ Campos    │ →  │ Preview    │    │
│  │ encoding   │      │ Transform  │    │ Stats      │    │
│  └──────┬──────┘      └──────┬──────┘    └──────┬──────┘    │
│         │                   │                  │            │
│         ▼                   ▼                  ▼            │
│  Paso 4: Importar     Datos Listos      Reporte Final    │
│  ┌─────────────┐      ┌─────────────┐    ┌─────────────┐    │
│  │ Batch       │      │ Productos   │    │ Estadísticas│    │
│  │ Processing  │      │ Categorías  │    │ Descargable │    │
│  │ Progress    │      │ Precios     │    │ CSV/Excel   │    │
│  └─────────────┘      └─────────────┘    └─────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 15.3 Campos del Modelo Product Mapeables

| Campo Product | Origen CSV Típico | Transformación | Requerido |
|---------------|-------------------|----------------|-----------|
| `name` | PRODUCTO, DESCRIPTOR, ARTÍCULO | Capitalizar + Trim | ✅ |
| `sku` | SKU, CÓDIGO, REFERENCIA | Mayúsculas + Trim | ❌ |
| `barcode` | CÓDIGO BARRAS, EAN, GTIN | Trim | ❌ |
| `description` | DESCRIPCIÓN, DETALLE | Capitalizar + Trim | ❌ |
| `costPrice` | PRECIO COMPRA, COSTO | Número ES → Decimal(10,2) | ❌ |
| `replacementCost` | COSTO REPOSICIÓN, PRECIO REPOSICIÓN | Número ES → Decimal(10,2) | ❌ |
| `stock` | STOCK, CANTIDAD, UNIDADES | Entero | ❌ |
| `minStock` | STOCK MÍNIMO, MÍNIMO | Entero | ❌ |
| `location` | UBICACIÓN, SECTOR, ESTANTE | Mayúsculas + Trim | ❌ |
| `categoryId` | RUBRO, CATEGORÍA, LÍNEA | Match fuzzy con categorías | ❌ |

### 15.4 Reglas de Negocio Implementadas

#### Validaciones Críticas
- **Duplicados**: Detecta por `sku` o `name` exacto
- **Precios**: No permite valores negativos (convierte a 0)
- **Stock**: Opción de omitir productos con stock < 1
- **Categorías**: Creación automática de rubros no existentes

#### Transformaciones de Datos
- **Números españoles**: "1.234,56" → 1234.56
- **Capitalización**: "producto led" → "Producto Led"
- **Trim**: Elimina espacios en blanco al inicio/final

### 15.5 Impacto en Operaciones

| Métrica | Antes (Manual) | Después (Importador) | Mejora |
|---------|----------------|---------------------|---------|
| Tiempo carga 500 productos | 4-6 horas | 15-30 minutos | **90%+** |
| Errores de tipeo | 15-20% | <1% | **95%** |
| Actualización de precios | 2 días | 2 horas | **75%** |
| Consistencia datos | Baja | 100% | **Alta** |

### 15.6 Integración con el Sistema

#### API Endpoints
```typescript
POST /api/import/products/analyze    // Análisis inicial del CSV
POST /api/import/products/validate   // Validación completa
POST /api/import/products/execute     // Importación batch
```

#### Persistencia
- **localStorage**: Mapeo de columnas durante la sesión
- **Zustand**: Estado global del importador
- **Batch processing**: Chunks de 100 productos para no saturar

#### Reportes
- **Estadísticas**: Total creados, omitidos, errores
- **CSV de resultados**: Detalle fila por fila
- **Categorías creadas**: Listado de nuevas categorías

### 15.7 Casos de Uso Típicos

#### 1. Actualización de Catálogo Proveedor
```
CSV Proveedor → Mapeo automático → Validación → Importación
- 800 productos de iluminación Cree
- Precio costo y precio venta
- Categorías: "Faros LED", "Barras LED", "Tiras LED"
```

#### 2. Lote de Productos Nuevos
```
Excel compras → Mapeo manual → Revisión → Creación masiva
- 150 accesorios off-road
- Sin SKU existente
- Creación de 5 categorías nuevas
```

#### 3. Ajuste de Precios Masivo
```
CSV precios → Mapeo simple → Skip duplicados → Update only
- 2000 productos con nuevo precio lista
- Acción: "create_with_suffix" para nuevos
- Omitir productos sin cambios
```
