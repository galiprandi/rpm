# 🔧 FASE 2: Gestión de Taller

## Objetivo
Digitalizar la operación del taller: órdenes de trabajo, presupuestos, instalaciones y control de calidad.

## Dependencia
**REQUIERE FASE 1 completada y estable**

---

## Módulos Incluidos

### 1. Gestión de Clientes

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Ficha cliente** | P0 | Datos de contacto, documento, múltiples vehículos |
| **Historial** | P0 | Todas las OTs por cliente |
| **Búsqueda rápida** | P0 | Por nombre, teléfono o patente |

#### Campos Cliente:
```typescript
interface Customer {
  id: string;
  fullName: string;
  phone: string;           // Principal
  phoneAlt?: string;       // Alternativo (WhatsApp)
  email?: string;
  documentType: 'DNI' | 'CUIT' | 'CUIL';
  documentNumber: string;
  address?: string;
  notes?: string;          // Observaciones
  vehicles: Vehicle[];
  createdAt: Date;
}
```

### 2. Gestión de Vehículos / Activos

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Ficha activo** | P0 | Datos por identificador (patente o n° serie) |
| **Categorización flexible** | P0 | Vehículos, trailers, equipos de audio, otros |
| **Historial vinculado** | P0 | Todas las intervenciones por activo |
| **Fotos** | P1 | Antes/después de cada OT |

#### Modelo Vehicle (Activo Genérico):

El modelo `Vehicle` soporta tanto vehículos como equipos genéricos (trailers, audio, etc.):

```typescript
// Categorías disponibles
enum VehicleCategory {
  CAR = 'CAR',                    // Auto/Camioneta
  TRUCK = 'TRUCK',              // Camión
  SUV = 'SUV',                  // SUV/4x4
  PICKUP = 'PICKUP',            // Pickup
  MOTORCYCLE = 'MOTORCYCLE',    // Moto
  TRAILER = 'TRAILER',          // Trailer/Acoplado
  AUDIO_EQUIPMENT = 'AUDIO_EQUIPMENT',  // Equipos de audio
  ELECTRIC_SCOOTER = 'ELECTRIC_SCOOTER', // Monopatín eléctrico
  OTHER = 'OTHER',              // Otro equipo
}

interface Vehicle {
  id: string;
  identifier: string;          // Patente (vehículos) o N° Serie/Código (equipos) - ÚNICO
  
  category: VehicleCategory;   // Determina qué campos mostrar y validar
  
  // Campos para vehículos (opcionales, requeridos si es vehículo)
  brand?: string;              // Toyota, Ford
  model?: string;              // Hilux, Ranger
  year?: number;               // 2024
  color?: string;              // Rojo
  
  // Campos para equipos genéricos (opcionales, usados si no es vehículo)
  equipmentName?: string;      // "Parlante Sony GTK-XB90"
  equipmentType?: string;      // "Equipo de audio", "Monopatín eléctrico"
  description?: string;        // Detalles adicionales del equipo
  
  // Común
  notes?: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper para determinar si es vehículo motorizado
const isMotorVehicle = (category: VehicleCategory): boolean => {
  return ['CAR', 'TRUCK', 'SUV', 'PICKUP', 'MOTORCYCLE'].includes(category);
};

// Helper para determinar si tiene odómetro (solo vehículos motorizados)
const hasOdometer = (category: VehicleCategory): boolean => {
  return ['CAR', 'TRUCK', 'SUV', 'PICKUP', 'MOTORCYCLE'].includes(category);
};
```

#### UI Adaptativa por Categoría:

```typescript
// Formulario condicional según categoría
const VehicleForm = ({ category }) => {
  const isVehicle = isMotorVehicle(category);
  const needsPatent = requiresPatent(category);
  
  return (
    <form>
      {/* Siempre visible */}
      <SelectCategory 
        value={category}
        options={[
          { value: 'CAR', label: 'Auto/Camioneta 🚗' },
          { value: 'SUV', label: 'SUV/4x4 🚙' },
          { value: 'PICKUP', label: 'Pickup 🛻' },
          { value: 'TRUCK', label: 'Camión 🚚' },
          { value: 'MOTORCYCLE', label: 'Moto 🏍️' },
          { value: 'TRAILER', label: 'Trailer/Acoplado 🚛' },
          { value: 'AUDIO_EQUIPMENT', label: 'Equipo de Audio 🔊' },
          { value: 'ELECTRIC_SCOOTER', label: 'Monopatín Eléctrico 🛴' },
          { value: 'OTHER', label: 'Otro Equipo 📦' },
        ]}
      />
      
      <Input 
        label={needsPatent ? 'Patente' : 'Código/N° Serie'} 
        placeholder={needsPatent ? 'AB123CD' : 'SN-12345'}
        required
      />
      
      {/* Campos condicionales: solo vehículos */}
      {isVehicle && (
        <>
          <Input label="Marca" placeholder="Toyota" required />
          <Input label="Modelo" placeholder="Hilux" required />
          <Input label="Año" type="number" placeholder="2024" />
          <Input label="Color" placeholder="Blanco" />
        </>
      )}
      
      {/* Campos condicionales: solo equipos */}
      {!isVehicle && (
        <>
          <Input 
            label="Nombre del Equipo" 
            placeholder="Parlante Sony GTK-XB90"
            required 
          />
          <Input 
            label="Tipo de Equipo" 
            placeholder="Equipo de audio portátil"
            required 
          />
          <Textarea 
            label="Descripción" 
            placeholder="Detalles adicionales del equipo..."
            rows={3}
          />
        </>
      )}
      
      <Textarea label="Notas" placeholder="Observaciones..." />
    </form>
  );
};
```

### 3. Servicios (Catálogo de Trabajos)

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Definición servicios** | P0 | Lista de trabajos estándar |
| **Costo base** | P0 | Precio referencia |
| **Factor vehículo** | P1 | Ajuste por tipo de vehículo |
| **Tiempo estimado** | P1 | Para agendamiento |
| **Productos incluidos** | P2 | Kits (servicio + insumos) |

Servicios típicos RPM:
```typescript
const defaultServices = [
  { name: 'Instalación barras LED', baseCost: 15000, timeMinutes: 60 },
  { name: 'Instalación faros antiniebla', baseCost: 12000, timeMinutes: 45 },
  { name: 'Aplicación vinilo PPF (capó)', baseCost: 35000, timeMinutes: 120 },
  { name: 'Polarizado luneta', baseCost: 8000, timeMinutes: 30 },
  { name: 'Tratamiento cerámico', baseCost: 45000, timeMinutes: 180 },
  { name: 'Limpieza ópticas', baseCost: 5000, timeMinutes: 20 },
  { name: 'Limpieza motor', baseCost: 8000, timeMinutes: 40 },
];
```

### 4. Presupuestos (Futuro - Post MVP)

> **Nota**: Para el MVP inicial solo implementaremos flujo express (OT directa). Los presupuestos se agregarán en iteración posterior.

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Generar presupuesto** | P2 | Productos + servicios |
| **Vencimiento** | P2 | Válido por N días (default 7) |
| **Aprobación cliente** | P2 | Confirmación explícita |
| **Rechazo/contraoferta** | P3 | Motivo del rechazo |

#### Estados Presupuesto (Futuro):
```
PENDIENTE → APROBADO → OT GENERADA
        ↘ RECHAZADO
        ↘ VENCIDO (auto después de N días)
```

### 5. Órdenes de Trabajo (OT) - MVP

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Creación directa (express)** | P0 | Sin presupuesto previo |
| **Kanban estados** | P0 | Visual del flujo |
| **Asignación técnico** | P0 | Quién hace el trabajo |
| **Checklist ingreso** | P1 | Estado del activo al recibir (odómetro solo vehículos) |
| **Consumo stock** | P0 | Productos usados |
| **Registro fotográfico** | P1 | Antes/después |
| **Checklist calidad** | P1 | Verificación antes entrega |
| **Cierre con pago** | P0 | Total y forma de pago (efectivo/transferencia/QR) |

#### Estados OT (Kanban):
```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  CONFIRMADA │──▶│   EN ESPERA │──▶│  EN PROCESO │──▶│  CONTROL QC │
│  (agendada) │   │ (en taller) │   │ (trabajando)│   │ (revisión)  │
└─────────────┘   └─────────────┘   └─────────────┘   └──────┬──────┘
                                                            │
┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  ENTREGADA  │◄──│   PAGADA    │◄──│    LISTO    │◄──────────┘
│  (cerrada)  │   │ (cierre)    │   │ (para retiro)│
└─────────────┘   └─────────────┘   └─────────────┘
```

#### Campos OT:
```typescript
interface WorkOrder {
  id: string;                    // Número OT (ej: OT-2024-0001)
  status: WorkOrderStatus;
  customerId: string;
  vehicleId: string;
  technicianId?: string;         // Asignado
  
  // Items
  items: WorkOrderItem[];        // Productos + servicios
  
  // Checklists
  entryChecklist?: Checklist;    // Ingreso (odómetro solo si aplica)
  exitChecklist?: Checklist;     // Control calidad
  
  // Fotos
  entryPhotos: string[];         // URLs fotos ingreso
  exitPhotos: string[];          // URLs fotos egreso
  
  // Tiempos
  scheduledDate?: Date;          // Turno agendado
  startedAt?: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  
  // Pago (MVP - sin facturación AFIP aún)
  payment?: {
    total: number;               // Total cobrado
    method: 'CASH' | 'TRANSFER' | 'QR' | 'CARD' | 'OTHER';  // Forma de pago
    notes?: string;              // Referencia transferencia, etc.
  };
  
  // Facturación (futuro - cuando se implemente AFIP)
  invoiceId?: string;            // Factura emitida (opcional)
  
  // Totales
  totalProducts: number;
  totalServices: number;
  total: number;
  
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Checklist de Ingreso (Condicional):

```typescript
// Items base para todos los activos
const baseEntryChecklist = [
  { id: 'keys', label: 'Llaves/Control recibido', required: true },
  { id: 'visual', label: 'Estado visual general documentado', required: true },
  { id: 'accessories', label: 'Accesorios guardados', required: false },
];

// Items solo para vehículos motorizados
const vehicleEntryChecklist = [
  { id: 'odometer', label: 'Odómetro registrado', required: true },
  { id: 'fuel', label: 'Nivel de combustible', required: false },
];

// Generar checklist según categoría
const generateEntryChecklist = (category: VehicleCategory) => {
  const items = [...baseEntryChecklist];
  if (hasOdometer(category)) {
    items.push(...vehicleEntryChecklist);
  }
  return items;
};
```

### 6. Gestión de Técnicos

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Ficha técnico** | P0 | Datos, especialidad |
| **Asignación OTs** | P0 | Quién trabaja qué |
| **Carga de trabajo** | P1 | Visual de ocupación |

### 7. Agenda/Turnos

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Vista calendario** | P0 | OTs agendadas por día |
| **Bloques horarios** | P1 | Mañana/tarde configurable |
| **Notificación** | P2 | WhatsApp/SMS recordatorio |

---

## Flujos de Usuario (MVP - Flujo Express)

### Flujo Principal: Instalación Express (MVP)

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│Cliente      │──▶│Busca cliente│──▶│Registra     │──▶│Crea OT      │
│solicita     │   │o activo     │   │activo       │   │directa      │
│instalación  │   │por identif. │   │(si no existe)│   │             │
└─────────────┘   └─────────────┘   └─────────────┘   └──────┬──────┘
                                                           │
┌─────────────┐   ┌─────────────┐   ┌─────────────┐        │
│Entrega      │◄──│Registra     │◄──│Completa     │◄───────┘
│activo       │   │pago         │   │trabajo      │
└─────────────┘   └─────────────┘   └─────────────┘
```

### Flujo Alternativo: Cliente Nuevo + OT Directa

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│Cliente      │──▶│Registra     │──▶│Registra     │──▶│Crea OT      │
│nuevo        │   │cliente      │   │activo       │   │directa      │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

> **Nota**: El flujo con presupuestos se implementará en iteración posterior (ver sección Presupuestos).

---

## Modelo de Datos FASE 2

### DB de Assets Normalizada (Marcas/Modelos)

Para evitar duplicados y construir una base de conocimiento:

```typescript
// Modelo de Marcas (normalizado)
interface VehicleMake {
  id: string;
  name: string;              // "Toyota", "Ford", "Sony" (capitalizado)
  normalizedName: string;    // "toyota", "ford", "sony" (para búsqueda)
  category: VehicleCategory[]; // [CAR, SUV, PICKUP] o [AUDIO_EQUIPMENT]
  isActive: boolean;
  createdAt: Date;
}

// Modelo de Modelos (normalizado)
interface VehicleModel {
  id: string;
  makeId: string;            // Relación con marca
  name: string;              // "Hilux", "Ranger", "GTK-XB90"
  normalizedName: string;    // "hilux", "ranger", "gtk-xb90"
  years: number[];           // [2020, 2021, 2022, 2023, 2024]
  isActive: boolean;
  createdAt: Date;
}

// Helper para normalizar (trim + lowercase)
const normalizeText = (text: string): string => {
  return text.trim().toLowerCase();
};

// Helper para capitalizar
const capitalizeText = (text: string): string => {
  return text.trim().replace(/\b\w/g, (char) => char.toUpperCase());
};
```

### UI para Selección/Creación de Marca/Modelo:

```typescript
// Componente de selección con autocreación
const MakeModelSelector = ({ category, onChange }) => {
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  
  return (
    <div>
      {/* Selector de Marca con búsqueda */}
      <CreatableSelect
        label="Marca"
        placeholder="Toyota, Ford, Sony..."
        options={makes}
        onCreateOption={async (input) => {
          // Crear nueva marca normalizada
          const newMake = await createMake({
            name: capitalizeText(input),
            category: [category],
          });
          return newMake;
        }}
        formatOptionLabel={(option) => option.name}
      />
      
      {/* Selector de Modelo con búsqueda */}
      <CreatableSelect
        label="Modelo"
        placeholder="Hilux, Ranger..."
        options={models}
        isDisabled={!selectedMake}
        onCreateOption={async (input) => {
          // Crear nuevo modelo normalizado
          const newModel = await createModel({
            makeId: selectedMake.id,
            name: capitalizeText(input),
          });
          return newModel;
        }}
      />
      
      {/* Selector de Año */}
      <Select
        label="Año"
        options={availableYears}
        placeholder="2024"
      />
    </div>
  );
};
```

```
┌─────────────────┐       ┌──────────────────────────────────────────┐       ┌─────────────────┐
│  VEHICLE_MAKE   │       │              VEHICLE                     │       │   WORK_ORDER    │
├─────────────────┤       │          (Activo Genérico)               │       ├─────────────────┤
│ id              │◄────┤ id                                       │◄────┤ id (OT-XXXX)    │
│ name            │       │ identifier (patente/serie)               │       │ status          │
│ normalizedName  │       │ category                                 │       │ customerId      │
│ category[]      │       │ makeId? (vehículos)  ─────────────────►  │       │ vehicleId       │
│ isActive        │       │ modelId? (vehículos) ───────────────┐    │       │ technicianId    │
└─────────────────┘       │ year? (vehículos)                      │   │       │ payment?        │
                          │ equipmentName? (equipos)               │   │       │ invoiceId?      │
                          │ equipmentType? (equipos)               │   │       │ scheduledDate   │
                          │ description? (equipos)                   │   │       │ total           │
                          │ customerId                               │   │       └─────────────────┘
                          └──────────────────────────────────────────┘   │
┌─────────────────┐                                                      │
│ VEHICLE_MODEL   │◄─────────────────────────────────────────────────────┘
├─────────────────┤
│ id              │
│ makeId          │
│ name            │
│ normalizedName  │
│ years[]         │
│ isActive        │
└─────────────────┘
┌─────────────────┐       ┌─────────────────┐       └─────────────────┘
│     QUOTE       │       │  WORK_ORDER_ITEM│              │
├─────────────────┤       ├─────────────────┤              │
│ id              │       │ workOrderId     │──────────────┘
│ customerId      │◄────┤ type (PROD/SERV)│
│ vehicleId       │       │ productId?      │◄─────────────┐
│ status          │       │ serviceId?      │◄─────────┐   │
│ validUntil      │       │ quantity        │          │   │
│ total           │       │ unitPrice       │          │   │
│ approvedAt      │       │ subtotal        │          │   │
└─────────────────┘       └─────────────────┘          │   │
                                                       │   │
┌─────────────────┐       ┌─────────────────┐         │   │
│  CHECKLIST      │       │    SERVICE      │◄──────────┘   │
├─────────────────┤       ├─────────────────┤               │
│ id              │       │ id              │               │
│ workOrderId     │◄────┤ name            │               │
│ type (ENTRY/EXIT)       │ baseCost        │               │
│ items[]         │       │ timeMinutes     │               │
│ completed       │       │ vehicleFactor   │               │
│ notes           │       │ description     │               │
└─────────────────┘       └─────────────────┘               │
                                                            │
                                                    ┌───────┘
                                                    ▼
                                            ┌─────────────────┐
                                            │     PHOTO       │
                                            ├─────────────────┤
                                            │ id              │
                                            │ workOrderId     │◄────┘
                                            │ type            │
                                            │ url             │
                                            │ description     │
                                            └─────────────────┘
```

---

## API Endpoints Fase 2

### Clientes
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/customers` | GET | Listar clientes | SELLER, TECHNICIAN, ADMIN |
| `/api/customers` | POST | Crear cliente | SELLER, ADMIN |
| `/api/customers/:id` | GET | Obtener cliente | SELLER, TECHNICIAN, ADMIN |
| `/api/customers/:id` | PUT | Actualizar cliente | SELLER, ADMIN |
| `/api/customers/search` | GET | Buscar por nombre/tel/patente | SELLER, TECHNICIAN, ADMIN |

### Activos/Vehículos (DB Normalizada)
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/vehicles` | GET | Listar activos | SELLER, TECHNICIAN, ADMIN |
| `/api/vehicles` | POST | Crear activo | SELLER, ADMIN |
| `/api/vehicles/:id` | GET | Obtener activo | SELLER, TECHNICIAN, ADMIN |
| `/api/vehicles/:id` | PUT | Actualizar activo | SELLER, ADMIN |
| `/api/vehicles/by-identifier/:identifier` | GET | Buscar por patente o n° serie | SELLER, TECHNICIAN, ADMIN |
| `/api/vehicles/:id/history` | GET | Historial de OTs del activo | SELLER, TECHNICIAN, ADMIN |

### Marcas/Modelos (Normalización)
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/vehicle-makes` | GET | Listar marcas | Todos |
| `/api/vehicle-makes` | POST | Crear marca (autocreación) | SELLER, ADMIN |
| `/api/vehicle-models` | GET | Listar modelos por marca | Todos |
| `/api/vehicle-models` | POST | Crear modelo (autocreación) | SELLER, ADMIN |

### Servicios
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/services` | GET | Listar servicios | Todos |
| `/api/services` | POST | Crear servicio | ADMIN |
| `/api/services/:id` | GET | Obtener servicio | Todos |
| `/api/services/:id/cost` | GET | Calcular costo por vehículo | SELLER, ADMIN |

### Presupuestos (Futuro)
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/quotes` | GET | Listar presupuestos | SELLER, ADMIN |
| `/api/quotes` | POST | Crear presupuesto | SELLER, ADMIN |
| `/api/quotes/:id` | GET | Obtener presupuesto | SELLER, ADMIN |
| `/api/quotes/:id/approve` | POST | Aprobar presupuesto | SELLER, ADMIN |
| `/api/quotes/:id/reject` | POST | Rechazar presupuesto | SELLER, ADMIN |
| `/api/quotes/:id/convert` | POST | Convertir a OT | SELLER, ADMIN |

> **Nota**: Presupuestos se implementarán post-MVP

### Órdenes de Trabajo
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/work-orders` | GET | Listar OTs con filtros | SELLER, TECHNICIAN, ADMIN |
| `/api/work-orders` | POST | Crear OT | SELLER, ADMIN |
| `/api/work-orders/:id` | GET | Obtener OT | SELLER, TECHNICIAN, ADMIN |
| `/api/work-orders/:id` | PUT | Actualizar OT | SELLER, ADMIN |
| `/api/work-orders/:id/status` | PUT | Cambiar estado | TECHNICIAN, ADMIN |
| `/api/work-orders/:id/assign` | POST | Asignar técnico | ADMIN |
| `/api/work-orders/:id/photos` | POST | Subir fotos | TECHNICIAN, ADMIN |
| `/api/work-orders/:id/checklist` | POST | Completar checklist | TECHNICIAN, ADMIN |
| `/api/work-orders/my` | GET | Mis OTs asignadas | TECHNICIAN |

### Técnicos
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/technicians` | GET | Listar técnicos | ADMIN |
| `/api/technicians/:id/workload` | GET | Carga de trabajo | ADMIN |

### Agenda
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/schedule` | GET | Agenda por día/semana | SELLER, TECHNICIAN, ADMIN |
| `/api/schedule/:date` | GET | Turnos del día | SELLER, TECHNICIAN, ADMIN |
| `/api/schedule/available` | GET | Horarios disponibles | SELLER, ADMIN |

---

## UI/UX Nuevas Pantallas (MVP)

1. **Ficha Cliente** - Datos + activos (vehículos/equipos) + historial
2. **Ficha Activo** - Datos según categoría + selector marca/modelo normalizado + historial OTs
3. **Nueva OT (Express)** - Creación directa sin presupuesto
4. **Kanban OTs** - Vista columnas por estado
5. **Detalle OT** - Todo el proceso + cierre con pago
6. **Agenda** - Calendario semanal con turnos
7. **Asignación Técnicos** - Quién hace qué y cuándo

> **Nota**: Pantalla de Presupuestos se agregará en iteración posterior

---

## Criterios de Éxito MVP OTs

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| **Tiempo promedio OT** | < tiempo estimado | 80% cumple estimación |
| **Tasa re-trabajos** | < 5% | OTs con garantía / Total |
| **Ocupación técnicos** | > 75% | Horas trabajadas / Disponibles |
| **Tiempo entrega** | < 48h desde ingreso | Promedio días OT |
| **Precisión datos** | > 95% | Marcas/modelos normalizados vs duplicados |
