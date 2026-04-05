# 🗄️ Arquitectura de Datos - RPM

## Entidades Principales y Relaciones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DIAGRAMA ENTIDAD-RELACIÓN                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     USER        │     │    CUSTOMER     │     │    VEHICLE      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │◄────┤ id (PK)         │
│ email           │     │ fullName        │     │ licensePlate (U)│
│ name            │     │ phone           │     │ brand           │
│ role            │     │ phoneAlt        │     │ model           │
│ isActive        │     │ email           │     │ year            │
│ createdAt       │     │ documentType    │     │ type            │
│ updatedAt       │     │ documentNumber  │     │ color           │
└─────────────────┘     │ address         │     │ notes           │
                        │ notes           │     │ customerId (FK) │
                        │ isActive        │     │ createdAt       │
                        │ createdAt       │     │ updatedAt       │
                        │ updatedAt       │     └─────────────────┘
                        └─────────────────┘            │
                              │                        │
                              │   ┌────────────────────┘
                              │   │
                              ▼   ▼
                        ┌─────────────────┐
                        │   WORK_ORDER    │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ number (U)      │◄── OT-2024-0001
                        │ status          │
                        │ customerId (FK) │
                        │ vehicleId (FK)  │
                        │ technicianId(FK)│──────┐
                        │ quoteId (FK)    │◄────┐  │
                        │ invoiceId (FK)  │◄──┐ │  │
                        │ scheduledDate   │   │ │  │
                        │ startedAt         │   │ │  │
                        │ completedAt       │   │ │  │
                        │ deliveredAt       │   │ │  │
                        │ totalProducts     │   │ │  │
                        │ totalServices     │   │ │  │
                        │ total             │   │ │  │
                        │ notes             │   │ │  │
                        │ createdAt         │   │ │  │
                        │ updatedAt         │   │ │  │
                        └─────────────────┘   │ │  │
                               │                │ │  │
                               │   ┌────────────┘ │  │
                               │   │              │  │
                               ▼   ▼              │  │
                        ┌─────────────────┐       │  │
                        │ WORK_ORDER_ITEM │       │  │
                        ├─────────────────┤       │  │
                        │ id (PK)         │       │  │
                        │ workOrderId(FK) │       │  │
                        │ type            │       │  │
                        │ productId (FK)  │◄──────┘  │
                        │ serviceId (FK)  │◄─────────┘
                        │ quantity        │
                        │ unitPrice       │
                        │ subtotal        │
                        │ createdAt       │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    PRODUCT      │     │    SERVICE      │     │  CHECKLIST      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ sku (U)         │     │ name            │     │ workOrderId(FK) │
│ name            │     │ baseCost        │     │ type            │
│ description     │     │ timeMinutes     │     │ items           │
│ categoryId (FK) │◄────┤ vehicleFactor   │     │ completed       │
│ costPrice       │     │ description     │     │ notes           │
│ salePrice       │     │ isActive        │     │ createdAt       │
│ stock           │     │ createdAt       │     │ updatedAt       │
│ minStock        │     │ updatedAt       │     └─────────────────┘
│ supplier        │     └─────────────────┘
│ isActive        │
│ createdAt       │     ┌─────────────────┐
│ updatedAt       │     │  SERVICE_KIT    │
└─────────────────┘     ├─────────────────┤
       │                │ id (PK)         │
       │                │ serviceId (FK)  │◄────┐
       │                │ productId (FK)│◄────┼────┐
       │                │ quantity        │     │    │
       │                └─────────────────┘     │    │
       │                                         │    │
       ▼                                         │    │
┌─────────────────┐                               │    │
│    CATEGORY     │                               │    │
├─────────────────┤                               │    │
│ id (PK)         │                               │    │
│ name            │                               │    │
│ defaultMargin%  │                               │    │
│ isActive        │                               │    │
│ createdAt       │                               │    │
│ updatedAt       │                               │    │
└─────────────────┘                               │    │
                                                  │    │
┌─────────────────┐     ┌─────────────────┐     │    │
│    INVOICE      │     │  INVOICE_ITEM   │     │    │
├─────────────────┤     ├─────────────────┤     │    │
│ id (PK)         │     │ id (PK)         │     │    │
│ invoiceNumber(U)│     │ invoiceId (FK)  │     │    │
│ type            │     │ productId (FK)  │◄────┘    │
│ customerName    │     │ serviceId (FK)  │◄─────────┘
│ customerDoc     │     │ quantity        │
│ customerId (FK) │◄──┐ │ unitPrice       │
│ date            │   │ │ subtotal        │
│ subtotal        │   │ │ discount        │
│ taxAmount       │   │ │ taxRate         │
│ total           │   │ │ createdAt       │
│ caeCode         │   │ └─────────────────┘
│ caeExpiry       │   │
│ paymentMethod   │   │
│ workOrderId (FK)│◄──┘
│ status          │
│ notes           │
│ createdAt       │
│ updatedAt       │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  CASH_REGISTER  │     │  WEB_APPOINTMENT│
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ date            │     │ status          │
│ openingAmount   │     │ customerName    │
│ closingAmount   │     │ customerPhone   │
│ totalSales      │     │ customerEmail   │
│ totalExpenses   │     │ vehiclePlate    │
│ difference      │     │ vehicleBrand    │
│ expenses[]      │     │ vehicleModel    │
│ status          │     │ serviceType     │
│ userId (FK)     │◄────┤ notes           │
│ createdAt       │     │ requestedDate   │
│ updatedAt       │     │ requestedTime   │
└─────────────────┘     │ workOrderId (FK)│◄──┐
                        │ createdAt       │   │
                        │ confirmedAt     │   │
                        │ updatedAt       │   │
                        └─────────────────┘   │
                                              │
┌─────────────────┐     ┌─────────────────┐ │
│  CASH_EXPENSE   │     │  PUBLIC_GALLERY │ │
├─────────────────┤     ├─────────────────┤ │
│ id (PK)         │     │ id (PK)         │ │
│ cashRegisterId  │◄────┤ workOrderId (FK)│◄─┘
│ description     │     │ beforePhotoUrl  │
│ amount          │     │ afterPhotoUrl   │
│ category        │     │ description     │
│ receiptNumber   │     │ isPublic        │
│ createdAt       │     │ createdAt         │
└─────────────────┘     │ updatedAt         │
                        └─────────────────┘

┌─────────────────┐
│     BRANCH      │     (Fase 4+)
├─────────────────┤
│ id (PK)         │
│ name            │
│ address         │
│ phone           │
│ isMain          │
│ stockMode       │
│ isActive        │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
```

---

## Especificación Detallada de Entidades

### 1. USER (Usuarios del Sistema)

```typescript
interface User {
  id: string;              // UUID o nanoid
  email: string;           // Único, usado para login
  name: string;            // Nombre completo
  role: UserRole;          // 'ADMIN' | 'SELLER' | 'TECHNICIAN' | 'CASHIER'
  isActive: boolean;       // Soft delete
  passwordHash?: string;   // Si usa auth propio
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type UserRole = 'ADMIN' | 'SELLER' | 'TECHNICIAN' | 'CASHIER' | 'WAREHOUSE';
```

**Relaciones:**
- 1:N con `CASH_REGISTER` (quién abre/cierra caja)
- 1:N con `WORK_ORDER` (técnico asignado)

---

### 2. CUSTOMER (Clientes)

```typescript
interface Customer {
  id: string;
  fullName: string;        // Nombre completo
  phone: string;           // Principal (WhatsApp)
  phoneAlt?: string;       // Alternativo
  email?: string;
  documentType: 'DNI' | 'CUIT' | 'CUIL' | 'PASSPORT';
  documentNumber: string;  // Sin puntos ni guiones
  address?: string;
  notes?: string;          // Observaciones internas
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Validaciones:**
- `phone`: Formato argentino (+54 9 381 XXX XXXX)
- `documentNumber`: DNI = 7-8 dígitos, CUIT/CUIL = 11 dígitos
- `email`: Formato válido si existe

**Relaciones:**
- 1:N con `VEHICLE` (un cliente puede tener varios vehículos)
- 1:N con `WORK_ORDER` (historial de visitas)
- 1:N con `INVOICE` (facturas emitidas)

---

### 3. VEHICLE (Vehículos)

```typescript
interface Vehicle {
  id: string;
  licensePlate: string;    // Patente - ÚNICA (ej: ABC123, AB123CD)
  brand: string;           // Marca (Toyota, Ford, etc)
  model: string;           // Modelo (Hilux, Focus, etc)
  year: number;            // Año de fabricación
  type: VehicleType;       // Para cálculo de factor
  color?: string;          // Color (opcional)
  notes?: string;
  customerId: string;      // FK a Customer
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type VehicleType = 'COMPACT' | 'SEDAN' | 'SUV' | 'PICKUP_SMALL' | 'PICKUP_LARGE' | 'TRUCK_4X4';
```

**Validaciones:**
- `licensePlate`: Formato argentino viejo (ABC123) o nuevo (AB123CD)
- `year`: Entre 1990 y año actual + 1

**Relaciones:**
- N:1 con `CUSTOMER` (dueño)
- 1:N con `WORK_ORDER` (trabajos realizados)

---

### 4. PRODUCT (Productos)

```typescript
interface Product {
  id: string;              // SKU único (ej: LED-001, PPF-CAPOT)
  name: string;            // Nombre descriptivo
  description?: string;    // Descripción larga
  sku: string;             // Código interno único
  barcode?: string;         // Código de barras EAN/UPC
  costPrice: number;        // Precio de compra (10,2)
  replacementCost: number;        // Costo de reposición (10,2)
  stock: number;           // Unidades en depósito
  minStock: number;        // Stock mínimo para reposición
  location?: string;       // Ubicación en depósito (ej: A1-B2)
  categoryId: string;      // FK a Category
  supplier?: string;        // Nombre proveedor principal
  isActive: boolean;       // Producto activo/inactivo
  createdAt: Date;
  updatedAt: Date;
}
```

**Campos Importables desde CSV:**
- `name` → PRODUCTO, DESCRIPTOR, ARTÍCULO
- `sku` → SKU, CÓDIGO, REFERENCIA  
- `barcode` → CÓDIGO BARRAS, EAN, GTIN
- `costPrice` → PRECIO COMPRA, COSTO
- `replacementCost` → COSTO REPOSICIÓN, PRECIO REPOSICIÓN
- `stock` → STOCK, CANTIDAD, UNIDADES
- `minStock` → STOCK MÍNIMO, MÍNIMO
- `location` → UBICACIÓN, SECTOR, ESTANTE

**Validaciones de Negocio:**
```typescript
// Márgenes de rentabilidad
const margin = ((replacementCost - costPrice) / costPrice) * 100;
if (margin < 20) {
  console.warn('Margen bajo detectado:', margin + '%');
}

// Stock comprometido (en OTs activas)
const committedStock = await getCommittedStock(productId);

// Stock disponible real
const availableStock = stock - committedStock;

// Alerta de reposición
if (availableStock <= minStock) {
  await triggerReorderAlert(productId);
}
```

**Relaciones:**
- N:1 con `CATEGORY`
- 1:N con `WORK_ORDER_ITEM` (consumo en OTs)
- 1:N con `INVOICE_ITEM` (ventas)
- 1:N con `SERVICE_KIT` (productos incluidos en servicios)

**Importación Masiva:**
```typescript
interface ImportResult {
  stats: {
    attempted: number;      // Total filas procesadas
    created: number;        // Productos nuevos creados
    failed: number;         // Filas con errores
    skipped: number;        // Filas omitidas (duplicados, stock<1)
  };
  results: Product[];      // Productos exitosamente importados
  createdCategories: Category[]; // Categorías auto-creadas
  errors: ImportError[];   // Detalle de errores por fila
}
```

---

### 5. CATEGORY (Categorías de Productos)

```typescript
interface Category {
  id: string;
  name: string;            // Único (ej: "Iluminación LED")
  description?: string;
  defaultMarginPercent: number;  // Margen sugerido (ej: 40 = 40%)
  color?: string;          // Color para UI (hex)
  sortOrder: number;       // Orden en listas
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Categorías Iniciales Sugeridas:**
- Iluminación LED (40%)
- Estética Vehicular (50%)
- Tratamientos Cerámicos (60%)
- Limpieza Detallada (50%)
- Accesorios Off-Road (35%)

**Relaciones:**
- 1:N con `PRODUCT`

---

### 6. SERVICE (Servicios de Instalación)

```typescript
interface Service {
  id: string;
  name: string;            // Ej: "Instalación barras LED"
  description?: string;
  baseCost: number;        // Costo base (compacto)
  timeMinutes: number;     // Tiempo estimado base
  vehicleFactors: {        // Multiplicadores por tipo
    COMPACT: 1.0;
    SEDAN: 1.1;
    SUV: 1.2;
    PICKUP_SMALL: 1.3;
    PICKUP_LARGE: 1.5;
    TRUCK_4X4: 1.6;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Cálculo de Costo por Vehículo:**
```typescript
function calculateServiceCost(
  service: Service,
  vehicleType: VehicleType
): number {
  const factor = service.vehicleFactors[vehicleType];
  return Math.round(service.baseCost * factor);
}
```

**Relaciones:**
- 1:N con `WORK_ORDER_ITEM`
- 1:N con `SERVICE_KIT` (productos incluidos)
- 1:N con `INVOICE_ITEM`

---

### 7. SERVICE_KIT (Kits de Servicio)

Vincula servicios con productos que se consumen automáticamente.

```typescript
interface ServiceKit {
  id: string;
  serviceId: string;       // FK a Service
  productId: string;       // FK a Product
  quantity: number;        // Cantidad que se consume
  isOptional: boolean;     // ¿Es obligatorio o sugerido?
  createdAt: Date;
}
```

**Ejemplo:** Servicio "Instalación barras LED" incluye:
- 1 × Kit cableado específico
- 1 × Cinta aislante profesional
- 1 × Bracket universal

---

### 8. WORK_ORDER (Orden de Trabajo)

```typescript
interface WorkOrder {
  id: string;              // UUID interno
  number: string;          // Número legible (OT-2024-00001)
  status: WorkOrderStatus;
  
  // Relaciones
  customerId: string;      // FK a Customer
  vehicleId: string;       // FK a Vehicle
  technicianId?: string;     // FK a User (opcional)
  quoteId?: string;        // FK a Quote (si viene de presupuesto)
  invoiceId?: string;      // FK a Invoice (una vez facturada)
  
  // Items
  items: WorkOrderItem[];
  
  // Checklists
  entryChecklist?: Checklist;
  exitChecklist?: Checklist;
  
  // Fotos
  entryPhotos: string[];   // URLs cloud storage
  exitPhotos: string[];
  
  // Tiempos
  scheduledDate?: Date;    // Turno agendado
  startedAt?: Date;          // Comenzó trabajo
  completedAt?: Date;      // Trabajo terminado
  deliveredAt?: Date;      // Vehículo entregado
  
  // Totales (calculados)
  totalProducts: number;   // Suma de items tipo PRODUCT
  totalServices: number;   // Suma de items tipo SERVICE
  total: number;           // Total general
  
  // Metadata
  notes: string;           // Observaciones internas
  createdAt: Date;
  updatedAt: Date;
}

type WorkOrderStatus = 
  | 'QUOTE_PENDING'      // Presupuesto pendiente aprobación
  | 'QUOTE_APPROVED'   // Presupuesto aprobado
  | 'CONFIRMED'        // OT confirmada, esperando vehículo
  | 'WAITING'          // Vehículo recibido, en espera
  | 'IN_PROGRESS'      // Trabajando
  | 'QUALITY_CONTROL'  // Control de calidad
  | 'READY'            // Listo para entregar
  | 'DELIVERED'        // Entregado y facturado
  | 'CANCELLED';       // Cancelada
```

**Generación de Número:**
```typescript
// Formato: OT-AÑO-SECUENCIA
// Ejemplo: OT-2024-00001, OT-2024-00002
async function generateWorkOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const lastOrder = await getLastWorkOrderOfYear(year);
  const sequence = lastOrder ? lastOrder.sequence + 1 : 1;
  return `OT-${year}-${String(sequence).padStart(5, '0')}`;
}
```

**Relaciones:**
- N:1 con `CUSTOMER`
- N:1 con `VEHICLE`
- N:1 con `USER` (técnico)
- 1:1 con `INVOICE` (opcional)
- 1:N con `WORK_ORDER_ITEM`
- 1:N con `CHECKLIST`

---

### 9. WORK_ORDER_ITEM (Items de OT)

```typescript
interface WorkOrderItem {
  id: string;
  workOrderId: string;     // FK a WorkOrder
  type: 'PRODUCT' | 'SERVICE';
  
  // Uno de estos dos según type
  productId?: string;      // FK a Product (si type = PRODUCT)
  serviceId?: string;        // FK a Service (si type = SERVICE)
  
  // Datos duplicados para histórico (precios no cambian)
  name: string;            // Nombre en momento de creación
  quantity: number;
  unitPrice: number;       // Precio aplicado
  subtotal: number;        // quantity × unitPrice
  
  // Para productos
  stockConsumed?: boolean; // ¿Ya se descontó del stock?
  
  createdAt: Date;
}
```

**Validaciones:**
- Si `type = 'PRODUCT'`, `productId` es requerido
- Si `type = 'SERVICE'`, `serviceId` es requerido
- `quantity` > 0
- `unitPrice` >= 0

---

### 10. CHECKLIST (Checklists de Ingreso/Salida)

```typescript
interface Checklist {
  id: string;
  workOrderId: string;     // FK a WorkOrder
  type: 'ENTRY' | 'EXIT';  // Ingreso o Control Calidad
  
  items: ChecklistItem[];
  
  completedAt?: Date;
  completedBy?: string;    // FK a User
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

interface ChecklistItem {
  id: string;
  checklistId: string;
  description: string;     // "Estado pintura", "Funcionamiento eléctrico"
  isChecked: boolean;
  notes?: string;          // Observaciones específicas
  photos?: string[];       // URLs de fotos del ítem
}
```

**Checklist de Ingreso (ENTRY) - Sugerido:**
- Estado general del vehículo
- Estado de la pintura
- Kilometraje
- Nivel de combustible
- Daños preexistentes (fotos)
- Objetos personales en vehículo

**Checklist de Salida (EXIT) - Sugerido:**
- Trabajo completado según especificaciones
- Funcionamiento correcto
- Limpieza del vehículo
- Estado post-instalación

---

### 11. INVOICE (Facturas)

```typescript
interface Invoice {
  id: string;
  
  // Datos del comprobante
  invoiceNumber: string;   // 0001-00000123 (punto venta-número)
  invoiceType: 'A' | 'B' | 'M' | 'CREDIT' | 'DEBIT';
  
  // Datos fiscales
  caeCode: string;         // Código Autorización Electrónica
  caeExpiryDate: Date;     // Vencimiento CAE
  
  // Datos del receptor
  customerId?: string;     // FK a Customer (si existe)
  customerName: string;    // Denominación
  customerDocType?: 'DNI' | 'CUIT' | 'CUIL';
  customerDocNumber?: string;
  customerAddress?: string;
  
  // Datos del emisor (configuración sistema)
  sellerName: string;        // "RPM Accesorios y Equipamiento"
  sellerCuit: string;        // CUIT del negocio
  sellerAddress: string;
  sellerIvaCondition: string; // "Responsable Inscripto"
  
  // Fecha
  date: Date;
  
  // Totales
  subtotal: number;        // Sin impuestos
  taxRate: number;         // 21% (generalmente)
  taxAmount: number;
  total: number;
  
  // Pago
  paymentMethod: 'CASH' | 'TRANSFER' | 'DEBIT' | 'CREDIT' | 'MIXED';
  paymentMethods?: PaymentMethodDetail[]; // Si es MIXED
  
  // Relaciones
  workOrderId?: string;    // FK a WorkOrder (opcional)
  items: InvoiceItem[];
  
  // Notas de crédito/débito
  relatedInvoiceId?: string; // Factura original (NC/ND)
  
  // Metadata
  status: 'PENDING' | 'AUTHORIZED' | 'CANCELLED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentMethodDetail {
  method: 'CASH' | 'TRANSFER' | 'DEBIT' | 'CREDIT';
  amount: number;
  reference?: string;      // Nro transferencia, últimos 4 tarjeta
}

interface InvoiceItem {
  id: string;
  invoiceId: string;
  
  type: 'PRODUCT' | 'SERVICE';
  productId?: string;
  serviceId?: string;
  
  // Datos snapshot
  code: string;            // SKU o código servicio
  description: string;     // Nombre
  quantity: number;
  unitPrice: number;
  subtotal: number;
  
  // Impuestos
  taxRate: number;         // 21%, 10.5%, 0%
  taxAmount: number;
  total: number;
}
```

**Relaciones:**
- N:1 con `CUSTOMER`
- 1:1 con `WORK_ORDER` (opcional)
- 1:N con `INVOICE_ITEM`

---

### 12. CASH_REGISTER (Cierre de Caja)

```typescript
interface CashRegister {
  id: string;
  
  // Identificación
  date: Date;              // Fecha del cierre
  // branchId?: string;    // Para Fase 4 (multi-sucursal)
  
  // Apertura
  openingAmount: number;   // Efectivo inicial
  openedAt: Date;
  openedBy: string;        // FK a User
  
  // Cierre
  closingAmount?: number;  // Efectivo contado
  closedAt?: Date;
  closedBy?: string;         // FK a User
  
  // Totales del sistema
  totalSales: number;        // Suma de facturas
  totalByPaymentMethod: {
    cash: number;
    transfer: number;
    debit: number;
    credit: number;
  };
  
  // Gastos
  totalExpenses: number;
  expenses: CashExpense[];
  
  // Arqueo
  expectedCash: number;    // opening + cashSales - expenses
  actualCash?: number;     // closingAmount
  difference?: number;     // actual - expected
  
  // Estado
  status: 'OPEN' | 'CLOSED' | 'VERIFIED';
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

interface CashExpense {
  id: string;
  cashRegisterId: string;
  description: string;     // "Delivery", "Envases", "Viáticos"
  amount: number;
  category: 'DELIVERY' | 'SUPPLIES' | 'MAINTENANCE' | 'OTHER';
  receiptNumber?: string;  // Nro comprobante
  createdAt: Date;
}
```

**Relaciones:**
- N:1 con `USER` (quien abre/cierra)
- 1:N con `CASH_EXPENSE`

---

### 13. WEB_APPOINTMENT (Turnos Online)

```typescript
interface WebAppointment {
  id: string;
  
  // Datos del solicitante
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  
  // Datos del vehículo
  vehiclePlate: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  
  // Servicio solicitado
  serviceType: string;     // "Instalación LED", "Tratamiento cerámico", etc
  notes?: string;
  
  // Turno
  requestedDate: Date;
  requestedTime?: 'MORNING' | 'AFTERNOON' | 'SPECIFIC';
  specificTime?: string;   // Si requestedTime = SPECIFIC
  
  // Estado
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  
  // Relación interna
  workOrderId?: string;      // Si se convierte en OT
  
  // Procesamiento
  reviewedBy?: string;       // FK a User (quién revisó)
  reviewedAt?: Date;
  rejectionReason?: string;
  
  createdAt: Date;
  confirmedAt?: Date;
  updatedAt: Date;
}
```

---

### 14. PUBLIC_GALLERY (Galería Web)

```typescript
interface PublicGallery {
  id: string;
  workOrderId: string;     // FK a WorkOrder
  
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  
  description?: string;      // "Instalación barras LED Toyota Hilux"
  tags?: string[];           // ["LED", "Hilux", "Iluminación"]
  
  isPublic: boolean;         // Mostrar en web pública
  sortOrder: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Índices Recomendados (Performance)

### Índices Únicos
```sql
-- Evitar duplicados
CREATE UNIQUE INDEX idx_product_sku ON Product(sku);
CREATE UNIQUE INDEX idx_vehicle_plate ON Vehicle(licensePlate);
CREATE UNIQUE INDEX idx_invoice_number ON Invoice(invoiceNumber);
CREATE UNIQUE INDEX idx_work_order_number ON WorkOrder(number);
```

### Índices de Búsqueda
```sql
-- Búsquedas frecuentes
CREATE INDEX idx_customer_phone ON Customer(phone);
CREATE INDEX idx_customer_name ON Customer(fullName);
CREATE INDEX idx_product_category ON Product(categoryId);
CREATE INDEX idx_product_stock ON Product(stock, minStock);
CREATE INDEX idx_work_order_customer ON WorkOrder(customerId);
CREATE INDEX idx_work_order_vehicle ON WorkOrder(vehicleId);
CREATE INDEX idx_work_order_status ON WorkOrder(status);
CREATE INDEX idx_work_order_date ON WorkOrder(createdAt);
CREATE INDEX idx_invoice_date ON Invoice(date);
CREATE INDEX idx_cash_register_date ON CashRegister(date);
```

### Índices de Foreign Keys
```sql
-- Optimizar joins
CREATE INDEX idx_vehicle_customer ON Vehicle(customerId);
CREATE INDEX idx_work_order_technician ON WorkOrder(technicianId);
CREATE INDEX idx_work_order_invoice ON WorkOrder(invoiceId);
CREATE INDEX idx_invoice_customer ON Invoice(customerId);
CREATE INDEX idx_invoice_work_order ON Invoice(workOrderId);
```

---

## Reglas de Integridad Referencial

### Borrado (Soft Delete)

Todas las entidades principales usan `isActive` para soft delete:

```typescript
// En lugar de DELETE, hacer:
await prisma.product.update({
  where: { id: productId },
  data: { isActive: false }
});
```

### Cascada de Datos

| Entidad Padre | Entidad Hija | Comportamiento |
|---------------|--------------|----------------|
| Customer | Vehicle | Protegido (no borrar si tiene vehículos) |
| Customer | WorkOrder | Protegido (no borrar si tiene OTs) |
| Vehicle | WorkOrder | Protegido (no borrar si tiene OTs) |
| Product | WorkOrderItem | Protegido (no borrar si fue usado) |
| Category | Product | Protegido (no borrar si tiene productos) |
| WorkOrder | WorkOrderItem | CASCADE (borrar items si borra OT) |
| WorkOrder | Checklist | CASCADE |
| Invoice | InvoiceItem | CASCADE |
| CashRegister | CashExpense | CASCADE |

---

## Esquema Prisma Sugerido

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  role          UserRole
  isActive      Boolean   @default(true)
  passwordHash  String?
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  cashRegistersOpened  CashRegister[] @relation("OpenedBy")
  cashRegistersClosed  CashRegister[] @relation("ClosedBy")
  workOrders          WorkOrder[]
  checklistsCompleted Checklist[]    @relation("CompletedBy")

  @@map("users")
}

enum UserRole {
  ADMIN
  SELLER
  TECHNICIAN
  CASHIER
  WAREHOUSE
}

model Customer {
  id             String         @id @default(uuid())
  fullName       String
  phone          String
  phoneAlt       String?
  email          String?
  documentType   DocumentType?
  documentNumber String?
  address        String?
  notes          String?
  isActive       Boolean        @default(true)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  // Relations
  vehicles    Vehicle[]
  workOrders  WorkOrder[]
  invoices    Invoice[]

  @@index([phone])
  @@index([fullName])
  @@map("customers")
}

enum DocumentType {
  DNI
  CUIT
  CUIL
  PASSPORT
}

model Vehicle {
  id           String       @id @default(uuid())
  licensePlate String       @unique
  brand        String
  model        String
  year         Int
  type         VehicleType
  color        String?
  notes        String?
  isActive     Boolean      @default(true)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  // Relations
  customerId String
  customer   Customer     @relation(fields: [customerId], references: [id])
  workOrders WorkOrder[]

  @@index([customerId])
  @@map("vehicles")
}

enum VehicleType {
  COMPACT
  SEDAN
  SUV
  PICKUP_SMALL
  PICKUP_LARGE
  TRUCK_4X4
}

model Product {
  id          String    @id @default(uuid())
  sku         String    @unique
  name        String
  description String?
  costPrice   Decimal   @db.Decimal(10, 2)
  salePrice   Decimal   @db.Decimal(10, 2)
  stock       Int       @default(0)
  minStock    Int       @default(0)
  supplier    String?
  barcode     String?
  location    String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  categoryId String
  category   Category        @relation(fields: [categoryId], references: [id])
  workOrderItems WorkOrderItem[]
  invoiceItems   InvoiceItem[]
  serviceKits    ServiceKit[]

  @@index([categoryId])
  @@index([stock, minStock])
  @@map("products")
}

model Category {
  id                 String    @id @default(uuid())
  name               String    @unique
  description        String?
  defaultMarginPercent Decimal @db.Decimal(5, 2)
  color              String?
  sortOrder          Int       @default(0)
  isActive           Boolean   @default(true)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // Relations
  products Product[]

  @@map("categories")
}

model Service {
  id             String             @id @default(uuid())
  name           String
  description    String?
  baseCost       Decimal            @db.Decimal(10, 2)
  timeMinutes    Int
  vehicleFactors Json               // { COMPACT: 1.0, SEDAN: 1.1, ... }
  isActive       Boolean            @default(true)
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  // Relations
  workOrderItems WorkOrderItem[]
  invoiceItems   InvoiceItem[]
  serviceKits    ServiceKit[]

  @@map("services")
}

model ServiceKit {
  id          String  @id @default(uuid())
  quantity    Int
  isOptional  Boolean @default(false)

  // Relations
  serviceId String
  service   Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])

  @@unique([serviceId, productId])
  @@map("service_kits")
}

model WorkOrder {
  id             String            @id @default(uuid())
  number         String            @unique
  status         WorkOrderStatus
  scheduledDate  DateTime?
  startedAt      DateTime?
  completedAt    DateTime?
  deliveredAt    DateTime?
  totalProducts  Decimal           @db.Decimal(10, 2) @default(0)
  totalServices  Decimal           @db.Decimal(10, 2) @default(0)
  total          Decimal           @db.Decimal(10, 2) @default(0)
  notes          String?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  // Relations
  customerId   String
  customer     Customer          @relation(fields: [customerId], references: [id])
  vehicleId    String
  vehicle      Vehicle           @relation(fields: [vehicleId], references: [id])
  technicianId String?
  technician   User?             @relation(fields: [technicianId], references: [id])
  invoiceId    String?           @unique
  invoice      Invoice?          @relation(fields: [invoiceId], references: [id])
  items        WorkOrderItem[]
  checklists   Checklist[]

  @@index([customerId])
  @@index([vehicleId])
  @@index([status])
  @@index([createdAt])
  @@map("work_orders")
}

enum WorkOrderStatus {
  QUOTE_PENDING
  QUOTE_APPROVED
  CONFIRMED
  WAITING
  IN_PROGRESS
  QUALITY_CONTROL
  READY
  DELIVERED
  CANCELLED
}

model WorkOrderItem {
  id        String          @id @default(uuid())
  type      WorkOrderItemType
  name      String          // Snapshot nombre
  quantity  Int
  unitPrice Decimal         @db.Decimal(10, 2)
  subtotal  Decimal         @db.Decimal(10, 2)
  stockConsumed Boolean     @default(false)

  // Relations
  workOrderId String
  workOrder   WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  productId   String?
  product     Product?  @relation(fields: [productId], references: [id])
  serviceId   String?
  service     Service?  @relation(fields: [serviceId], references: [id])

  @@map("work_order_items")
}

enum WorkOrderItemType {
  PRODUCT
  SERVICE
}

model Checklist {
  id          String         @id @default(uuid())
  type        ChecklistType
  completedAt DateTime?
  notes       String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  // Relations
  workOrderId String
  workOrder   WorkOrder      @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  completedBy String?
  completedByUser User?      @relation("CompletedBy", fields: [completedBy], references: [id])
  items       ChecklistItem[]

  @@unique([workOrderId, type])
  @@map("checklists")
}

enum ChecklistType {
  ENTRY
  EXIT
}

model ChecklistItem {
  id          String    @id @default(uuid())
  description String
  isChecked   Boolean   @default(false)
  notes       String?
  photos      String[]  // Array de URLs

  // Relations
  checklistId String
  checklist   Checklist @relation(fields: [checklistId], references: [id], onDelete: Cascade)

  @@map("checklist_items")
}

model Invoice {
  id               String          @id @default(uuid())
  invoiceNumber    String          @unique
  invoiceType      InvoiceType
  caeCode          String
  caeExpiryDate    DateTime
  customerName     String
  customerDocType  DocumentType?
  customerDocNumber String?
  customerAddress  String?
  sellerName       String
  sellerCuit       String
  sellerAddress      String
  sellerIvaCondition String
  date             DateTime
  subtotal         Decimal         @db.Decimal(10, 2)
  taxRate          Decimal         @db.Decimal(5, 2)
  taxAmount        Decimal         @db.Decimal(10, 2)
  total            Decimal         @db.Decimal(10, 2)
  paymentMethod    PaymentMethod
  paymentMethods   Json?           // Para pagos mixtos
  status           InvoiceStatus   @default(AUTHORIZED)
  notes            String?
  relatedInvoiceId String?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt

  // Relations
  customerId  String?
  customer    Customer?     @relation(fields: [customerId], references: [id])
  workOrder   WorkOrder?
  items       InvoiceItem[]

  @@index([date])
  @@index([customerId])
  @@map("invoices")
}

enum InvoiceType {
  A
  B
  M
  CREDIT
  DEBIT
}

enum InvoiceStatus {
  PENDING
  AUTHORIZED
  CANCELLED
}

enum PaymentMethod {
  CASH
  TRANSFER
  DEBIT
  CREDIT
  MIXED
}

model InvoiceItem {
  id          String    @id @default(uuid())
  type        WorkOrderItemType
  code        String    // SKU o código servicio
  description String
  quantity    Int
  unitPrice   Decimal   @db.Decimal(10, 2)
  subtotal    Decimal   @db.Decimal(10, 2)
  taxRate     Decimal   @db.Decimal(5, 2)
  taxAmount   Decimal   @db.Decimal(10, 2)
  total       Decimal   @db.Decimal(10, 2)

  // Relations
  invoiceId String
  invoice   Invoice   @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  productId String?
  product   Product?  @relation(fields: [productId], references: [id])
  serviceId String?
  service   Service?  @relation(fields: [serviceId], references: [id])

  @@map("invoice_items")
}

model CashRegister {
  id             String       @id @default(uuid())
  date           DateTime     @db.Date
  openingAmount  Decimal      @db.Decimal(10, 2)
  closingAmount  Decimal?     @db.Decimal(10, 2)
  openedAt       DateTime     @default(now())
  closedAt       DateTime?
  totalSales     Decimal      @db.Decimal(10, 2) @default(0)
  totalByPayment Json         // { cash, transfer, debit, credit }
  totalExpenses  Decimal      @db.Decimal(10, 2) @default(0)
  expectedCash   Decimal      @db.Decimal(10, 2)
  actualCash     Decimal?     @db.Decimal(10, 2)
  difference     Decimal?     @db.Decimal(10, 2)
  status         CashRegisterStatus @default(OPEN)
  notes          String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  openedBy String
  opener   User         @relation("OpenedBy", fields: [openedBy], references: [id])
  closedBy String?
  closer   User?        @relation("ClosedBy", fields: [closedBy], references: [id])
  expenses CashExpense[]

  @@unique([date])
  @@map("cash_registers")
}

enum CashRegisterStatus {
  OPEN
  CLOSED
  VERIFIED
}

model CashExpense {
  id            String           @id @default(uuid())
  description   String
  amount        Decimal          @db.Decimal(10, 2)
  category      ExpenseCategory
  receiptNumber String?
  createdAt     DateTime         @default(now())

  // Relations
  cashRegisterId String
  cashRegister   CashRegister     @relation(fields: [cashRegisterId], references: [id], onDelete: Cascade)

  @@map("cash_expenses")
}

enum ExpenseCategory {
  DELIVERY
  SUPPLIES
  MAINTENANCE
  OTHER
}

model WebAppointment {
  id              String               @id @default(uuid())
  customerName    String
  customerPhone   String
  customerEmail   String?
  vehiclePlate    String
  vehicleBrand    String?
  vehicleModel    String?
  serviceType     String
  notes           String?
  requestedDate   DateTime
  requestedTime   AppointmentTime?
  specificTime    String?
  status          AppointmentStatus    @default(PENDING)
  rejectionReason String?
  createdAt       DateTime             @default(now())
  confirmedAt     DateTime?
  updatedAt       DateTime             @updatedAt

  // Relations
  workOrderId String?
  workOrder   WorkOrder?  @relation(fields: [workOrderId], references: [id])
  reviewedBy  String?
  reviewer    User?       @relation(fields: [reviewedBy], references: [id])

  @@index([status])
  @@index([requestedDate])
  @@map("web_appointments")
}

enum AppointmentTime {
  MORNING
  AFTERNOON
  SPECIFIC
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  REJECTED
  COMPLETED
  CANCELLED
}

model PublicGallery {
  id              String    @id @default(uuid())
  beforePhotoUrl  String
  afterPhotoUrl   String
  description     String?
  tags            String[]
  isPublic        Boolean   @default(false)
  sortOrder       Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  workOrderId String    @unique
  workOrder   WorkOrder @relation(fields: [workOrderId], references: [id])

  @@map("public_gallery")
}

model User {
  id            String    @id
  name          String
  email         String
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]

  @@unique([email])
  @@map("user")
}

model UserRole {
  id        String   @id @default(uuid())
  email     String   @unique
  role      String   // ADMIN, SELLER, TECHNICIAN, CASHIER, USER
  name      String?  // Nombre para identificar quién es
  notes     String?  // Observaciones
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([role])
  @@map("user_role")
}

---

## 12. Flujo de Importación de Productos

### 12.1 Arquitectura del Importador

```typescript
// Estado global del importador (Zustand)
interface ImportState {
  // Navegación
  currentStep: number;        // 0-3: Upload → Configure → Review → Execute
  
  // Datos del archivo
  fileData: FileData | null;  // Resultado del análisis CSV
  
  // Configuración
  configuration: {
    mapping: ColumnMapping;     // CSV → DB field mapping
    options: ImportOptions;     // skipStockLessThanOne, duplicateAction
  };
  
  // Validación
  validationResult: ValidationResult | null;
  
  // Categorías
  categoryMappings: CategoryMapping[];
  
  // Resultados
  importResults: ImportResult | null;
  
  // Estado UI
  isProcessing: boolean;
}
```

### 12.2 Pipeline de Procesamiento

```
CSV Raw → Sanitización → Análisis → Mapeo → Transformación → Validación → Importación
    │           │           │        │           │            │
    ▼           ▼           ▼        ▼           ▼            ▼
[FormData] [Rows] [AnalyzeResult] [MappedData] [ValidData] [Products]
```

**Etapas Detalladas:**

1. **Sanitización**: Filas con número incorrecto de columnas → descartar
2. **Análisis**: Detectar encoding, delimitador, headers únicos
3. **Mapeo**: Usuario asigna columnas CSV a campos DB
4. **Transformación**: Aplicar funciones (capitalize, number parsing, etc.)
5. **Validación**: Contra DB existente (duplicados, categorías)
6. **Importación**: Batch processing en chunks de 100

### 12.3 Estructura de Datos de Importación

```typescript
// Resultado del análisis inicial
interface FileData {
  columns: string[];                    // Headers detectados
  preview: Record<string, string>[];     // Primeras 5 filas
  totalRows: number;                     // Total filas válidas
  file: File;                           // Archivo original
  delimiter?: string;                   // ',' | ';' | '\t'
  encoding?: string;                    // 'utf-8' | 'latin-1'
  skippedRows?: number;                  // Filas descartadas
}

// Mapeo de columnas
interface ColumnMapping {
  [dbField: string]: {
    column: string;           // Nombre columna CSV
    transform: string | string[]; // Funciones de transformación
    skipEmpty?: boolean;      // Omitir si vacío
    defaultValue?: string;    // Valor por defecto
  };
}

// Opciones globales
interface ImportOptions {
  skipStockLessThanOne: boolean;
  duplicateAction: 'skip' | 'create_with_suffix';
  defaultCategoryName?: string;
}

// Resultado de validación
interface ValidationResult {
  valid: ProductWithCategoryInput[];
  invalid: InvalidRow[];
  stats: ValidationStats;
  categoriesToCreate: Category[];
}
```

### 12.4 Transformadores Disponibles

```typescript
interface Transformer {
  name: string;
  fn: (value: string) => any;
  applicableTo: ('string' | 'number' | 'decimal')[];
}

const TRANSFORMERS: Record<string, Transformer> = {
  'capitalize_trim': {
    name: 'Capitalizar y limpiar',
    fn: (v) => v.replace(/\b\w/g, l => l.toUpperCase()).trim(),
    applicableTo: ['string']
  },
  'uppercase_trim': {
    name: 'Mayúsculas y limpiar',
    fn: (v) => v.toUpperCase().trim(),
    applicableTo: ['string']
  },
  'resilient_decimal': {
    name: 'Número español a decimal',
    fn: (v) => parseFloat(v.replace('.', '').replace(',', '.')),
    applicableTo: ['decimal']
  },
  'round_2': {
    name: 'Redondear a 2 decimales',
    fn: (v) => Math.round(v * 100) / 100,
    applicableTo: ['decimal']
  }
};
```

### 12.5 Manejo de Errores y Validaciones

```typescript
interface ImportError {
  row: number;              // Número de fila
  field?: string;           // Campo con error
  value: string;            // Valor que causó error
  error: string;            // Mensaje de error
  severity: 'error' | 'warning'; // Gravedad
}

// Validaciones por campo
const FIELD_VALIDATIONS = {
  name: {
    required: true,
    maxLength: 200,
    pattern: /^[a-zA-Z0-9\s\-_]+$/,
    error: 'Nombre inválido (solo letras, números, espacios, guiones)'
  },
  costPrice: {
    required: false,
    min: 0,
    max: 999999.99,
    error: 'Precio de costo debe ser positivo y máximo 999,999.99'
  },
  stock: {
    required: false,
    min: 0,
    max: 999999,
    integer: true,
    error: 'Stock debe ser entero positivo y máximo 999,999'
  }
};
```

### 12.6 Performance y Escalabilidad

```typescript
// Configuración de batch processing
const BATCH_CONFIG = {
  chunkSize: 100,              // Productos por lote
  maxConcurrency: 5,            // Lotes simultáneos
  timeout: 30000,               // 30s por lote
  retryAttempts: 3,            // Reintentos por lote
};

// Límites del sistema
const LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxRows: 50000,               // 50k filas
  maxColumns: 50,               // 50 columnas
  processingTimeout: 300000    // 5 minutos total
};

// Métricas de rendimiento
interface ImportMetrics {
  startTime: Date;
  endTime?: Date;
  rowsProcessed: number;
  rowsPerSecond: number;
  memoryUsage: number;
  errors: ImportError[];
}
```

## 13. Migraciones de Datos Iniciales

### Seed de Categorías
```typescript
const categories = [
  { name: 'Iluminación LED', defaultMarginPercent: 40 },
  { name: 'Estética Vehicular', defaultMarginPercent: 50 },
  { name: 'Tratamientos Cerámicos', defaultMarginPercent: 60 },
  { name: 'Limpieza Detallada', defaultMarginPercent: 50 },
  { name: 'Accesorios Off-Road', defaultMarginPercent: 35 },
  { name: 'Polarizados', defaultMarginPercent: 55 },
];
```

### Seed de Servicios Base
```typescript
const services = [
  {
    name: 'Instalación barras LED',
    baseCost: 15000,
    timeMinutes: 60,
    vehicleFactors: {
      COMPACT: 1.0, SEDAN: 1.1, SUV: 1.2,
      PICKUP_SMALL: 1.3, PICKUP_LARGE: 1.5, TRUCK_4X4: 1.6
    }
  },
  {
    name: 'Instalación faros antiniebla',
    baseCost: 12000,
    timeMinutes: 45,
    vehicleFactors: { /* ... */ }
  },
  // ... más servicios
];
```

---

## Convenciones de Nomenclatura

### Tablas
- Plural, snake_case: `work_orders`, `invoice_items`

### Columnas
- snake_case: `customer_id`, `created_at`
- IDs: `id` (PK), `xxx_id` (FK)
- Timestamps: `created_at`, `updated_at`
- Booleanos: `is_xxx`: `is_active`, `is_public`

### Enums
- PascalCase: `WorkOrderStatus`, `InvoiceType`
- Valores: UPPER_SNAKE_CASE: `QUOTE_PENDING`, `IN_PROGRESS`

### Tipos TypeScript
- Interfaces: PascalCase: `WorkOrder`, `InvoiceItem`
- Props: camelCase: `customerId`, `workOrderId`

---

## Estrategia de Backups

### Backups Automáticos
- **Frecuencia**: Diario a las 3 AM
- **Retención**: 7 días (semanal), 30 días (mensual)
- **Ubicación**: Cloud (AWS S3, Google Cloud Storage)

### Backups Manuales
- Antes de migraciones de datos
- Antes de deploys mayores
- On-demand por admin

### Recuperación (DR)
- RPO (Recovery Point Objective): 24 horas
- RTO (Recovery Time Objective): 2 horas
