🚦 Estado: 🔴 No iniciado

# Integración AFIP y Comprobantes Fiscales

## 1. Propósito / Alcance

Este módulo gestiona el ciclo completo de comprobantes del sistema: desde la generación automática de comprobantes preliminares (pre-facturas) en cada venta u OT, hasta la oficialización fiscal ante AFIP mediante el Web Service de Facturación Electrónica (wsfe).

El sistema permite al usuario mantener visibilidad sobre qué comprobantes han sido oficializados y cuáles no, enviar comprobantes a AFIP individualmente o en lote, y gestionar la totalidad del ciclo de vida de cada comprobante.

**Emisor:** Responsable Inscripto (RI)
**Punto de venta:** Único
**Alicuotas IVA:** 21% y 10.5%
**Percepciones:** No se aplican inicialmente. Se deja la estructura preparada para futura implementación.

---

## 2. Tipos de Comprobante

### 2.1 Clasificación

| Código | Tipo | Descripción | Va a AFIP |
|--------|------|-------------|-----------|
| `X_A` | Pre-Factura A | Comprobante preliminar para cliente RI | No (inicialmente) |
| `X_B` | Pre-Factura B | Comprobante preliminar para consumidor final | No (inicialmente) |
| `X_C` | Pre-Factura C | Comprobante preliminar (futuro, si cambia régimen) | No (inicialmente) |
| `FACTURA_A` | Factura A | Comprobante oficializado con CAE | Sí |
| `FACTURA_B` | Factura B | Comprobante oficializado con CAE | Sí |
| `FACTURA_C` | Factura C | Comprobante oficializado con CAE (futuro) | Sí |
| `NOTA_CREDITO_X_A` | Nota de Crédito preliminar A | Anulación parcial/total de factura A pendiente | No (inicialmente) |
| `NOTA_CREDITO_X_B` | Nota de Crédito preliminar B | Anulación parcial/total de factura B pendiente | No (inicialmente) |
| `NOTA_CREDITO_A` | Nota de Crédito A | NC oficializada con CAE | Sí |
| `NOTA_CREDITO_B` | Nota de Crédito B | NC oficializada con CAE | Sí |
| `PRESUPUESTO` | Presupuesto | Documento de cotización para cliente | No |
| `REMITO` | Remito | Documento de entrega de mercadería | No |

### 2.2 Determinación automática del tipo

El tipo de comprobante (A, B o C) se determina automáticamente según los datos del cliente:

- **Cliente con CUIT y RI** → Comprobante A
- **Cliente con DNI y Consumidor Final** → Comprobante B
- **Cliente sin datos fiscales** → Comprobante B (por defecto)

> La determinación se basa en `customer.billingData.invoiceType`. Si el cliente tiene `invoiceType: "A"`, se genera A. Si tiene "B", se genera B. Si no tiene billingData, se asume B.

### 2.3 Leyenda obligatoria en pre-facturas

Todo comprobante tipo X (pre-factura) debe incluir la leyenda:

> **"No válido como comprobante fiscal"**

Esta leyenda aparece en:
- El PDF imprimible
- La vista detalle del comprobante en el panel admin
- Cualquier representación visual del comprobante

---

## 3. Estados del Ciclo de Vida

```
                    ┌──────────────────────────────────────────────────┐
                    │                                                  │
                    ▼                                                  │
              ┌──────────┐     ┌───────────┐     ┌────────────┐       │
  Venta/OT →  │  DRAFT   │ ──> │  PENDING  │ ──> │  ISSUED    │       │
              │ (auto)   │     │ (en lote) │     │ (con CAE)  │       │
              └──────────┘     └───────────┘     └────────────┘       │
                    │                │                     │          │
                    │                ▼                     │          │
                    │          ┌───────────┐               │          │
                    │          │ REJECTED  │ ──────────────┘          │
                    │          │ (corregir)│                          │
                    │          └───────────┘                          │
                    │                                           │
                    ▼                                           ▼
              ┌──────────┐                               ┌────────────┐
              │ CANCELLED│                               │  ANNULLED  │
              │ (antes)  │                               │ (NC emitida)│
              └──────────┘                               └────────────┘
```

| Estado | Descripción | ¿Tiene CAE? | ¿Modificable? |
|--------|-------------|-------------|---------------|
| `DRAFT` | Generado automáticamente, pendiente de revisión | No | Sí |
| `PENDING` | Enviado a AFIP, esperando respuesta | No | No |
| `ISSUED` | Oficializado con CAE | Sí | No (anular con NC) |
| `REJECTED` | AFIP rechazó el envío | No | Sí (corregir y reintentar) |
| `CANCELLED` | Cancelado antes de oficializar | No | No |
| `ANNULLED` | Anulado después de oficializar mediante NC | Sí (CAE original) | No |

---

## 4. Numeración

### 4.1 Pre-facturas (tipo X)

- Numeración propia e independiente: `X-0001-00000001`
- Prefijo `X` para distinguir de comprobantes oficiales
- Secuencia por tipo: `X_A`, `X_B`, `X_C` cada una con su propio contador
- Asignada por el sistema al crear el comprobante
- **No requiere consulta a AFIP**

### 4.2 Comprobantes oficiales (Factura A/B/C, NC A/B)

- Formato AFIP: `PV-TIPO-NUMERO` (ej: `0001-00000001`)
- PV = Punto de venta configurado (único)
- El sistema consulta a AFIP el último número autorizado para ese PV + tipo
- Propone último + 1 y envía junto con los datos del comprobante
- AFIP valida y autoriza (devuelve CAE) o rechaza
- **El número definitivo se asigna al recibir el CAE**

### 4.3 Presupuestos y Remitos

- Numeración propia: `PRES-0001`, `REM-0001`
- No van a AFIP
- Secuencia independiente por tipo

### 4.4 Race condition

La numeración debe usar `prisma.$transaction` con `SELECT FOR UPDATE` o un mecanismo de lock para evitar duplicados en envíos concurrentes a AFIP. El sistema debe garantizar que dos comprobantes no obtengan el mismo número.

---

## 5. Flujo de Generación Automática

### 5.1 Venta Directa (mostrador)

```
Usuario confirma venta
    → directSaleService.createDirectSale()
    → Descuenta stock (transaccional)
    → Registra pago / movimiento de caja
    → Genera pre-factura automática (tipo X_A o X_B según cliente)
    → Pre-factura en estado DRAFT
```

### 5.2 Orden de Trabajo (entrega)

```
Usuario marca OT como DELIVERED
    → workOrderService.markAsDelivered()
    → Genera pre-factura automática con items de la OT
    → Pre-factura en estado DRAFT
    → Vinculada a la OT (referenceId, referenceType: 'work_order')
```

### 5.3 Nota de Crédito

```
Usuario anula venta/OT (facturada o pre-facturada)
    → creditNoteService.createCreditNote()
    → Restituye stock si aplica (transaccional)
    → Genera NC preliminar (tipo X_A o X_B)
    → NC en estado DRAFT
    → Si la factura original está ISSUED → la NC debe oficializarse también
```

---

## 6. Oficialización (Envío a AFIP)

### 6.1 Desde la vista dedicada

- Vista: `/adm/invoices`
- Listado de comprobantes con filtros: tipo, estado, fecha, cliente
- Selección múltiple (checkboxes) para envío en lote
- Botón "Enviar a AFIP" habilitado solo para comprobantes en estado `DRAFT`
- Solo comprobantes tipo X (pre-facturas) pueden enviarse

### 6.2 Proceso de oficialización

```
Usuario selecciona N comprobantes DRAFT
    → Click "Enviar a AFIP"
    → Confirmación con resumen (cantidad, tipos, total)
    → Para cada comprobante:
        1. Cambiar estado a PENDING
        2. Consultar último número autorizado a AFIP (wsfe: FECompUltimoAutorizado)
        3. Construir payload con datos del comprobante + cliente
        4. Enviar a AFIP (wsfe: FECAESolicitar)
        5. Si OK → hidratar con CAE + vencimiento CAE + número oficial
            → Cambiar tipo de X_A → FACTURA_A (o X_B → FACTURA_B)
            → Estado: ISSUED
        6. Si ERROR → estado REJECTED + motivo de rechazo
            → Queda disponible para corregir y reintentar
```

### 6.3 Hidratación de datos fiscales

Al recibir el CAE, el comprobante se actualiza:

```
afipData = {
  cae: string,              // CAE asignado por AFIP
  caeVencimiento: date,     // Fecha de vencimiento del CAE
  numeroOficial: string,    // Número asignado (PV-TIPO-NUMERO)
  fechaProceso: date,       // Fecha de procesamiento por AFIP
  resultado: string,        // 'A' (aprobado) | 'R' (rechazado)
  observaciones?: array,    // Observaciones de AFIP si las hubiera
}
```

### 6.4 Comprobantes rechazados

- Estado: `REJECTED`
- Se muestra motivo de rechazo (de `afipData.observaciones` o error de AFIP)
- El usuario puede:
  - Corregir datos del comprobante (cliente, items, montos)
  - Reintentar envío (vuelve a `PENDING` → proceso normal)
  - Cancelar el comprobante (pasa a `CANCELLED`)

### 6.5 Indicador visual

| Estado | Badge | Color |
|--------|-------|-------|
| DRAFT | `X` + "Pendiente" | Amarillo |
| PENDING | "Enviando..." | Azul |
| ISSUED | CAE + "Oficializado" | Verde |
| REJECTED | "Rechazado" | Rojo |
| CANCELLED | "Cancelado" | Gris |
| ANNULLED | "Anulado" | Rojo oscuro |

---

## 7. Estructura de Datos

### 7.1 Modelo `invoice` (extender el existente)

```
model invoice {
  id            String       @id @default(cuid())
  number        String       @unique    // Número interno (X-0001-00000001 o 0001-00000001)
  type          String                  // X_A, X_B, X_C, FACTURA_A, FACTURA_B, FACTURA_C, NC_X_A, NC_X_B, NC_A, NC_B, PRESUPUESTO, REMITO
  referenceId   String                  // ID de la venta/OT vinculada
  referenceType String                  // 'work_order' | 'direct_sale' | 'credit_note'
  customerId    String?
  customerName  String
  customerDoc   String?                 // CUIT/DNI del cliente al momento de emisión
  customerDocType String?               // 'CUIT' | 'DNI' | 'SIN_DOC'
  subtotal      Decimal      @db.Decimal(10, 2)
  tax           Decimal?     @db.Decimal(10, 2)    // Total de IVA
  iva21         Decimal?     @db.Decimal(10, 2)    // IVA 21%
  iva105        Decimal?     @db.Decimal(10, 2)    // IVA 10.5%
  exemptions    Json?                  // Detalle de exentos si aplica
  perceptions   Json?                  // Percepciones (futuro) - estructura preparada
  total         Decimal      @db.Decimal(10, 2)
  afipData      Json?                  // { cae, caeVencimiento, numeroOficial, fechaProceso, resultado, observaciones }
  status        String                  // DRAFT | PENDING | ISSUED | REJECTED | CANCELLED | ANNULLED
  issuedAt      DateTime?               // Fecha de oficialización (cuando se obtiene CAE)
  createdAt     DateTime     @default(now())
  createdBy     String
  customer      customer?    @relation(fields: [customerId], references: [id])

  @@index([number])
  @@index([referenceId])
  @@index([status])
  @@index([type])
  @@index([issuedAt])
}
```

### 7.2 Configuración fiscal (tabla `Setting` key-value existente)

| Key | Descripción | Ejemplo |
|-----|-------------|---------|
| `afip_cuit` | CUIT del emisor | `30-12345678-9` |
| `afip_punto_venta` | Punto de venta | `1` |
| `afip_cert_path` | Ruta del certificado .p12 | `/certs/afip.p12` |
| `afip_cert_pass` | Password del certificado | (variable de entorno) |
| `afip_production` | Modo producción vs homologación | `false` |
| `afip_responsable` | Tipo de responsable | `RI` |

> **Seguridad:** `afip_cert_pass` debe almacenarse como variable de entorno, nunca en la base de datos. La configuración de UI muestra el campo como password y lo guarda en env vars.

---

## 8. Cálculo de Impuestos

### 8.1 Items con diferentes alicuotas

Cada item de la venta/OT puede tener una alicuota de IVA asignada:

| Alicuota | Código AFIP | Aplicación |
|----------|-------------|------------|
| 21% | 5 | Productos y servicios estándar |
| 10.5% | 4 | Servicios técnicos específicos |
| 0% (Exento) | 1 | Exentos |

### 8.2 Cálculo por comprobante

```
subtotal = Σ (precioUnitario * cantidad) por item
iva21 = Σ (item.subtotal * 0.21) para items con alicuota 21%
iva105 = Σ (item.subtotal * 0.105) para items con alicuota 10.5%
tax = iva21 + iva105
total = subtotal + tax + perceptions
```

### 8.3 Comprobante B (Consumidor Final)

En comprobante B, los montos incluyen IVA (no se desglosa):
- El subtotal y total se presentan como monto total incluido
- Internamente se calcula el IVA para reportar a AFIP
- La leyenda "Consumidor Final" aparece en el comprobante

### 8.4 Comprobante A (Responsable Inscripto)

En comprobante A, el IVA se desglosa:
- Subtotal gravado + IVA = Total
- Se detallan los importes por alicuota

---

## 9. Validación de Cliente (futuro)

### 9.1 Consulta al padrón (ws_sr_padron)

- **Estado:** No implementado inicialmente. Se deja como mejora futura.
- **Objetivo:** Validar que el CUIT del cliente existe en AFIP y obtener su tipo de responsable.
- **Cuándo:** Al oficializar un comprobante A (requiere cliente RI verificado).
- **Implementación:** `afipService.getCustomerTaxInfo(cuit)` → devuelve razón social, tipo de responsable, domicilio fiscal.

### 9.2 Validación mínima inicial

- Comprobante A: requiere `customer.billingData.cuit` presente
- Comprobante B: acepta DNI o sin documento
- Si el cliente no tiene CUIT y se intenta generar A → error con mensaje claro

---

## 10. PDFs Imprimibles

### 10.1 Requisitos por tipo

| Tipo | PDF obligatorio | Contenido |
|------|----------------|-----------|
| Pre-factura (X) | Sí | Items, montos, leyenda "No válido como comprobante fiscal" |
| Factura (A/B/C) | Sí | Items, montos, CAE, vencimiento CAE, datos del emisor |
| Nota de Crédito | Sí | Referencia a comprobante original, items, montos, CAE si oficializada |
| Presupuesto | Sí | Items, montos, validez, datos del cliente |
| Remito | Sí | Items, cantidades, origen, destino, firma |

### 10.2 Tecnología

- Generación server-side usando `@react-pdf/renderer` o librería similar
- Template por tipo de comprobante
- Descarga directa desde la vista detalle
- Botón de impresión en listado (individual)

---

## 11. Vista Dedicada `/adm/invoices`

### 11.1 Listado

- Tabla con columnas: Número, Tipo, Cliente, Fecha, Total, Estado, CAE (si tiene)
- Filtros: tipo, estado, rango de fechas, cliente
- Selección múltiple con checkboxes
- Búsqueda por número o cliente
- Badge de estado con color (ver sección 6.5)
- Letra X visible en comprobantes no oficializados

### 11.2 Acciones

| Acción | Scope | Descripción |
|--------|-------|-------------|
| "Enviar a AFIP" | Selección múltiple | Solo comprobantes DRAFT tipo X. Envío en lote. |
| "Ver detalle" | Individual | Vista completa del comprobante |
| "Descargar PDF" | Individual | Genera y descarga el PDF |
| "Corregir" | Individual | Solo REJECTED. Abre edición de datos. |
| "Cancelar" | Individual | Solo DRAFT. Pasa a CANCELLED. |
| "Anular" | Individual | Solo ISSUED. Genera NC vinculada. |

### 11.3 Vista detalle

- Header con tipo, número, estado (badge), CAE si tiene
- Datos del emisor (RPM)
- Datos del cliente (nombre, CUIT/DNI, dirección)
- Tabla de items (descripción, cantidad, precio unitario, alicuota IVA, subtotal)
- Totales: subtotal, IVA por alicuota, percepciones, total
- Botones: Descargar PDF, Enviar a AFIP (si DRAFT), Anular (si ISSUED)
- Historial de envíos a AFIP (fecha, resultado, observaciones)

---

## 12. Servicio `afipService.ts`

### 12.1 Responsabilidad

Capa de abstracción sobre los Web Services de AFIP. Todas las llamadas a AFIP pasan por este servicio.

### 12.2 Métodos

```typescript
// Consultar último número autorizado
async function getLastAuthorizedNumber(tipoComprobante: number, puntoVenta: number): Promise<number>

// Enviar comprobante a AFIP y obtener CAE
async function requestCAE(comprobante: AFIPComprobanteInput): Promise<AFIPResponse>

// Consultar padrón (futuro)
async function getCustomerTaxInfo(cuit: string): Promise<AFIPCustomerInfo>

// Verificar conectividad con AFIP
async function checkConnection(): Promise<boolean>
```

### 12.3 Librería

- `afip.js` (@nodeafips/afip.js o similar)
- Manejo de certificados .p12
- Soporte para modo homologación y producción
- Manejo de errores y reintentos

### 12.4 Mapeo de tipos AFIP

| Tipo interno | Código AFIP (CbteTipo) |
|--------------|----------------------|
| FACTURA_A | 1 |
| FACTURA_B | 6 |
| FACTURA_C | 11 |
| NOTA_CREDITO_A | 3 |
| NOTA_CREDITO_B | 8 |
| NOTA_CREDITO_C | 13 |

---

## 13. Fases de Implementación (Roadmap para Ana)

### Fase 1: Cimientos (sin AFIP)
- Extender modelo `invoice` con nuevos campos
- Tipos de comprobante X_A, X_B, X_C
- Generación automática de pre-facturas desde venta directa y OT
- Numeración de pre-facturas (prefijo X)
- Vista `/adm/invoices` con listado, filtros y badges
- Leyenda "No válido como comprobante fiscal" en pre-facturas

### Fase 2: Presupuestos y Remitos
- Tipo PRESUPUESTO con numeración propia
- Tipo REMITO con numeración propia
- Generación de presupuesto desde OT (antes de confirmar)
- Generación de remito desde venta/OT (entrega de mercadería)
- PDFs imprimibles para presupuesto y remito

### Fase 3: Cálculo de Impuestos
- Alicuotas 21% y 10.5% por item
- Cálculo de IVA desglosado (A) vs incluido (B)
- Campos `iva21`, `iva105`, `exemptions` en comprobante
- Estructura para percepciones (vacía, preparada para futuro)

### Fase 4: PDFs de Comprobantes
- PDF de pre-factura con leyenda obligatoria
- PDF de factura (con CAE cuando esté oficializada)
- PDF de nota de crédito
- Descarga desde vista detalle y listado

### Fase 5: Configuración Fiscal
- Sección fiscal en `/adm/settings`
- Campos: CUIT emisor, punto de venta, certificado, modo
- Validación de datos fiscales del emisor
- Test de conectividad con AFIP (homologación)

### Fase 6: Integración AFIP (wsfe)
- Instalar `afip.js`
- Implementar `afipService.ts`
- Envío individual a AFIP (FECAESolicitar)
- Consulta de último autorizado (FECompUltimoAutorizado)
- Hidratación con CAE + número oficial
- Transformación X_A → FACTURA_A al recibir CAE

### Fase 7: Envío en Lote
- Selección múltiple en vista `/adm/invoices`
- Envío masivo con reporte de resultados
- Manejo de aprobados y rechazados en lote
- Reintento individual para rechazados

### Fase 8: Notas de Crédito Fiscales
- NC preliminares (X_A, X_B) vinculadas a factura original
- Oficialización de NC ante AFIP
- Anulación de comprobantes ISSUED mediante NC

### Fase 9: Validación de Padrón (futuro)
- Consulta ws_sr_padron al oficializar comprobante A
- Validación de CUIT y tipo de responsable
- Auto-detección de tipo de factura según padrón

---

## 14. Restricciones

- **RES-01:** No se pueden eliminar comprobantes. Solo cancelar (DRAFT) o anular (ISSUED con NC).
- **RES-02:** Un comprobante ISSUED no puede modificarse. Solo se puede anular con NC.
- **RES-03:** Las pre-facturas (tipo X) pueden modificarse libremente mientras estén en DRAFT.
- **RES-04:** La modificación de una pre-factura que afecta inventario o caja debe aplicar los movimientos y comprobantes establecidos para ese fin (no bypass de servicios existentes).
- **RES-05:** No se puede enviar a AFIP un comprobante que no sea tipo X (pre-factura).
- **RES-06:** No se puede generar una factura oficial directamente. Siempre se genera pre-factura y luego se oficializa.
- **RES-07:** Las credenciales y certificados de AFIP nunca se almacenan en la base de datos. Van en variables de entorno.
- **RES-08:** El sistema debe funcionar completamente sin configuración AFIP (todas las operaciones generan pre-facturas, la oficialización es opcional).

---

## 15. Comportamiento Esperado y Casos Límite

- **Límite 1 - Stock insuficiente al generar pre-factura:** La pre-factura se genera igual (es un documento preliminar), pero se registra una alerta de stock negativo para revisión.
- **Límite 2 - Cliente sin CUIT intentando comprobante A:** Error claro: "El cliente no tiene CUIT cargado. Para comprobante A se requiere CUIT del cliente."
- **Límite 3 - AFIP caído durante envío:** El comprobante queda en PENDING. El sistema permite reintentar. No se pierde el comprobante.
- **Límite 4 - Lote con resultados mixtos:** Algunos aprobados, otros rechazados. Cada uno se procesa individualmente. Los aprobados pasan a ISSUED, los rechazados a REJECTED con motivo.
- **Límite 5 - Modificación de pre-factura con stock ya descontado:** La venta original ya descontó stock. Si se modifican items, se debe ajustar stock mediante movimientos de inventario (no recrear la venta).
- **Límite 6 - Anulación de factura oficializada:** Se genera NC tipo X vinculada, que luego se oficializa ante AFIP. La factura original pasa a ANNULLED pero conserva su CAE.

---

## 16. Dependencias Técnicas Clave

- **Tablas BD:** `invoice` (extendida), `customer.billingData`, `direct_sale`, `work_order`, `credit_note`
- **Servicios:** `invoiceService.ts` (extender), `afipService.ts` (nuevo), `directSaleService.ts` (modificar para auto-generar), `workOrderService.ts` (modificar para auto-generar), `creditNoteService.ts` (modificar para NC preliminares)
- **Rutas API:** `/api/invoices/*` (extender), `/api/afip/*` (nuevo)
- **Librerías:** `afip.js` (Fase 6), `@react-pdf/renderer` o similar (Fase 4)
- **Vistas:** `/adm/invoices` (nueva), `/adm/settings` (extender sección fiscal)

---

## 17. Relación con Otras Specs

- **[Sales and Billing](./sales-and-billing.md):** Las ventas directas ahora generan pre-facturas automáticamente. El flujo de caja no cambia.
- **[Workshop Management](./workshop-management.md):** La entrega de OT (estado DELIVERED) dispara la generación de pre-factura.
- **[Customers](./customers.md):** Los datos fiscales del cliente (`billingData`) determinan el tipo de comprobante.
- **[Backend Architecture](../architecture/backend-data-architecture.md):** Toda la lógica fiscal reside en `lib/services/`, no en API routes.
