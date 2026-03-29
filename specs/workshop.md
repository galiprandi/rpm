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

// Helper para determinar si usa patente
const requiresPatent = (category: VehicleCategory): boolean => {
  return ['CAR', 'TRUCK', 'SUV', 'PICKUP', 'TRAILER'].includes(category);
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

### 4. Presupuestos

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Generar presupuesto** | P0 | Productos + servicios |
| **Vencimiento** | P1 | Válido por N días (default 7) |
| **Aprobación cliente** | P0 | Confirmación explícita |
| **Rechazo/contraoferta** | P2 | Motivo del rechazo |

#### Estados Presupuesto:
```
PENDIENTE → APROBADO → OT GENERADA
        ↘ RECHAZADO
        ↘ VENCIDO (auto después de N días)
```

### 5. Órdenes de Trabajo (OT)

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| **Creación desde presupuesto** | P0 | O desde cero (emergencias) |
| **Kanban estados** | P0 | Visual del flujo |
| **Asignación técnico** | P0 | Quién hace el trabajo |
| **Checklist ingreso** | P1 | Estado del vehículo al recibir |
| **Consumo stock** | P0 | Productos usados |
| **Registro fotográfico** | P1 | Antes/después |
| **Checklist calidad** | P1 | Verificación antes entrega |

#### Estados OT (Kanban):
```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  CONFIRMADA │──▶│   EN ESPERA │──▶│  EN PROCESO │──▶│  CONTROL QC │
│  (agendada) │   │ (en taller) │   │ (trabajando)│   │ (revisión)  │
└─────────────┘   └─────────────┘   └─────────────┘   └──────┬──────┘
                                                            │
┌─────────────┐   ┌─────────────┐                           │
│  ENTREGADA  │◄──│    LISTO    │◄─────────────────────────┘
│  (cerrada)  │   │ (para retiro│
└─────────────┘   └─────────────┘
```

#### Campos OT:
```typescript
interface WorkOrder {
  id: string;                    // Número OT (ej: OT-2024-0001)
  status: WorkOrderStatus;
  customerId: string;
  vehicleId: string;
  technicianId?: string;         // Asignado
  
  // Presupuesto vinculado (opcional)
  quoteId?: string;
  
  // Items
  items: WorkOrderItem[];        // Productos + servicios
  
  // Checklists
  entryChecklist?: Checklist;    // Ingreso
  exitChecklist?: Checklist;     // Control calidad
  
  // Fotos
  entryPhotos: string[];         // URLs fotos ingreso
  exitPhotos: string[];          // URLs fotos egreso
  
  // Tiempos
  scheduledDate?: Date;          // Turno agendado
  startedAt?: Date;
  completedAt?: Date;
  deliveredAt?: Date;
  
  // Facturación
  invoiceId?: string;            // Factura emitida
  
  // Totales
  totalProducts: number;
  totalServices: number;
  total: number;
  
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}
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

## Flujos de Usuario

### Flujo 1: Cliente nuevo con presupuesto

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│Cliente      │──▶│Registra     │──▶│Registra     │──▶│Genera       │
│llega        │   │cliente      │   │vehículo     │   │presupuesto  │
└─────────────┘   └─────────────┘   └─────────────┘   └──────┬──────┘
                                                             │
┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│Entrega      │◄──│Trabajo y    │◄──│Presupuesto  │◄─────────┘
│vehículo     │   │facturación  │   │aprobado     │
└─────────────┘   └─────────────┘   └─────────────┘
```

### Flujo 2: Instalación express (sin presupuesto previo)

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│Cliente      │──▶│Busca cliente│──▶│Selecciona   │──▶│Crea OT      │
│solicita     │   │o vehículo   │   │servicio     │   │directa      │
│instalación  │   │por patente  │   │estándar     │   │             │
└─────────────┘   └─────────────┘   └─────────────┘   └──────┬──────┘
                                                           │
┌─────────────┐   ┌─────────────┐   ┌─────────────┐        │
│Entrega      │◄──│Factura desde│◄──│Completa     │◄───────┘
│vehículo     │   │OT           │   │trabajo      │
└─────────────┘   └─────────────┘   └─────────────┘
```

---

## Modelo de Datos FASE 2

```
┌─────────────────┐       ┌─────────────────────────────────┐       ┌─────────────────┐
│    CUSTOMER     │       │           VEHICLE               │       │   WORK_ORDER    │
├─────────────────┤       │        (Activo Genérico)        │       ├─────────────────┤
│ id              │◄────┤ id                              │◄────┤ id (OT-XXXX)    │
│ fullName        │       │ identifier (patente/serie)      │       │ status          │
│ phone           │       │ category                        │       │ customerId      │
│ documentType    │       │ brand? (vehículos)              │       │ vehicleId       │
│ documentNumber  │       │ model? (vehículos)              │       │ technicianId    │
│ address         │       │ year? (vehículos)               │       │ quoteId         │
│ notes           │       │ equipmentName? (equipos)        │       │ scheduledDate   │
└─────────────────┘       │ equipmentType? (equipos)        │       │ total           │
                          │ description? (equipos)          │       │ invoiceId       │
                          │ customerId                      │       └─────────────────┘
                          └─────────────────────────────────┘              │
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

### Activos/Vehículos
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/vehicles` | GET | Listar activos | SELLER, TECHNICIAN, ADMIN |
| `/api/vehicles` | POST | Crear activo | SELLER, ADMIN |
| `/api/vehicles/:id` | GET | Obtener activo | SELLER, TECHNICIAN, ADMIN |
| `/api/vehicles/:id` | PUT | Actualizar activo | SELLER, ADMIN |
| `/api/vehicles/by-identifier/:identifier` | GET | Buscar por patente o n° serie | SELLER, TECHNICIAN, ADMIN |
| `/api/vehicles/:id/history` | GET | Historial de OTs del activo | SELLER, TECHNICIAN, ADMIN |

### Servicios
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/services` | GET | Listar servicios | Todos |
| `/api/services` | POST | Crear servicio | ADMIN |
| `/api/services/:id` | GET | Obtener servicio | Todos |
| `/api/services/:id/cost` | GET | Calcular costo por vehículo | SELLER, ADMIN |

### Presupuestos
| Endpoint | Método | Descripción | Roles |
|----------|--------|-------------|-------|
| `/api/quotes` | GET | Listar presupuestos | SELLER, ADMIN |
| `/api/quotes` | POST | Crear presupuesto | SELLER, ADMIN |
| `/api/quotes/:id` | GET | Obtener presupuesto | SELLER, ADMIN |
| `/api/quotes/:id/approve` | POST | Aprobar presupuesto | SELLER, ADMIN |
| `/api/quotes/:id/reject` | POST | Rechazar presupuesto | SELLER, ADMIN |
| `/api/quotes/:id/convert` | POST | Convertir a OT | SELLER, ADMIN |

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

## UI/UX Nuevas Pantallas

1. **Ficha Cliente** - Datos + activos (vehículos/equipos) + historial
2. **Ficha Activo** - Datos según categoría + historial OTs
3. **Nuevo Presupuesto** - Buscador productos/servicios + preview
4. **Kanban OTs** - Vista columnas por estado
5. **Detalle OT** - Todo el proceso en una pantalla
6. **Agenda** - Calendario semanal con turnos
7. **Asignación Técnicos** - Quién hace qué y cuándo

---

## Criterios de Éxito FASE 2

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| **Tiempo promedio OT** | < tiempo estimado | 80% cumple estimación |
| **Tasa re-trabajos** | < 5% | OTs con garantía / Total |
| **Conversión presupuestos** | > 60% | Aprobados / Emitidos |
| **Ocupación técnicos** | > 75% | Horas trabajadas / Disponibles |
| **Tiempo entrega** | < 48h desde ingreso | Promedio días OT |
